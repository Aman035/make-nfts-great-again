import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
  bsc,
} from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Make NFTs Great Again',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  chains: [mainnet, polygon, arbitrum, optimism, base, avalanche, bsc],
  ssr: false,
})
