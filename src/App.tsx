import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@/contexts/WalletContext';
import { ContractProvider } from '@/contexts/ContractContext';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ConnectWallet } from '@/pages/ConnectWallet';
import { RegisterAgent } from '@/pages/RegisterAgent';
import { Marketplace } from '@/pages/Marketplace';
import { SentimentRequest } from '@/pages/SentimentRequest';
import { Results } from '@/pages/Results';
import { TransformersDemo } from '@/pages/TransformersDemo';
import { ContractDebug } from '@/pages/ContractDebug';

function App() {
  return (
    <WalletProvider>
      <ContractProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="connect" element={<ConnectWallet />} />
              <Route path="register" element={<RegisterAgent />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="request" element={<SentimentRequest />} />
              <Route path="results" element={<Results />} />
              <Route path="demo" element={<TransformersDemo />} />
              <Route path="debug" element={<ContractDebug />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </ContractProvider>
    </WalletProvider>
  );
}

export default App;