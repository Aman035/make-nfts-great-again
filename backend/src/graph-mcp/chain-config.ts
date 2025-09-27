export interface ChainConfig {
  name: string;
  displayName: string;
  nftDatabase: string;
  tokenDatabase: string;
  chainId?: number;
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Ethereum Mainnet',
    nftDatabase: 'mainnet:evm-nft-tokens@v0.6.2',
    tokenDatabase: 'mainnet:evm-tokens@v1.16.0',
    chainId: 1,
  },
  matic: {
    name: 'matic',
    displayName: 'Polygon',
    nftDatabase: 'matic:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'matic:evm-tokens@v1.17.2',
    chainId: 137,
  },
  'arbitrum-one': {
    name: 'arbitrum-one',
    displayName: 'Arbitrum One',
    nftDatabase: 'arbitrum-one:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'arbitrum-one:evm-tokens@v1.16.0',
    chainId: 42161,
  },
  optimism: {
    name: 'optimism',
    displayName: 'Optimism',
    nftDatabase: 'optimism:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'optimism:evm-tokens@v1.17.2',
    chainId: 10,
  },
  base: {
    name: 'base',
    displayName: 'Base',
    nftDatabase: 'base:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'base:evm-tokens@v1.17.2',
    chainId: 8453,
  },
  bsc: {
    name: 'bsc',
    displayName: 'Binance Smart Chain',
    nftDatabase: 'bsc:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'bsc:evm-tokens@v1.17.2',
    chainId: 56,
  },
  avalanche: {
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    nftDatabase: 'avalanche:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'avalanche:evm-tokens@v1.17.2',
    chainId: 43114,
  },
  unichain: {
    name: 'unichain',
    displayName: 'Unichain',
    nftDatabase: 'unichain:evm-nft-tokens@v0.5.1',
    tokenDatabase: 'unichain:evm-tokens@v1.17.2',
    chainId: undefined, // Chain ID not specified in the data
  },
};

export function getChainConfig(chain: string): ChainConfig {
  const config = CHAIN_CONFIGS[chain.toLowerCase()];
  if (!config) {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains: ${Object.keys(CHAIN_CONFIGS).join(', ')}`,
    );
  }
  return config;
}

export function getSupportedChains(): string[] {
  return Object.keys(CHAIN_CONFIGS);
}
