import React from 'react'
import { Link } from 'react-router-dom'
import CheckWalletButton from './CheckWalletButton.jsx'
import logo from '../assets/logo.png'

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand" aria-label="AMLSec Home">
          <img src={logo} alt="AMLSec logo" />
          <span className="name">AMLSEC</span>
        </a>

        <nav className="primary-nav" aria-label="Primary">
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
