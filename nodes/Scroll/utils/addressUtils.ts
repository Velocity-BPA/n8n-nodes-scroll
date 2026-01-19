/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Address Utility Functions
 *
 * Provides validation, formatting, and manipulation functions for Ethereum addresses.
 */

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Get checksummed address
 */
export function toChecksumAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return ethers.getAddress(address);
}

/**
 * Check if address is a contract
 */
export async function isContract(
  provider: ethers.Provider,
  address: string
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== '0x' && code !== '0x0';
  } catch {
    return false;
  }
}

/**
 * Check if address is the zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === ethers.ZeroAddress || 
         address === '0x0000000000000000000000000000000000000000';
}

/**
 * Shorten address for display (0x1234...5678)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  const checksummed = toChecksumAddress(address);
  return `${checksummed.slice(0, chars + 2)}...${checksummed.slice(-chars)}`;
}

/**
 * Compare two addresses (case-insensitive)
 */
export function addressesEqual(address1: string, address2: string): boolean {
  if (!isValidAddress(address1) || !isValidAddress(address2)) {
    return false;
  }
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Get address from private key
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    throw new Error('Invalid private key');
  }
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    // Add 0x prefix if missing
    const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    // Private key should be 32 bytes (64 hex chars + 0x prefix)
    if (key.length !== 66) {
      return false;
    }
    // Try to create a wallet with it
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pad address to 32 bytes (for ABI encoding)
 */
export function padAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return ethers.zeroPadValue(address, 32);
}

/**
 * Create deterministic address from CREATE2
 */
export function computeCreate2Address(
  deployer: string,
  salt: string,
  initCodeHash: string
): string {
  return ethers.getCreate2Address(deployer, salt, initCodeHash);
}

/**
 * Generate a random address (for testing)
 */
export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}
