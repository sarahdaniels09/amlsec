import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Admin from './pages/Admin.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import Login from './pages/Login.jsx'
import AmlCheck from './pages/AmlCheck.jsx'
import './app.css'
import { Web3Providers } from './web3/config.jsx'
import RequireAdminAuth from './components/RequireAdminAuth.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/aml-check', element: <AmlCheck /> },
  { path: '/admin', element: <RequireAdminAuth><Admin /></RequireAdminAuth> },
  { path: '/admin/settings', element: <RequireAdminAuth><AdminSettings /></RequireAdminAuth> },
  { path: '/login', element: <Login /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Providers>
    <RouterProvider router={router} />
  </Web3Providers>
)
