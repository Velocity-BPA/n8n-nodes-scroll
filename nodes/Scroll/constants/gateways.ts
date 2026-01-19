/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Gateway and DEX Router Addresses
 *
 * Addresses for popular DeFi protocols and gateways on Scroll.
 */

export interface DexInfo {
  name: string;
  router: string;
  factory?: string;
  quoter?: string;
  type: 'uniswap-v2' | 'uniswap-v3' | 'curve' | 'balancer' | 'other';
}

export const MAINNET_DEXES: Record<string, DexInfo> = {
  syncSwap: {
    name: 'SyncSwap',
    router: '0x80e38291e06339d10AAB483C65695D004dBD5C69',
    factory: '0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d',
    type: 'uniswap-v2',
  },
  izumiSwap: {
    name: 'iZUMi Swap',
    router: '0x2db0AFD0045F3518c77eC6591a542e326Befd3D7',
    quoter: '0x3EF68D3f7664b2805D4E88381b64868a56f88bc4',
    type: 'uniswap-v3',
  },
  zebra: {
    name: 'Zebra',
    router: '0x0122960d6e391478bfe8fb2408ba412d5600f621',
    factory: '0x8c9a853E6c96D8b0D3dcdc36c18FE1d1C90Ad6B5',
    type: 'uniswap-v2',
  },
  ambient: {
    name: 'Ambient Finance',
    router: '0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106',
    type: 'other',
  },
  nuri: {
    name: 'Nuri Exchange',
    router: '0xAAA45c8F5ef92a000a121d102F4e89278a711Faa',
    factory: '0xAAA32926fcE6bE95ea2c51cB4Fcb60836D320C42',
    quoter: '0xAAA21aD628b1dD4e3318E89a0234BdC9e4C39f02',
    type: 'uniswap-v3',
  },
  spacefi: {
    name: 'SpaceFi',
    router: '0x18b71386418A9FCa5Ae7165E31c385a5a578D1d5',
    factory: '0xE61004528D88f0E8B00F0a6E2e06Fd93F0A5c0d1',
    type: 'uniswap-v2',
  },
  skydrome: {
    name: 'Skydrome',
    router: '0xAA111C62cDEEf205f70E6722D1E22274274ec12F',
    factory: '0xC4B9e2e5dF2e0dF0E7b2F10c6E8a1b1d0B9c8A7f',
    type: 'uniswap-v2',
  },
};

export const SEPOLIA_DEXES: Record<string, DexInfo> = {
  testSwap: {
    name: 'Test Swap',
    router: '0x0000000000000000000000000000000000000000',
    type: 'uniswap-v2',
  },
};

/**
 * Lending protocol addresses
 */
export interface LendingProtocol {
  name: string;
  pool?: string;
  comptroller?: string;
  oracle?: string;
}

export const MAINNET_LENDING: Record<string, LendingProtocol> = {
  aaveV3: {
    name: 'Aave V3',
    pool: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
  },
  compoundV3: {
    name: 'Compound V3',
    comptroller: '0x8C5d8c8c4a0f0F0f0F0F0F0F0F0F0F0F0F0F0F0F',
  },
  layerBank: {
    name: 'LayerBank',
    comptroller: '0xEC53c830f4444a8A56455c6836b5D2aA794289Aa',
  },
  rhoMarkets: {
    name: 'Rho Markets',
    comptroller: '0x8e00D5e02E65A19337Cdba98bbA9F84d4186a180',
  },
};

/**
 * Get DEXes for a network
 */
export function getDexes(network: string): Record<string, DexInfo> {
  switch (network) {
    case 'mainnet':
      return MAINNET_DEXES;
    case 'sepolia':
      return SEPOLIA_DEXES;
    default:
      return MAINNET_DEXES;
  }
}

/**
 * Get lending protocols for a network
 */
export function getLendingProtocols(network: string): Record<string, LendingProtocol> {
  switch (network) {
    case 'mainnet':
      return MAINNET_LENDING;
    default:
      return {};
  }
}

/**
 * DEX addresses by network for quick access
 */
export const DEX_ADDRESSES: Record<string, Record<string, string>> = {
  mainnet: {
    syncswap: MAINNET_DEXES.syncSwap.router,
    izumi: MAINNET_DEXES.izumiSwap.router,
    zebra: MAINNET_DEXES.zebra.router,
    ambient: MAINNET_DEXES.ambient.router,
    nuri: MAINNET_DEXES.nuri.router,
    spacefi: MAINNET_DEXES.spacefi.router,
    skydrome: MAINNET_DEXES.skydrome.router,
  },
  sepolia: {
    testswap: SEPOLIA_DEXES.testSwap.router,
  },
};

/**
 * Lending protocol addresses by network
 */
export const LENDING_PROTOCOLS: Record<string, Record<string, string>> = {
  mainnet: {
    aave: MAINNET_LENDING.aaveV3.pool || '',
    compound: MAINNET_LENDING.compoundV3.comptroller || '',
    layerbank: MAINNET_LENDING.layerBank.comptroller || '',
    rhomarkets: MAINNET_LENDING.rhoMarkets.comptroller || '',
  },
  sepolia: {},
};
