import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()

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
          <Link to="/admin" className="admin-brand-link">Admin</Link>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-link">Dashboard</Link>
          <Link to="/admin/settings" className="admin-link">Settings</Link>
        </nav>
        <div className="admin-nav-right">
          <span className="admin-addr" aria-label="Connected wallet">{shortAddr}</span>
          <button className="admin-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  )
}