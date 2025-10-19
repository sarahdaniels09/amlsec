import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="brand" aria-label="Sumsub Home">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <linearGradient id="grad-footer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D1B2" />
                    <stop offset="100%" stopColor="#00B8D9" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="20" r="10" fill="url(#grad-footer)" />
                <rect x="16" y="28" width="32" height="16" rx="8" fill="#0b1739" />
                <rect x="22" y="34" width="20" height="6" rx="3" fill="#ffffff" />
              </svg>
              <span className="name">sumsub</span>
            </a>
            <p className="footer-desc">KYC/AML and crypto compliance toolkit made to be fast, accurate, and easy to use.</p>
          </div>

          <div className="footer-grid" aria-label="Footer navigation">
            <div className="footer-col">
              <div className="footer-title" id="footer-title">Products</div>
              <a href="#">KYC</a>
              <a href="#">KYB</a>
              <a href="#">Transaction Monitoring</a>
              <a href="#">Sanctions Screening</a>
            </div>
            <div className="footer-col">
              <div className="footer-title">Resources</div>
              <a href="#">Docs</a>
              <a href="#">Guides</a>
              <a href="#">Blog</a>
              <a href="#">Support</a>
            </div>
            <div className="footer-col">
              <div className="footer-title">Company</div>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
              <a href="#">Legal</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sumsub — All rights reserved.</span>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
