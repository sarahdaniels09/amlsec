import React from 'react'
import logo from '../assets/logo.png'

export default function Footer() {
  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="brand" aria-label="AMLSec Home">
              <img src={logo} alt="AMLSec logo" />
             
            </a>
            <p className="footer-desc">KYC/AML and crypto compliance toolkit made to be fast, accurate, and easy to use.</p>
          </div>

          <div className="footer-grid" aria-label="Footer navigation">
            <div className="footer-col">
              <div className="footer-title" id="footer-title">Products</div>
              <a href="#">KYC</a>
              <a href="#">KYB</a>
              <a href="#">Transaction Monitoring</a>
            </div>
            <div className="footer-col">
              <div className="footer-title">Solutions</div>
              <a href="#">FinTech</a>
              <a href="#">Crypto</a>
              <a href="#">Marketplace</a>
            </div>
            <div className="footer-col">
              <div className="footer-title">Company</div>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} AMLSEC. All rights reserved.</div>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
