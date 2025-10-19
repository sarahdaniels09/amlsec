import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Onboarding from './pages/Onboarding.jsx'
import './app.css'
import { Web3Providers } from './web3/config.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/onboarding', element: <Onboarding /> },
])

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <Web3Providers>
    <RouterProvider router={router} />
  </Web3Providers>
)
