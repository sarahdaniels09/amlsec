import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Admin from './pages/Admin.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import Login from './pages/Login.jsx'
import AmlCheck from './pages/AmlCheck.jsx'
import AmlResult from './pages/AmlResult.jsx'
import ConnectPage from './pages/ConnectPage.jsx'
import './app.css'
import { Web3Providers } from './web3/config.jsx'
import RequireAdminAuth from './components/RequireAdminAuth.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/connect', element: <ConnectPage /> },
  { path: '/aml-check', element: <AmlCheck /> },
  { path: '/aml-result', element: <AmlResult /> },
  { path: '/admin', element: <RequireAdminAuth><Admin /></RequireAdminAuth> },
  { path: '/admin/settings', element: <RequireAdminAuth><AdminSettings /></RequireAdminAuth> },
  { path: '/login', element: <Login /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Providers>
    <RouterProvider router={router} />
  </Web3Providers>
)
