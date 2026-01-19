/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Scroll Canvas Constants
 *
 * Scroll Canvas is an on-chain identity system that allows users to
 * build their profile through badges earned by participating in the ecosystem.
 */

export interface CanvasConfig {
  profileContract: string;
  badgeContract: string;
  attestationContract: string;
  apiEndpoint: string;
}

export const MAINNET_CANVAS: CanvasConfig = {
  profileContract: '0xB23AF8707c442f59BDfC368612Bd8DbCca8a7a5a',
  badgeContract: '0xa74dFebc9903886EaA1F2C16F49DB63b7700Dbc4',
  attestationContract: '0x77b7DA1c40762Cd8AFfE2069b575328EfD4D9801',
  apiEndpoint: 'https://canvas.scroll.cat/api',
};

export const SEPOLIA_CANVAS: CanvasConfig = {
  profileContract: '0x0000000000000000000000000000000000000000',
  badgeContract: '0x0000000000000000000000000000000000000000',
  attestationContract: '0x0000000000000000000000000000000000000000',
  apiEndpoint: 'https://sepolia.canvas.scroll.cat/api',
};

/**
 * Canvas ABIs
 */
export const CANVAS_ABIS = {
  Profile: [
    'function getProfile(address user) view returns (tuple(string username, string avatar, string bio, uint256 createdAt))',
    'function hasProfile(address user) view returns (bool)',
    'function createProfile(string username)',
    'function updateProfile(string username, string avatar, string bio)',
    'event ProfileCreated(address indexed user, string username)',
    'event ProfileUpdated(address indexed user, string username)',
  ],
  Badge: [
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function getBadgeInfo(uint256 tokenId) view returns (tuple(string name, string description, string imageUrl, uint256 mintedAt))',
    'function isEligible(address user, uint256 badgeId) view returns (bool)',
    'function mint(uint256 badgeId)',
    'event BadgeMinted(address indexed user, uint256 indexed badgeId, uint256 tokenId)',
  ],
  Attestation: [
    'function getAttestation(bytes32 uid) view returns (tuple(bytes32 uid, bytes32 schema, address attester, address recipient, uint64 time, uint64 expirationTime, bool revocable, bytes data))',
    'function getAttestationsByRecipient(address recipient) view returns (bytes32[])',
    'event Attested(address indexed recipient, bytes32 indexed uid, bytes32 indexed schema)',
  ],
};

/**
 * Known badge categories
 */
export const BADGE_CATEGORIES = {
  ORIGIN: 'origin',
  ACTIVITY: 'activity',
  COMMUNITY: 'community',
  DEVELOPER: 'developer',
  SPECIAL: 'special',
};

/**
 * Get Canvas config for a network
 */
export function getCanvasConfig(network: string): CanvasConfig {
  switch (network) {
    case 'mainnet':
      return MAINNET_CANVAS;
    case 'sepolia':
      return SEPOLIA_CANVAS;
    default:
      return MAINNET_CANVAS;
  }
}

/**
 * Canvas contracts by network
 */
export const CANVAS_CONTRACTS: Record<string, CanvasConfig> = {
  mainnet: MAINNET_CANVAS,
  sepolia: SEPOLIA_CANVAS,
};

/**
 * Convenience exports for commonly used ABIs
 */
export const CANVAS_PROFILE_ABI = CANVAS_ABIS.Profile;
export const CANVAS_BADGE_ABI = CANVAS_ABIS.Badge;
