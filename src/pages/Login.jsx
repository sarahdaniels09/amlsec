import React, { useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useNavigate } from 'react-router-dom'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../web3/config.jsx'

export default function Login() {
  const navigate = useNavigate()
  const savedEmail = (() => {
    try { return localStorage.getItem('amlsec_admin_email') || '' } catch { return '' }
  })()
  const savedSettings = (() => {
    try { return JSON.parse(localStorage.getItem('amlsec_settings') || '{}') } catch { return {} }
  })()

  const [email, setEmail] = useState(savedEmail)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remember, setRemember] = useState(!!savedEmail)
  const [showPassword, setShowPassword] = useState(false)

  const effectiveEmail = savedSettings.adminEmail || ADMIN_EMAIL
  const effectivePassword = savedSettings.adminPassword || ADMIN_PASSWORD

  async function handleSubmit(e) {
    e && e.preventDefault && e.preventDefault()
    setStatus('')

    if (!email || !password) {
      setStatus('Please enter email and password')
      return
    }

    try {
      setIsSubmitting(true)
      if (email === effectiveEmail && password === effectivePassword) {
        localStorage.setItem('amlsec_admin_authed', 'true')
        if (remember) {
          localStorage.setItem('amlsec_admin_email', email)
        } else {
          localStorage.removeItem('amlsec_admin_email')
        }
        setStatus('Login successful. Redirecting to Admin...')
        navigate('/admin')
      } else {
        setStatus('Invalid credentials')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="login-title">
        <div className="onboard-inner">
          <div className="login-card">
            <h1 id="login-title" className="login-title">Sign in</h1>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="field">
                <label htmlFor="email">Email or Username</label>
                <input id="email" type="email" placeholder="admin@admin.com" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input" />
              </div>

              <div className="field password-field">
                <label htmlFor="password">Password</label>
                <div className="password-wrap">
                  <input id="password" type={showPassword ? 'text' : 'password'} placeholder="•••••" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" />
                  <button type="button" className="password-toggle" aria-label="Toggle password visibility" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="row">
                  <label className="remember">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <a className="forgot" href="#">Forgot Password?</a>
                </div>
              </div>

              <button className="btn primary login-btn" type="submit" disabled={isSubmitting}>Sign in</button>

              {status ? <p className="login-status" role="status">{status}</p> : null}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}