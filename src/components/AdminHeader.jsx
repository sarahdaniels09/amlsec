import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on Escape, on resize above breakpoint, and on outside click
  React.useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  React.useEffect(() => {
    function onResize() { if (window.innerWidth > 860) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const headerRef = React.useRef(null)
  React.useEffect(() => {
    function onClickOutside(e) {
      if (!menuOpen) return
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [menuOpen])

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
      <div className="admin-header-inner" ref={headerRef}>
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-link" onClick={() => setMenuOpen(false)}>Admin</Link>
        </div>
        <button
          className="admin-hamburger"
          type="button"
          aria-label="Toggle navigation menu"
          aria-controls="admin-nav"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <nav id="admin-nav" className={`admin-nav${menuOpen ? ' mobile-open' : ''}`}>
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