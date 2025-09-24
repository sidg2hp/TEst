#!/usr/bin/env python3
"""
ROFL Worker for Confidential AI Agent Marketplace

This worker runs inside a TEE and handles:
1. Monitoring Sapphire contract for new sentiment requests
2. Fetching AI models from Hugging Face
3. Performing sentiment analysis
4. Submitting attested results back to the contract
"""

import asyncio
import json
import logging
import os
import time
from typing import Dict, List, Optional, Tuple
import aiohttp
import requests
from web3 import Web3
from web3.contract import Contract
from eth_account import Account
from transformers import pipeline
import torch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ROFLSentimentWorker:
    def __init__(self):
        # Load configuration from environment
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        self.sapphire_rpc_url = os.getenv('SAPPHIRE_RPC_URL', 'https://testnet.sapphire.oasis.dev')
        self.private_key = os.getenv('WORKER_PRIVATE_KEY')
        self.huggingface_token = os.getenv('HUGGINGFACE_TOKEN')
        self.rofl_app_id = os.getenv('ROFL_APP_ID')
        
        # Validate configuration
        if not all([self.contract_address, self.private_key, self.rofl_app_id]):
            raise ValueError("Missing required environment variables")
        
        # Initialize Web3 connection
        self.w3 = Web3(Web3.HTTPProvider(self.sapphire_rpc_url))
        self.account = Account.from_key(self.private_key)
        self.worker_address = self.account.address
        
        # Load contract ABI
        with open('/app/contract_abi.json', 'r') as f:
            self.contract_abi = json.load(f)
        
        # Initialize contract instance
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        # Initialize model cache
        self.model_cache: Dict[str, any] = {}
        self.last_processed_block = 0
        
        # Performance settings
        self.batch_size = 10
        self.polling_interval = 5  # seconds
        
        logger.info(f"ROFL Worker initialized with address: {self.worker_address}")
        logger.info(f"Contract address: {self.contract_address}")
        logger.info(f"ROFL App ID: {self.rofl_app_id}")

    async def start(self):
        """Start the main worker loop"""
        logger.info("Starting ROFL Sentiment Worker...")
        
        # Get latest block number
        self.last_processed_block = self.w3.eth.block_number
        logger.info(f"Starting from block: {self.last_processed_block}")
        
        # Main processing loop
        while True:
            try:
                await self.process_new_requests()
                await asyncio.sleep(self.polling_interval)
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(self.polling_interval * 2)

    async def process_new_requests(self):
        """Process new sentiment requests from the contract"""
        try:
            # Get current block
            current_block = self.w3.eth.block_number
            
            if current_block <= self.last_processed_block:
                return
            
            # Get SentimentRequested events
            event_filter = self.contract.events.SentimentRequested.create_filter(
                fromBlock=self.last_processed_block + 1,
                toBlock=current_block
            )
            
            events = event_filter.get_all_entries()
            
            if events:
                logger.info(f"Found {len(events)} new sentiment requests")
                
                # Process events in batches
                for i in range(0, len(events), self.batch_size):
                    batch = events[i:i + self.batch_size]
                    await self.process_request_batch(batch)
            
            self.last_processed_block = current_block
            
        except Exception as e:
            logger.error(f"Error processing new requests: {e}")

    async def process_request_batch(self, events: List):
        """Process a batch of sentiment requests"""
        tasks = []
        
        for event in events:
            request_id = event['args']['requestId']
            requester = event['args']['requester']
            agent_id = event['args']['agentId']
            request_hash = event['args']['requestHash']
            
            logger.info(f"Processing request {request_id} for agent {agent_id}")
            
            # Create async task for each request
            task = asyncio.create_task(
                self.process_single_request(request_id, agent_id, request_hash)
            )
            tasks.append(task)
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Request {events[i]['args']['requestId']} failed: {result}")
            else:
                logger.info(f"Request {events[i]['args']['requestId']} completed successfully")

    async def process_single_request(self, request_id: int, agent_id: int, request_hash: str):
        """Process a single sentiment analysis request"""
        try:
            # Get agent details
            agent_info = self.contract.functions.getAgent(agent_id).call()
            model_url = agent_info[1]  # modelUrl is second element
            
            # Get request text (only ROFL worker can decrypt)
            request_text = self.contract.functions.getRequestText(request_id).call(
                {'from': self.worker_address}
            )
            
            logger.info(f"Processing sentiment for request {request_id} with model {model_url}")
            
            # Perform sentiment analysis
            sentiment, confidence = await self.analyze_sentiment(model_url, request_text)
            
            # Submit result to contract
            await self.submit_result(request_id, sentiment, confidence, request_hash)
            
            logger.info(f"Successfully processed request {request_id}: {sentiment} ({confidence}%)")
            
        except Exception as e:
            logger.error(f"Failed to process request {request_id}: {e}")
            raise

    async def analyze_sentiment(self, model_url: str, text: str) -> Tuple[str, int]:
        """Perform sentiment analysis using the specified model"""
        try:
            # Extract model name from URL if it's a full Hugging Face URL
            if "huggingface.co" in model_url:
                model_name = model_url.split("/")[-2] + "/" + model_url.split("/")[-1]
            else:
                model_name = model_url
            
            # Check if model is cached
            if model_name not in self.model_cache:
                logger.info(f"Loading model: {model_name}")
                await self.load_model(model_name)
            
            # Use local pipeline if available, otherwise use API
            if model_name in self.model_cache:
                result = await self.analyze_with_local_model(model_name, text)
            else:
                result = await self.analyze_with_api(model_name, text)
            
            return result
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed for model {model_url}: {e}")
            # Return neutral sentiment with low confidence as fallback
            return "neutral", 10

    async def load_model(self, model_name: str):
        """Load a model into the local cache"""
        try:
            # Try to load model locally (for supported models)
            if self.is_supported_local_model(model_name):
                logger.info(f"Loading local model: {model_name}")
                classifier = pipeline(
                    "sentiment-analysis",
                    model=model_name,
                    return_all_scores=True,
                    device=0 if torch.cuda.is_available() else -1
                )
                self.model_cache[model_name] = classifier
                logger.info(f"Successfully loaded local model: {model_name}")
            else:
                logger.info(f"Model {model_name} will use API inference")
                
        except Exception as e:
            logger.warning(f"Failed to load local model {model_name}: {e}")

    def is_supported_local_model(self, model_name: str) -> bool:
        """Check if model can be loaded locally"""
        # List of models that work well locally in the enclave
        supported_models = [
            "cardiffnlp/twitter-roberta-base-sentiment-latest",
            "distilbert-base-uncased-finetuned-sst-2-english",
            "nlptown/bert-base-multilingual-uncased-sentiment"
        ]
        return model_name in supported_models

    async def analyze_with_local_model(self, model_name: str, text: str) -> Tuple[str, int]:
        """Analyze sentiment using locally loaded model"""
        try:
            classifier = self.model_cache[model_name]
            results = classifier(text)
            
            # Find the highest scoring label
            best_result = max(results[0], key=lambda x: x['score'])
            
            # Map labels to standard sentiment
            sentiment = self.normalize_sentiment_label(best_result['label'])
            confidence = int(best_result['score'] * 100)
            
            return sentiment, confidence
            
        except Exception as e:
            logger.error(f"Local model analysis failed: {e}")
            raise

    async def analyze_with_api(self, model_name: str, text: str) -> Tuple[str, int]:
        """Analyze sentiment using Hugging Face Inference API"""
        try:
            url = f"https://api-inference.huggingface.co/models/{model_name}"
            headers = {}
            
            if self.huggingface_token:
                headers["Authorization"] = f"Bearer {self.huggingface_token}"
            
            headers["Content-Type"] = "application/json"
            
            payload = {
                "inputs": text,
                "parameters": {"return_all_scores": True}
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # Handle different response formats
                        if isinstance(result, list) and len(result) > 0:
                            scores = result[0] if isinstance(result[0], list) else result
                            best_result = max(scores, key=lambda x: x['score'])
                            
                            sentiment = self.normalize_sentiment_label(best_result['label'])
                            confidence = int(best_result['score'] * 100)
                            
                            return sentiment, confidence
                        else:
                            raise ValueError("Unexpected API response format")
                    else:
                        error_text = await response.text()
                        raise ValueError(f"API error {response.status}: {error_text}")
                        
        except Exception as e:
            logger.error(f"API analysis failed: {e}")
            raise

    def normalize_sentiment_label(self, label: str) -> str:
        """Normalize various label formats to standard sentiment"""
        label_lower = label.lower()
        
        # Positive indicators
        if any(word in label_lower for word in ['positive', 'pos', 'good', '5 stars', '4 stars', 'joy', 'love']):
            return "positive"
        
        # Negative indicators
        elif any(word in label_lower for word in ['negative', 'neg', 'bad', '1 star', '2 stars', 'anger', 'sadness']):
            return "negative"
        
        # Default to neutral
        else:
            return "neutral"

    async def submit_result(self, request_id: int, sentiment: str, confidence: int, request_hash: str):
        """Submit sentiment analysis result to the contract"""
        try:
            # Build transaction
            function_call = self.contract.functions.submitResult(
                request_id,
                sentiment,
                confidence,
                request_hash.encode() if isinstance(request_hash, str) else request_hash
            )
            
            # Get transaction parameters
            nonce = self.w3.eth.get_transaction_count(self.worker_address)
            gas_price = self.w3.eth.gas_price
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({'from': self.worker_address})
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': self.worker_address,
                'nonce': nonce,
                'gas': gas_estimate + 50000,  # Add buffer
                'gasPrice': gas_price,
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"Result submitted successfully for request {request_id}. Tx: {tx_hash.hex()}")
            else:
                raise ValueError(f"Transaction failed: {tx_hash.hex()}")
                
        except Exception as e:
            logger.error(f"Failed to submit result for request {request_id}: {e}")
            raise

async def main():
    """Main entry point"""
    try:
        worker = ROFLSentimentWorker()
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
    except Exception as e:
        logger.error(f"Worker failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
