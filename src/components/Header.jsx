import React from 'react'
import CheckWalletButton from './CheckWalletButton.jsx'

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" className="brand" aria-label="Sumsub Home">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D1B2" />
                <stop offset="100%" stopColor="#00B8D9" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="20" r="10" fill="url(#grad)" />
            <rect x="16" y="28" width="32" height="16" rx="8" fill="#0b1739" />
            <rect x="22" y="34" width="20" height="6" rx="3" fill="#ffffff" />
          </svg>
          <span className="name">sumsub</span>
        </a>

        <nav className="primary-nav" aria-label="Primary">
          <a href="#">Products</a>
          <a href="#">Solutions</a>
          <a href="#">Resources</a>
          <a href="#">Company</a>
        </nav>

        <div className="cta">
          <CheckWalletButton variant="default" />
        </div>
      </div>
    </header>
  )
}
