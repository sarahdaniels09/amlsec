import React from 'react'
import { Link } from 'react-router-dom'

export default function CheckWalletButton({ to = '/onboarding', variant = 'primary', className = '', children, onClick }) {
  const isPrimary = variant === 'primary'
  const classes = `${isPrimary ? 'btn primary' : 'btn'}${className ? ' ' + className : ''}`

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children || 'Check wallet'}
      </button>
    )
  }

  return (
    <Link to={to} className={classes}>
      {children || 'Check wallet'}
    </Link>
  )
}
