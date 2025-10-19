import { createConfig, http, WagmiConfig } from 'wagmi'
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'
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

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http()
  }
})

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Web3Modal will not open.')
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
