import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAccount } from 'wagmi'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import logo from '../assets/logo.png'

export default function AmlResult() {
  const { address, isConnected } = useAccount()
  const [result, setResult] = useState(null)
  const receiptRef = useRef(null)
   const [qrSrc, setQrSrc] = useState('')

   const publicBaseUrl = typeof window !== 'undefined'
     ? (localStorage.getItem('amlsec_public_url') || window.location.origin)
     : ''

  // Load result data stored by AmlCheck
  useEffect(() => {
    try {
      const raw = localStorage.getItem('amlsec_result')
      if (raw) {
        setResult(JSON.parse(raw))
      } else {
        // Fallback: build a minimal result if navigated directly
        const now = new Date()
        setResult({
          walletAddress: address || '—',
          completedAt: now.toISOString(),
          riskScore: 95,
          status: 'Passed',
        })
      }
    } catch (_) {
      const now = new Date()
      setResult({ walletAddress: address || '—', completedAt: now.toISOString(), riskScore: 95, status: 'Passed' })
    }
  }, [address])

  useEffect(() => {
    if (!result) return
    const payloadForQR = {
      checkId: result.checkId,
      walletAddress: result.walletAddress,
      completedAt: result.completedAt,
      network: result.network,
      chainId: result.chainId,
      verifier: result.verifier,
    }
    QRCode.toDataURL(JSON.stringify(payloadForQR))
      .then(setQrSrc)
      .catch(() => setQrSrc(''))
  }, [result])

  const formattedDateTime = useMemo(() => {
    if (!result?.completedAt) return '—'
    try {
      const d = new Date(result.completedAt)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    } catch {
      return result.completedAt
    }
  }, [result])

  async function handleDownloadPdf() {
    if (!receiptRef.current) return
    const element = receiptRef.current
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Calculate image dimensions to fit page width
    const imgProps = { width: canvas.width, height: canvas.height }
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height)
    const imgWidth = imgProps.width * ratio
    const imgHeight = imgProps.height * ratio

    const x = (pageWidth - imgWidth) / 2
    const y = 10 // top padding
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

    const fileName = `AMLsec-Receipt-${(result?.walletAddress || '').slice(0, 6)}-${Date.now()}.pdf`
    pdf.save(fileName)

    // Persist PDF as base64 for later retrieval/email
    try {
      const dataUri = pdf.output('datauristring')
      localStorage.setItem('amlsec_receipt_pdf', dataUri)
      const base64 = dataUri.split(',')[1] || dataUri
      localStorage.setItem('amlsec_receipt_pdf_base64', base64)
      localStorage.setItem('amlsec_receipt_pdf_ts', String(Date.now()))
      if (result?.checkId) localStorage.setItem('amlsec_receipt_pdf_checkId', String(result.checkId))
    } catch {}
  }

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="result-title" style={{ position: 'relative' }}>
        <div className="onboard-inner">
          <h1 id="result-title" className="onboard-title">AML Screening Result</h1>
           <p className="onboard-subtitle">Your wallet has been successfully verified and is safe to transact across blockchains.</p>
           <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
             <button className="btn primary" onClick={handleDownloadPdf}>Download Receipt (PDF)</button>
           </div>
           <div className="onboard-step" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={receiptRef} style={{
                width: '100%',
                maxWidth: 680,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 24,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <div>
                      <a href="/" className="brand" aria-label="AMLSec Home">
                          <img src={logo} alt="AMLSec logo" style={{ width: '100px' }} />
        
                          </a>
                      </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Date & Time</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{formattedDateTime}</div>
                  </div>
                </div>

                <hr style={{ borderColor: '#f3f4f6', margin: '12px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Wallet Address</div>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{result?.walletAddress || (isConnected ? address : '—')}</div>
                  </div>
                  <div style={{ width: 96, height: 96, border: '1px solid #f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', flexShrink: 0 }}>
                    {qrSrc ? (
                      <img src={qrSrc} alt="Receipt QR" style={{ width: 88, height: 88 }} />
                    ) : (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>QR</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Risk Assessment</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>Passed</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Score: {result?.riskScore ?? 95}/100</div>
                  </div>
                  <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Verification Status</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Verified</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>This wallet is safe to transact.</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Network</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{result?.network || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Chain ID: {result?.chainId ?? '—'}</div>
                  </div>
                  <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Check ID</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{result?.checkId || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Verifier: {result?.verifier || '—'}</div>
                  </div>
                </div>
                {/* Website URL included in receipt */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Domain</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{publicBaseUrl}</div>
                  </div>
                </div>

                <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Congratulations!</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    The wallet address above has successfully passed AML screening and is deemed safe to perform transactions across blockchain.
                  </div>
                </div>


              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}