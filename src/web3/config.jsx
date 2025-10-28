import { WagmiConfig } from 'wagmi'
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const chains = [mainnet, polygon, arbitrum, base]

// Chain ID mapping for easy reference
export const CHAIN_IDS = {
  ethereum: mainnet.id,
  polygon: polygon.id,
  arbitrum: arbitrum.id,
  base: base.id
}

export const CHAIN_NAMES = {
  [mainnet.id]: 'ethereum',
  [polygon.id]: 'polygon',
  [arbitrum.id]: 'arbitrum',
  [base.id]: 'base'
}

// Prefer non-auth public RPCs. If env URL is Ankr without a key, fall back.
function preferRpc(envUrl, fallback) {
  if (!envUrl) return fallback
  const u = String(envUrl).toLowerCase()
  if (u.includes('rpc.ankr.com')) {
    console.warn(`Detected Ankr RPC without API key in env: ${envUrl}. Falling back to ${fallback}.`)
    return fallback
  }
  return envUrl
}

const ETH_RPC_URL = preferRpc(import.meta.env.VITE_ETH_RPC_URL, 'https://eth.llamarpc.com')
const POLYGON_RPC_URL = preferRpc(import.meta.env.VITE_POLYGON_RPC_URL, 'https://polygon.llamarpc.com')
const ARBITRUM_RPC_URL = preferRpc(import.meta.env.VITE_ARBITRUM_RPC_URL, 'https://arb1.arbitrum.io/rpc')
const BASE_RPC_URL = preferRpc(import.meta.env.VITE_BASE_RPC_URL, 'https://mainnet.base.org')

console.log('Resolved RPC URLs:', {
  ETH_RPC_URL,
  POLYGON_RPC_URL,
  ARBITRUM_RPC_URL,
  BASE_RPC_URL
})

const transports = {
  [mainnet.id]: http(ETH_RPC_URL),
  [polygon.id]: http(POLYGON_RPC_URL),
  [arbitrum.id]: http(ARBITRUM_RPC_URL),
  [base.id]: http(BASE_RPC_URL)
}

// dapp metadata improves WalletConnect UX
const metadata = {
  name: 'AMLsec',
  description: 'AML wallet risk screening',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: projectId || 'missing_project_id',
  transports,
  metadata
})

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Web3Modal will use a placeholder; set a valid ID for best reliability.')
}

createWeb3Modal({ wagmiConfig, projectId: projectId || 'missing_project_id', chains })

// Create a client
const queryClient = new QueryClient()

export function Web3Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
}

// Export resolved RPC URLs for use in direct-read fallbacks
export const RESOLVED_RPC_URLS = {
  ethereum: ETH_RPC_URL,
  polygon: POLYGON_RPC_URL,
  arbitrum: ARBITRUM_RPC_URL,
  base: BASE_RPC_URL
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme123'
