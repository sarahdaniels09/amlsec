import React from 'react'

export default function Features() {
  return (
    <section className="features" aria-labelledby="features-title">
      <div className="features-inner">
        <h2 id="features-title" className="features-title">Safeguard your reputation the easy way</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M7 12l3 3 7-7" />
              </svg>
            </div>
            <h3>Ensure FATF and FinCen compliance</h3>
            <p>Utilize a tool created on the basis of Crystal Blockchain and recognized by most regulators.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l7 4v5c0 5-3.5 9.3-7 11-3.5-1.7-7-6-7-11V6l7-4z" />
              </svg>
            </div>
            <h3>Make your tools easier to use</h3>
            <p>Give your team an automatic and comprehensive crypto AML toolkit, understandable even when your team aren’t blockchain & legal experts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v4H3z" />
                <path d="M3 11h18v10H3z" />
              </svg>
            </div>
            <h3>Drive down costs with an out-of-the-box solution</h3>
            <p>Accelerate efficiency with an all-in-one compliance toolkit for both traditional and crypto compliance. Made by legal professionals.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
