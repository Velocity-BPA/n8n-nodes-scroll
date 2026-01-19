/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { ABIS } from '../constants/contracts';

/**
 * Gas Utility Functions
 *
 * Provides gas estimation and fee calculation functions for Scroll zkEVM.
 * Scroll has both L2 execution fees and L1 data fees.
 */

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  l1DataFee: bigint;
  l2ExecutionFee: bigint;
  totalFee: bigint;
}

export interface FeeData {
  gasPrice: bigint | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
}

/**
 * Get current gas price from provider
 */
export async function getGasPrice(provider: ethers.Provider): Promise<bigint> {
  const feeData = await provider.getFeeData();
  return feeData.gasPrice || 0n;
}

/**
 * Get fee data from provider
 */
export async function getFeeData(provider: ethers.Provider): Promise<FeeData> {
  const feeData = await provider.getFeeData();
  return {
    gasPrice: feeData.gasPrice,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  };
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  provider: ethers.Provider,
  transaction: ethers.TransactionRequest
): Promise<bigint> {
  try {
    const estimate = await provider.estimateGas(transaction);
    // Add 20% buffer for safety
    return (estimate * 120n) / 100n;
  } catch (error) {
    throw new Error(`Gas estimation failed: ${(error as Error).message}`);
  }
}

/**
 * Get L1 data fee for a transaction
 * This is the fee for posting transaction data to L1
 */
export async function getL1DataFee(
  provider: ethers.Provider,
  oracleAddress: string,
  txData: string
): Promise<bigint> {
  try {
    const oracle = new ethers.Contract(
      oracleAddress,
      ABIS.L1GasPriceOracle,
      provider
    );
    const fee = await oracle.getL1Fee(txData);
    return BigInt(fee.toString());
  } catch (error) {
    // If oracle call fails, return 0 (may not be available on all networks)
    console.warn('L1 data fee estimation failed:', (error as Error).message);
    return 0n;
  }
}

/**
 * Calculate total fee estimate for a transaction
 */
export async function calculateTotalFee(
  provider: ethers.Provider,
  transaction: ethers.TransactionRequest,
  oracleAddress?: string
): Promise<GasEstimate> {
  const [gasLimit, feeData] = await Promise.all([
    estimateGas(provider, transaction),
    getFeeData(provider),
  ]);

  const gasPrice = feeData.gasPrice || 0n;
  const maxFeePerGas = feeData.maxFeePerGas || gasPrice;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;

  // Calculate L2 execution fee
  const l2ExecutionFee = gasLimit * maxFeePerGas;

  // Calculate L1 data fee if oracle address provided
  let l1DataFee = 0n;
  if (oracleAddress && transaction.data) {
    l1DataFee = await getL1DataFee(provider, oracleAddress, transaction.data.toString());
  }

  const totalFee = l2ExecutionFee + l1DataFee;

  return {
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    l1DataFee,
    l2ExecutionFee,
    totalFee,
  };
}

/**
 * Format gas price to Gwei
 */
export function formatGwei(value: bigint): string {
  return ethers.formatUnits(value, 'gwei');
}

/**
 * Parse Gwei to wei
 */
export function parseGwei(value: string): bigint {
  return ethers.parseUnits(value, 'gwei');
}

/**
 * Calculate gas limit with multiplier
 */
export function calculateGasWithBuffer(
  estimate: bigint,
  multiplier = 1.2
): bigint {
  return BigInt(Math.ceil(Number(estimate) * multiplier));
}

/**
 * Check if user has enough ETH for gas
 */
export async function hasEnoughGas(
  provider: ethers.Provider,
  address: string,
  estimatedFee: bigint
): Promise<boolean> {
  const balance = await provider.getBalance(address);
  return balance >= estimatedFee;
}

/**
 * Get gas price with priority
 */
export async function getGasPriceWithPriority(
  provider: ethers.Provider,
  priority: 'low' | 'medium' | 'high'
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const feeData = await provider.getFeeData();
  const baseFee = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  
  const multipliers = {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
  };

  const priorityFees = {
    low: ethers.parseUnits('0.001', 'gwei'),
    medium: ethers.parseUnits('0.01', 'gwei'),
    high: ethers.parseUnits('0.1', 'gwei'),
  };

  const multiplier = multipliers[priority];
  const maxFeePerGas = BigInt(Math.ceil(Number(baseFee) * multiplier));
  const maxPriorityFeePerGas = priorityFees[priority];

  return { maxFeePerGas, maxPriorityFeePerGas };
}

/**
 * Estimate bridge gas (includes L1 gas for cross-chain operations)
 */
export async function estimateBridgeGas(
  provider: ethers.Provider,
  isDeposit: boolean
): Promise<bigint> {
  // Bridge operations require more gas due to cross-chain messaging
  const baseGas = isDeposit ? 200000n : 300000n;
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  
  return baseGas * gasPrice;
}

/**
 * Estimate gas with buffer (wrapper for common use case)
 */
export async function estimateGasWithBuffer(
  provider: ethers.Provider,
  transaction: ethers.TransactionRequest,
  bufferPercent = 20
): Promise<bigint> {
  const estimate = await provider.estimateGas(transaction);
  return (estimate * BigInt(100 + bufferPercent)) / 100n;
}
