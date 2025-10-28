import React, { useState, useMemo } from 'react'
import AdminHeader from '../components/AdminHeader.jsx'
import Footer from '../components/Footer.jsx'
import { CHAIN_IDS } from '../web3/config.jsx'

export default function AdminSettings() {
  const initial = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('amlsec_settings') || '{}') } catch { return {} }
  }, [])

  const [adminEmail, setAdminEmail] = useState(initial.adminEmail || '')
  const [adminPassword, setAdminPassword] = useState(initial.adminPassword || '')
  const [contractAddress, setContractAddress] = useState(initial.contractAddress || '0x83CBbdfd4E0Ae5e264B789cC7459E878A4E39fBd')
  const [defaultNetwork, setDefaultNetwork] = useState(initial.defaultNetwork || 'arbitrum')
  const [status, setStatus] = useState('')

  function handleSave(e) {
    e && e.preventDefault && e.preventDefault()
    const payload = { adminEmail, adminPassword, contractAddress, defaultNetwork }
    try {
      localStorage.setItem('amlsec_settings', JSON.stringify(payload))
      setStatus('Settings saved')
    } catch (err) {
      setStatus('Failed to save settings')
    }
  }

  return (
    <>
      <AdminHeader />
      <main className="onboard" aria-labelledby="admin-settings-title">
        <div className="onboard-inner">
          <h1 id="admin-settings-title" className="onboard-title">Admin Settings</h1>
          <p className="onboard-subtitle">Manage configuration and preferences for admin operations.</p>

          <div className="admin-card" style={{ maxWidth: '960px', margin: '16px auto 0' }}>
            <form className="admin-controls" onSubmit={handleSave}>
              <div className="admin-form" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#667085' }}>Admin Email</label>
                  <input className="admin-input" type="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#667085' }}>Admin Password</label>
                  <input className="admin-input" type="text" placeholder="changeme123" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                </div>
              </div>

              <div className="admin-form" style={{ gridTemplateColumns: '1fr 0.5fr' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#667085' }}>Token Contract Address</label>
                  <input className="admin-input" type="text" placeholder="0x..." value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#667085' }}>Default Network</label>
                  <select className="admin-input" value={defaultNetwork} onChange={(e) => setDefaultNetwork(e.target.value)}>
                    {Object.keys(CHAIN_IDS).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="admin-btn primary" type="submit">Save Settings</button>
                {status && <span style={{ fontSize: 12, color: '#12B76A' }}>{status}</span>}
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}