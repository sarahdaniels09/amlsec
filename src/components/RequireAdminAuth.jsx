import React from 'react'
import { Navigate } from 'react-router-dom'

export default function RequireAdminAuth({ children }) {
  const isAuthed = typeof window !== 'undefined' && localStorage.getItem('amlsec_admin_authed') === 'true'
  if (!isAuthed) return <Navigate to="/login" replace />
  return children
}