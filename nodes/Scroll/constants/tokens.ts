/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Common Token Addresses on Scroll
 *
 * Well-known token contract addresses for mainnet and testnet.
 */

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  l1Address?: string;
  l2Address: string;
  logoUrl?: string;
}

export const MAINNET_TOKENS: Record<string, TokenInfo> = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    l2Address: '0x0000000000000000000000000000000000000000',
    logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    l1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    l2Address: '0x5300000000000000000000000000000000000004',
    logoUrl: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    l2Address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    l1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    l2Address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
    logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  DAI: {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    l1Address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
    l2Address: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97',
    logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
  },
  WBTC: {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    l1Address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    l2Address: '0x3C1BCa5a656e69edCD0D4E36BEbb3FcDAcA60Cf1',
    logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
  },
  wstETH: {
    name: 'Wrapped stETH',
    symbol: 'wstETH',
    decimals: 18,
    l1Address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    l2Address: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32',
    logoUrl: 'https://assets.coingecko.com/coins/images/18834/small/wstETH.png',
  },
  SCR: {
    name: 'Scroll',
    symbol: 'SCR',
    decimals: 18,
    l2Address: '0xd29687c813D741E2F938F4aC377128810E217b1b',
    logoUrl: 'https://assets.coingecko.com/coins/images/36056/small/scroll.png',
  },
};

export const SEPOLIA_TOKENS: Record<string, TokenInfo> = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    l2Address: '0x0000000000000000000000000000000000000000',
  },
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    l1Address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    l2Address: '0x5300000000000000000000000000000000000004',
  },
};

/**
 * Get tokens for a network
 */
export function getTokens(network: string): Record<string, TokenInfo> {
  switch (network) {
    case 'mainnet':
      return MAINNET_TOKENS;
    case 'sepolia':
      return SEPOLIA_TOKENS;
    default:
      return MAINNET_TOKENS;
  }
}

/**
 * Get token info by symbol
 */
export function getTokenBySymbol(network: string, symbol: string): TokenInfo | undefined {
  const tokens = getTokens(network);
  return tokens[symbol.toUpperCase()];
}

/**
 * Get token info by address
 */
export function getTokenByAddress(network: string, address: string): TokenInfo | undefined {
  const tokens = getTokens(network);
  const normalizedAddress = address.toLowerCase();
  return Object.values(tokens).find(
    (token) => token.l2Address.toLowerCase() === normalizedAddress
  );
}

/**
 * Common tokens array for easy iteration
 */
export const COMMON_TOKENS = Object.values(MAINNET_TOKENS);
