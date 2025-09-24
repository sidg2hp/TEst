// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Subcall.sol";

/**
 * @title ConfidentialSentimentAnalysis
 * @dev A confidential smart contract for managing AI sentiment analysis agents and requests using ROFL
 */
contract ConfidentialSentimentAnalysis {
    using Sapphire for bytes;

    struct Agent {
        address owner;
        string modelUrl;      // Hugging Face model URL
        uint256 price;        // Price in wei
        bool active;
        uint256 totalRequests;
        uint256 totalEarnings;
    }

    struct SentimentRequest {
        address requester;
        uint256 agentId;
        bytes encryptedText;  // Confidential text input
        bytes32 encryptionKey; // Key for decryption
        bytes32 encryptionNonce; // Nonce for decryption
        bytes additionalData; // Additional data for decryption
        uint256 timestamp;
        bool fulfilled;
        string result;        // Sentiment result
        uint256 confidence;   // Confidence score (0-100)
        bytes32 requestHash;  // Hash for verification
    }

    // State variables
    Agent[] public agents;
    SentimentRequest[] public requests;
    
    uint256 public nextAgentId;
    uint256 public nextRequestId;
    
    // ROFL configuration
    bytes21 public expectedROFLAppId;
    address public roflWorkerAddress;
    bool public roflEnabled = false;
    
    // Mappings for efficient lookups
    mapping(address => uint256[]) public agentsByOwner;
    mapping(address => uint256[]) public requestsByUser;
    mapping(bytes32 => uint256) public requestHashToId;
    
    // Fee structure
    uint256 public platformFeePercent = 5; // 5% platform fee
    address public platformOwner;
    uint256 public totalPlatformFees;

    // Events
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string modelUrl,
        uint256 price
    );
    
    event SentimentRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed agentId,
        bytes32 requestHash
    );
    
    event SentimentResult(
        uint256 indexed requestId,
        string sentiment,
        uint256 confidence,
        address indexed worker
    );
    
    event ROFLWorkerRegistered(
        bytes21 indexed appId,
        address indexed workerAddress
    );
    
    event PaymentProcessed(
        uint256 indexed requestId,
        address indexed agentOwner,
        uint256 amount,
        uint256 platformFee
    );

    // Modifiers
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Not platform owner");
        _;
    }
    
    modifier onlyAgentOwner(uint256 _agentId) {
        require(_agentId < agents.length, "Agent does not exist");
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        _;
    }
    
    modifier validAgent(uint256 _agentId) {
        require(_agentId < agents.length, "Agent does not exist");
        require(agents[_agentId].active, "Agent is not active");
        _;
    }
    
    modifier onlyROFLWorker() {
        if (roflEnabled) {
            // Verify the call comes from registered ROFL app
            bytes21 currentAppId = Subcall.getRoflAppId();
            require(currentAppId == expectedROFLAppId, "Invalid ROFL app");
        } else {
            // Fallback: check worker address for testing
            require(msg.sender == roflWorkerAddress, "Not authorized worker");
        }
        _;
    }

    constructor() {
        platformOwner = msg.sender;
        nextAgentId = 0;
        nextRequestId = 0;
    }

    /**
     * @dev Register ROFL worker with the contract
     * @param _appId The ROFL app ID from registration
     * @param _workerAddress The address of the ROFL worker
     */
    function registerROFLWorker(
        bytes21 _appId, 
        address _workerAddress
    ) external onlyPlatformOwner {
        expectedROFLAppId = _appId;
        roflWorkerAddress = _workerAddress;
        roflEnabled = true;
        
        emit ROFLWorkerRegistered(_appId, _workerAddress);
    }

    /**
     * @dev Register a new AI sentiment analysis agent
     * @param _modelUrl Hugging Face model URL
     * @param _price Price in wei for using this agent
     */
    function registerAgent(
        string memory _modelUrl, 
        uint256 _price
    ) external {
        require(bytes(_modelUrl).length > 0, "Model URL cannot be empty");
        require(_price > 0, "Price must be greater than 0");

        uint256 agentId = nextAgentId;
        
        agents.push(Agent({
            owner: msg.sender,
            modelUrl: _modelUrl,
            price: _price,
            active: true,
            totalRequests: 0,
            totalEarnings: 0
        }));

        agentsByOwner[msg.sender].push(agentId);
        nextAgentId++;

        emit AgentRegistered(agentId, msg.sender, _modelUrl, _price);
    }

    /**
     * @dev Submit a confidential sentiment analysis request
     * @param _agentId ID of the agent to use
     * @param _text Plain text to analyze (will be encrypted)
     */
    function requestSentiment(
        uint256 _agentId, 
        string memory _text
    ) external payable validAgent(_agentId) {
        require(bytes(_text).length > 0, "Text cannot be empty");
        require(msg.value >= agents[_agentId].price, "Insufficient payment");

        // Encrypt the text using Sapphire's confidential features
        bytes32 key = keccak256(abi.encodePacked(block.timestamp, msg.sender, _agentId));
        bytes32 nonce = keccak256(abi.encodePacked(nextRequestId, block.number));
        bytes memory additionalData = abi.encode(_agentId, msg.sender);
        bytes memory encryptedText = Sapphire.encrypt(key, nonce, abi.encode(_text), additionalData);
        
        // Create request hash for verification
        bytes32 requestHash = keccak256(abi.encodePacked(
            nextRequestId,
            msg.sender,
            _agentId,
            _text,
            block.timestamp
        ));

        uint256 requestId = nextRequestId;
        
        requests.push(SentimentRequest({
            requester: msg.sender,
            agentId: _agentId,
            encryptedText: encryptedText,
            encryptionKey: key,
            encryptionNonce: nonce,
            additionalData: additionalData,
            timestamp: block.timestamp,
            fulfilled: false,
            result: "",
            confidence: 0,
            requestHash: requestHash
        }));

        requestsByUser[msg.sender].push(requestId);
        requestHashToId[requestHash] = requestId;
        nextRequestId++;

        // Increment agent request count
        agents[_agentId].totalRequests++;

        emit SentimentRequested(requestId, msg.sender, _agentId, requestHash);
    }

    /**
     * @dev Submit sentiment analysis result (called by ROFL worker)
     * @param _requestId ID of the request
     * @param _sentiment Sentiment result ("positive", "neutral", "negative")
     * @param _confidence Confidence score (0-100)
     * @param _requestHash Original request hash for verification
     */
    function submitResult(
        uint256 _requestId,
        string memory _sentiment,
        uint256 _confidence,
        bytes32 _requestHash
    ) external onlyROFLWorker {
        require(_requestId < requests.length, "Request does not exist");
        require(!requests[_requestId].fulfilled, "Request already fulfilled");
        require(_confidence <= 100, "Confidence must be 0-100");
        require(requests[_requestId].requestHash == _requestHash, "Invalid request hash");
        
        // Validate sentiment value
        require(
            keccak256(bytes(_sentiment)) == keccak256(bytes("positive")) ||
            keccak256(bytes(_sentiment)) == keccak256(bytes("neutral")) ||
            keccak256(bytes(_sentiment)) == keccak256(bytes("negative")),
            "Invalid sentiment value"
        );

        // Update request
        requests[_requestId].fulfilled = true;
        requests[_requestId].result = _sentiment;
        requests[_requestId].confidence = _confidence;

        // Process payment
        uint256 agentId = requests[_requestId].agentId;
        address agentOwner = agents[agentId].owner;
        uint256 totalPayment = agents[agentId].price;
        
        // Calculate fees
        uint256 platformFee = (totalPayment * platformFeePercent) / 100;
        uint256 agentPayment = totalPayment - platformFee;
        
        // Update earnings
        agents[agentId].totalEarnings += agentPayment;
        totalPlatformFees += platformFee;
        
        // Transfer payments
        payable(agentOwner).transfer(agentPayment);
        // Platform fee stays in contract

        emit SentimentResult(_requestId, _sentiment, _confidence, msg.sender);
        emit PaymentProcessed(_requestId, agentOwner, agentPayment, platformFee);
    }

    /**
     * @dev Get decrypted text for ROFL worker (only callable by authorized worker)
     * @param _requestId ID of the request
     * @return Decrypted text string
     */
    function getRequestText(uint256 _requestId) 
        external 
        view 
        onlyROFLWorker 
        returns (string memory) 
    {
        require(_requestId < requests.length, "Request does not exist");
        
        // Decrypt the text
        SentimentRequest storage request = requests[_requestId];
        bytes memory decryptedData = Sapphire.decrypt(
            request.encryptionKey,
            request.encryptionNonce,
            request.encryptedText,
            request.additionalData
        );
        return abi.decode(decryptedData, (string));
    }

    /**
     * @dev Get agent details
     * @param _agentId ID of the agent
     */
    function getAgent(uint256 _agentId) 
        external 
        view 
        returns (
            address owner,
            string memory modelUrl,
            uint256 price,
            bool active,
            uint256 totalRequests,
            uint256 totalEarnings
        ) 
    {
        require(_agentId < agents.length, "Agent does not exist");
        Agent memory agent = agents[_agentId];
        
        return (
            agent.owner,
            agent.modelUrl,
            agent.price,
            agent.active,
            agent.totalRequests,
            agent.totalEarnings
        );
    }

    /**
     * @dev Get request details (sensitive data only visible to requester or worker)
     * @param _requestId ID of the request
     */
    function getRequest(uint256 _requestId)
        external
        view
        returns (
            address requester,
            uint256 agentId,
            uint256 timestamp,
            bool fulfilled,
            string memory result,
            uint256 confidence
        )
    {
        require(_requestId < requests.length, "Request does not exist");
        SentimentRequest memory request = requests[_requestId];
        
        // Only requester or ROFL worker can see full details
        require(
            msg.sender == request.requester || 
            msg.sender == roflWorkerAddress,
            "Not authorized to view request"
        );
        
        return (
            request.requester,
            request.agentId,
            request.timestamp,
            request.fulfilled,
            request.result,
            request.confidence
        );
    }

    /**
     * @dev Get total number of agents
     */
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }

    /**
     * @dev Get total number of requests
     */
    function getRequestCount() external view returns (uint256) {
        return requests.length;
    }

    /**
     * @dev Get agent IDs owned by an address
     */
    function getAgentsByOwner(address _owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return agentsByOwner[_owner];
    }

    /**
     * @dev Get request IDs made by a user
     */
    function getRequestsByUser(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return requestsByUser[_user];
    }

    /**
     * @dev Toggle agent active status
     */
    function toggleAgent(uint256 _agentId) 
        external 
        onlyAgentOwner(_agentId) 
    {
        agents[_agentId].active = !agents[_agentId].active;
    }

    /**
     * @dev Update agent price
     */
    function updateAgentPrice(uint256 _agentId, uint256 _newPrice) 
        external 
        onlyAgentOwner(_agentId) 
    {
        require(_newPrice > 0, "Price must be greater than 0");
        agents[_agentId].price = _newPrice;
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees() external onlyPlatformOwner {
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        payable(platformOwner).transfer(amount);
    }

    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 _newFeePercent) 
        external 
        onlyPlatformOwner 
    {
        require(_newFeePercent <= 20, "Fee cannot exceed 20%");
        platformFeePercent = _newFeePercent;
    }

    /**
     * @dev Emergency function to disable ROFL temporarily
     */
    function toggleROFL() external onlyPlatformOwner {
        roflEnabled = !roflEnabled;
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalAgents,
            uint256 totalRequests,
            uint256 totalFees,
            uint256 feePercent,
            bool roflActive
        ) 
    {
        return (
            agents.length,
            requests.length,
            totalPlatformFees,
            platformFeePercent,
            roflEnabled
        );
    }
}
