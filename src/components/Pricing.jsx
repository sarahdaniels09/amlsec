import React from 'react'

export default function Pricing({ onSelectPlan }) {
  return (
    <section className="pricing" aria-labelledby="pricing-title">
      <div className="pricing-inner">

        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Starter</h3>
              <div className="price">
                <span className="amount">$0</span>
                <span className="period">/ mo</span>
              </div>
              <p className="desc">Get started with manual checks.</p>
            </div>
            <ul className="features">
              <li>Up to 25 checks / mo</li>
              <li>Manual AML scanning flow</li>
              <li>Email support</li>
            </ul>
            <button type="button" className="btn btn-outline" onClick={() => onSelectPlan && onSelectPlan('starter')}>Choose Starter</button>
          </div>

          <div className="pricing-card featured">
            <div className="plan-header">
              <h3>Pro</h3>
              <div className="price">
                <span className="amount">$49</span>
                <span className="period">/ mo</span>
              </div>
              <p className="desc">Automate with web3 integrations.</p>
            </div>
            <ul className="features">
              <li>Up to 1,000 checks / mo</li>
              <li>Automated AML workflow</li>
              <li>Priority email support</li>
            </ul>
            <button type="button" className="btn" onClick={() => onSelectPlan && onSelectPlan('pro')}>Choose Pro</button>
          </div>

          <div className="pricing-card">
            <div className="plan-header">
              <h3>Enterprise</h3>
              <div className="price">
                <span className="amount">Custom</span>
              </div>
              <p className="desc">Scalable compliance and dedicated support.</p>
            </div>
            <ul className="features">
              <li>Unlimited checks</li>
              <li>Custom policies and reporting</li>
              <li>Dedicated success manager</li>
            </ul>
            <button type="button" className="btn btn-outline" onClick={() => onSelectPlan && onSelectPlan('enterprise')}>Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  )
}