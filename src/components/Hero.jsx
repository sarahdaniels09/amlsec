import React from 'react'
import CheckWalletButton from './CheckWalletButton.jsx'

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="badge">Crypto Monitoring</span>
          <h1 id="hero-title">KYC/AML and crypto compliance, all under one roof</h1>
          <p>
            Not just a tech platform, but a legally equipped, customer-focused AML
            compliance framework in line with FATF and FinCEN requirements.
          </p>
          <CheckWalletButton>
            Check your wallet <span className="arrow">→</span>
          </CheckWalletButton>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <svg className="hero-card" viewBox="0 0 920 520" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f7f9fc" />
              </linearGradient>
            </defs>
            <rect x="40" y="40" width="840" height="440" rx="18" fill="url(#cardGrad)" stroke="#e6ecf4" />
            <rect x="40" y="40" width="80" height="440" rx="18" fill="#13204b" />
            <circle cx="80" cy="110" r="14" fill="#2d6dfa" />
            <circle cx="80" cy="170" r="14" fill="#67e6dc" />
            <circle cx="80" cy="230" r="14" fill="#fcbf49" />
            <circle cx="80" cy="290" r="14" fill="#ff6b6b" />
            <text x="150" y="95" fill="#0e1a3d" fontSize="26" fontFamily="Inter" fontWeight="700">Dashboard</text>
            <rect x="150" y="130" width="420" height="18" rx="9" fill="#eef3ff" />
            <rect x="150" y="130" width="360" height="18" rx="9" fill="#2d6dfa" />
            <rect x="150" y="170" width="420" height="18" rx="9" fill="#eef3ff" />
            <rect x="150" y="170" width="220" height="18" rx="9" fill="#2d6dfa" />
            <rect x="150" y="210" width="420" height="18" rx="9" fill="#eef3ff" />
            <rect x="150" y="210" width="300" height="18" rx="9" fill="#2d6dfa" />
            <circle cx="690" cy="190" r="55" fill="#fff" stroke="#e6ecf4" />
            <path d="M690 190 m-55 0 a55 55 0 1 0 110 0 a55 55 0 1 0 -110 0" fill="none" stroke="#ff6b6b" strokeWidth="18" strokeDasharray="100 240" />
            <rect x="150" y="260" width="680" height="60" rx="12" fill="#fff" stroke="#e6ecf4" />
            <circle cx="180" cy="290" r="14" fill="#ff6b6b" />
            <text x="205" y="296" fill="#5a6789" fontSize="16" fontFamily="Inter">BTC</text>
            <polyline points="380,288 400,292 420,286 440,294 460,300 480,296 500,302" fill="none" stroke="#ff6b6b" strokeWidth="2" />
            <text x="630" y="296" fill="#0e1a3d" fontSize="16" fontFamily="Inter" fontWeight="600">$29,850.15</text>
            <rect x="150" y="330" width="680" height="60" rx="12" fill="#fff" stroke="#e6ecf4" />
            <circle cx="180" cy="360" r="14" fill="#2d6dfa" />
            <text x="205" y="366" fill="#5a6789" fontSize="16" fontFamily="Inter">ETH</text>
            <polyline points="380,358 400,356 420,360 440,352 460,348 480,350 500,344" fill="none" stroke="#2d6dfa" strokeWidth="2" />
            <text x="630" y="366" fill="#0e1a3d" fontSize="16" fontFamily="Inter" fontWeight="600">$10,561.24</text>
          </svg>
        </div>
      </div>
    </section>
  )
}
