import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CheckWalletButton from './CheckWalletButton.jsx'
import logo from '../assets/logo.png'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand" aria-label="AMLSec Home">
          <img src={logo} alt="AMLSec logo" />
        </a>

        {/* Hamburger Menu Button */}
        <button 
          className="hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <nav className={`primary-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Primary">
          <a href="#">Products</a>
          <a href="#">Solutions</a>
          <a href="#">Resources</a>
          <a href="#">Company</a>
          <Link to="/admin">Admin</Link>
        </nav>

        <div className="cta">
          <CheckWalletButton variant="default" />
        </div>
      </div>
    </header>
  )
}
