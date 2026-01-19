/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Scroll Network Configuration Constants
 *
 * Defines network-specific configurations including RPC endpoints,
 * chain IDs, explorer URLs, and bridge endpoints for Scroll networks.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  bridgeApiUrl: string;
  l1ChainId: number;
  l1RpcUrl: string;
  isTestnet: boolean;
}

export const SCROLL_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Scroll Mainnet',
    chainId: 534352,
    rpcUrl: 'https://rpc.scroll.io',
    wsUrl: 'wss://wss.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    explorerApiUrl: 'https://api.scrollscan.com/api',
    bridgeApiUrl: 'https://mainnet-api-bridge.scroll.io/api',
    l1ChainId: 1,
    l1RpcUrl: 'https://eth.llamarpc.com',
    isTestnet: false,
  },
  sepolia: {
    name: 'Scroll Sepolia',
    chainId: 534351,
    rpcUrl: 'https://sepolia-rpc.scroll.io',
    wsUrl: 'wss://sepolia-rpc.scroll.io',
    explorerUrl: 'https://sepolia.scrollscan.com',
    explorerApiUrl: 'https://api-sepolia.scrollscan.com/api',
    bridgeApiUrl: 'https://sepolia-api-bridge.scroll.io/api',
    l1ChainId: 11155111,
    l1RpcUrl: 'https://ethereum-sepolia.publicnode.com',
    isTestnet: true,
  },
};

export const DEFAULT_GAS_LIMIT = 21000n;
export const DEFAULT_TOKEN_GAS_LIMIT = 100000n;
export const DEFAULT_CONTRACT_GAS_LIMIT = 300000n;
export const DEFAULT_BRIDGE_GAS_LIMIT = 200000n;

export const BLOCK_CONFIRMATIONS = {
  safe: 10,
  finalized: 64,
};

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const POLLING_INTERVAL_MS = 5000;
export const BRIDGE_POLLING_INTERVAL_MS = 30000;

export const GAS_PRICE_MULTIPLIER = 1.1;
export const GAS_LIMIT_MULTIPLIER = 1.2;

/**
 * Get network configuration by network name
 */
export function getNetworkConfig(network: string): NetworkConfig {
  const config = SCROLL_NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}. Supported networks: ${Object.keys(SCROLL_NETWORKS).join(', ')}`);
  }
  return config;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(SCROLL_NETWORKS).find((config) => config.chainId === chainId);
}
