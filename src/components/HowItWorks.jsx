import React from 'react'

export default function HowItWorks() {
  return (
    <section className="howitworks" aria-labelledby="how-title">
      <div className="hiw-inner">
        <h2 id="how-title" className="hiw-title">How it works</h2>
        <p className="hiw-subtitle">Automated scoring and monitoring in seconds via API. Addresses are screened, and risk profiles are automatically provided by the system in real-time.</p>
        <div className="hiw-grid">
          <div className="hiw-card">
            <div className="hiw-top">
              <div>
                <div className="hiw-label">Owner</div>
                <div className="hiw-value">Not Defined</div>
              </div>
              <div>
                <div className="hiw-label">Risk score</div>
                <div className="hiw-score">75%</div>
              </div>
            </div>
            <div className="hiw-bullets">
              <div className="hiw-bullet">
                <div className="icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="2" width="10" height="10" rx="2"></rect></svg>
                </div>
                <div>
                  <strong>Strong connection</strong>
                  <span>Darknet marketplaces</span>
                </div>
              </div>
              <div className="hiw-bullet">
                <div className="icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="2" width="10" height="10" rx="2"></rect></svg>
                </div>
                <div>
                  <strong>Weak connection</strong>
                  <span>payment processors, crypto exchanges, gambling services</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hiw-card">
            <div className="hiw-top">
              <div>
                <div className="hiw-label">Details</div>
                <div className="hiw-value">Transactions</div>
              </div>
              <span className="badge">Active</span>
            </div>
            <div className="hiw-meta">
              <div className="item">
                <div className="muted">First activity</div>
                <div>Oct 02, 2014 9:34 AM</div>
              </div>
              <div className="item">
                <div className="muted">Last activity</div>
                <div>Jun 21, 2019 2:18 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
