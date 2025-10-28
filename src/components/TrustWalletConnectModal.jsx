import React, { useMemo, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function TrustWalletConnectModal({ isOpen, onClose, dappUrl }) {
  // Prefer current page url if not provided
  const pageUrl = typeof window !== 'undefined' ? (dappUrl || window.location.href) : (dappUrl || '')

  // Trust Wallet deep link: opens the dApp inside the Trust Browser and injects provider
  // coin_id=60 ensures EVM provider injection (Ethereum)
  const trustDeepLink = useMemo(() => {
    const base = 'https://link.trustwallet.com/open_url'
    const params = new URLSearchParams()
    params.set('coin_id', '60')
    params.set('url', pageUrl)
    return `${base}?${params.toString()}`
  }, [pageUrl])

  // Auto-redirect on mobile to streamline UX
  useEffect(() => {
    if (!isOpen) return
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua)
    // If user is already on mobile, tap-less deep link to Trust Wallet
    if (isMobile) {
      // Give the modal a brief moment so user sees context
      const t = setTimeout(() => {
        try { window.location.href = trustDeepLink } catch (_) {}
      }, 400)
      return () => clearTimeout(t)
    }
  }, [isOpen, trustDeepLink])

  if (!isOpen) return null

  return (
    <div className="twc-modal-backdrop" role="dialog" aria-modal="true">
      <div className="twc-modal">
        <div className="twc-modal-header">
          <h3>Connect with Trust Wallet</h3>
          <button type="button" className="twc-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="twc-modal-desc">Scan the QR code with your phone. It will open this dApp inside Trust Wallet’s browser and connect your wallet.</p>

        <div className="twc-qr">
          <QRCodeSVG value={trustDeepLink} size={200} includeMargin={true} />
        </div>

        <div className="twc-actions">
          <a href={trustDeepLink} className="btn primary" target="_blank" rel="noopener noreferrer">Open in Trust Wallet</a>
          <button type="button" className="btn" onClick={() => {
            try {
              navigator.clipboard.writeText(trustDeepLink)
            } catch (_e) {}
          }}>Copy Link</button>
        </div>

        <div className="twc-help">
          <small>Tip: On mobile, you’ll be redirected automatically. On desktop, scan with your phone’s camera or Trust Wallet app.</small>
        </div>
      </div>
    </div>
  )
}