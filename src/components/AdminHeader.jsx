import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    const ok = window.confirm('Log out of admin?')
    if (!ok) return
    try {
      localStorage.removeItem('amlsec_admin_authed')
      localStorage.removeItem('amlsec_admin_email')
    } catch {}
    navigate('/login')
  }

  const shortAddr = isConnected && address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Not connected'

  return (
    <header className="admin-header" role="navigation" aria-label="Admin navigation">
      <div className="admin-header-inner">
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-link" onClick={() => setMenuOpen(false)}>Admin</Link>
        </div>
        <button
          className="admin-hamburger"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <nav className={`admin-nav${menuOpen ? ' mobile-open' : ''}`}>
          <Link to="/admin" className="admin-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/admin/settings" className="admin-link" onClick={() => setMenuOpen(false)}>Settings</Link>
          <div className="mobile-cta" style={{ display: 'none' }}>
            {/* Placeholder for mobile-specific actions if needed */}
          </div>
        </nav>
        <div className="admin-nav-right">
          <span className="admin-addr" aria-label="Connected wallet">{shortAddr}</span>
          <button className="admin-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  )
}