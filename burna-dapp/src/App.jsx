// $BURNA Wallet DApp with Staking + Floating Transaction Feed
// Vite + React + RainbowKit + Wagmi

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import {
  configureChains,
  createConfig,
  WagmiConfig,
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useContractEvent
} from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: 'BURNA DApp',
  projectId: 'burna-web3-dapp',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

const tokenAddress = '0x00b8a9bb1dcab2cf2375284d70b39e6ef7d86aae';
const stakingAddress = '0x0000000000000000000000000000000000000000'; // Replace with real deployed staking contract

const erc20ABI = [
  { "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "name": "balanceOf",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  { "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "name": "approve",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [ { "name": "", "type": "bool" } ]
  }
];

const stakingABI = [
  {
    "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ],
    "name": "getStaked",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  }
];

function StakingPanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');

  const { data: staked } = useContractRead({
    address: stakingAddress,
    abi: stakingABI,
    functionName: 'getStaked',
    args: [address],
    watch: true
  });

  const { config: approveConfig } = usePrepareContractWrite({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'approve',
    args: [stakingAddress, parseEther(amount || '0')],
    enabled: Boolean(amount)
  });

  const { write: approve } = useContractWrite(approveConfig);

  const { config: stakeConfig } = usePrepareContractWrite({
    address: stakingAddress,
    abi: stakingABI,
    functionName: 'stake',
    args: [parseEther(amount || '0')],
    enabled: Boolean(amount)
  });

  const { write: stake } = useContractWrite(stakeConfig);

  const { config: unstakeConfig } = usePrepareContractWrite({
    address: stakingAddress,
    abi: stakingABI,
    functionName: 'unstake'
  });

  const { write: unstake } = useContractWrite(unstakeConfig);

  return (
    <div style={{ marginTop: '3rem', maxWidth: 400, textAlign: 'center' }}>
      <h3>Staking</h3>
      <p style={{ color: '#ccc' }}>Currently Staked: {staked ? formatEther(staked) : '0'} $BURNA</p>
      <input
        type="text"
        placeholder="Amount to stake"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => approve?.()} style={{ backgroundColor: '#444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Approve</button>
        <button onClick={() => stake?.()} style={{ backgroundColor: 'orange', color: 'black', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Stake</button>
        <button onClick={() => unstake?.()} style={{ backgroundColor: 'red', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Unstake</button>
      </div>
    </div>
  );
}

// Include StakingPanel in App
export default function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <div style={{
          minHeight: '100vh',
          background: 'black',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>$BURNA Token</h1>
          <ConnectButton />
          <WalletBalance />
          <TransferForm />
          <BuySwapWidget />
          <StakingPanel />
          <FloatingTransactions />
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
