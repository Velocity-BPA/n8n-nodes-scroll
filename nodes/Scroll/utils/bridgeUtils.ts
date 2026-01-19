/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Bridge Utility Functions
 *
 * Utilities for Scroll L1 <-> L2 bridge operations.
 * The Scroll bridge uses a canonical bridge with L1 and L2 gateways.
 */

export enum BridgeStatus {
  PENDING = 'pending',
  RELAYED = 'relayed',
  CLAIMABLE = 'claimable',
  CLAIMED = 'claimed',
  FAILED = 'failed',
}

export interface BridgeTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token?: string;
  isDeposit: boolean;
  status: BridgeStatus;
  l1TxHash?: string;
  l2TxHash?: string;
  batchIndex?: number;
  timestamp?: number;
}

export interface MessageProof {
  batchIndex: number;
  merkleProof: string;
}

/**
 * Estimate time for bridge operation
 * Deposits: ~10-15 minutes (depends on L1 finality)
 * Withdrawals: ~7-14 days (depends on challenge period)
 */
export function estimateBridgeTime(isDeposit: boolean): {
  minMinutes: number;
  maxMinutes: number;
  description: string;
} {
  if (isDeposit) {
    return {
      minMinutes: 10,
      maxMinutes: 20,
      description: 'Deposits typically take 10-20 minutes to be relayed on L2',
    };
  } else {
    return {
      minMinutes: 10080, // 7 days
      maxMinutes: 20160, // 14 days
      description: 'Withdrawals require a challenge period of 7-14 days before claiming on L1',
    };
  }
}

/**
 * Calculate bridge fee for cross-chain messaging
 */
export function calculateBridgeFee(
  gasLimit: bigint,
  l1GasPrice: bigint,
  isDeposit: boolean
): bigint {
  // Deposits pay gas on L1 for the relay transaction
  // Withdrawals pay gas on L2 and need additional L1 gas for claiming
  const baseFee = gasLimit * l1GasPrice;
  
  if (isDeposit) {
    // Add ~20% buffer for L2 relay
    return (baseFee * 120n) / 100n;
  } else {
    // Withdrawals need to account for claim transaction
    return (baseFee * 150n) / 100n;
  }
}

/**
 * Encode deposit data for gateway
 */
export function encodeDepositData(
  recipient: string,
  amount: bigint,
  gasLimit: bigint
): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(
    ['address', 'uint256', 'uint256'],
    [recipient, amount, gasLimit]
  );
}

/**
 * Encode withdrawal data for gateway
 */
export function encodeWithdrawalData(
  recipient: string,
  amount: bigint,
  gasLimit: bigint
): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(
    ['address', 'uint256', 'uint256'],
    [recipient, amount, gasLimit]
  );
}

/**
 * Parse bridge event log
 */
export function parseBridgeEvent(
  log: ethers.Log,
  isDeposit: boolean
): Partial<BridgeTransaction> | null {
  try {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    
    // Topics: [eventSignature, from, to]
    const from = ethers.getAddress('0x' + log.topics[1].slice(26));
    const to = ethers.getAddress('0x' + log.topics[2].slice(26));
    
    // Data: [amount, data]
    const decoded = abiCoder.decode(['uint256', 'bytes'], log.data);
    const amount = decoded[0].toString();
    
    return {
      hash: log.transactionHash,
      from,
      to,
      value: amount,
      isDeposit,
      status: BridgeStatus.PENDING,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a withdrawal is claimable
 */
export async function isWithdrawalClaimable(
  batchIndex: number,
  lastFinalizedBatch: number
): Promise<boolean> {
  return batchIndex <= lastFinalizedBatch;
}

/**
 * Get gateway type for a token
 */
export function getGatewayType(tokenAddress: string): string {
  if (tokenAddress === ethers.ZeroAddress || 
      tokenAddress === '0x0000000000000000000000000000000000000000') {
    return 'ETH';
  }
  // Default to standard ERC20 gateway
  return 'ERC20';
}

/**
 * Validate bridge amount
 */
export function validateBridgeAmount(
  amount: bigint,
  balance: bigint,
  minAmount = 0n
): { valid: boolean; error?: string } {
  if (amount <= 0n) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount < minAmount) {
    return { 
      valid: false, 
      error: `Amount must be at least ${ethers.formatEther(minAmount)} ETH` 
    };
  }
  
  if (amount > balance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  return { valid: true };
}

/**
 * Format bridge status for display
 */
export function formatBridgeStatus(status: BridgeStatus): string {
  const statusMap: Record<BridgeStatus, string> = {
    [BridgeStatus.PENDING]: '⏳ Pending',
    [BridgeStatus.RELAYED]: '✅ Relayed',
    [BridgeStatus.CLAIMABLE]: '🔓 Claimable',
    [BridgeStatus.CLAIMED]: '✅ Claimed',
    [BridgeStatus.FAILED]: '❌ Failed',
  };
  return statusMap[status] || status;
}

/**
 * Calculate message hash for cross-chain message
 */
export function calculateMessageHash(
  sender: string,
  target: string,
  value: bigint,
  nonce: bigint,
  message: string
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'uint256', 'bytes'],
      [sender, target, value, nonce, message]
    )
  );
}
