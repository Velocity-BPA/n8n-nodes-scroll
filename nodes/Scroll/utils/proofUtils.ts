/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Proof Utility Functions
 *
 * Utilities for working with Scroll zkEVM proofs and batches.
 * 
 * Scroll zkEVM Concepts:
 * - Batch: A group of L2 transactions that are processed together
 * - Commitment: The batch data is committed to L1
 * - Proof: A ZK validity proof that proves correct execution
 * - Finalization: The proof is verified on L1, making transactions final
 */

export enum BatchStatus {
  PENDING = 'pending',
  COMMITTED = 'committed',
  PROVED = 'proved',
  FINALIZED = 'finalized',
}

export interface BatchInfo {
  index: number;
  hash: string;
  status: BatchStatus;
  l1TxHash?: string;
  stateRoot?: string;
  withdrawRoot?: string;
  parentHash?: string;
  timestamp?: number;
  transactionCount?: number;
}

export interface ProofInfo {
  batchIndex: number;
  proof: string;
  publicInputs: string[];
  verified: boolean;
  verificationTxHash?: string;
}

/**
 * Check if a batch is finalized
 */
export function isBatchFinalized(
  batchIndex: number,
  lastFinalizedIndex: number
): boolean {
  return batchIndex <= lastFinalizedIndex;
}

/**
 * Check if a batch is committed
 */
export function isBatchCommitted(
  batchIndex: number,
  lastCommittedIndex: number
): boolean {
  return batchIndex <= lastCommittedIndex;
}

/**
 * Get batch status based on indices
 */
export function getBatchStatus(
  batchIndex: number,
  lastFinalizedIndex: number,
  lastCommittedIndex: number
): BatchStatus {
  if (batchIndex <= lastFinalizedIndex) {
    return BatchStatus.FINALIZED;
  }
  if (batchIndex <= lastCommittedIndex) {
    return BatchStatus.COMMITTED;
  }
  return BatchStatus.PENDING;
}

/**
 * Estimate time until batch finalization
 * Scroll batches are typically finalized within 1-4 hours
 */
export function estimateBatchFinalizationTime(
  batchIndex: number,
  currentBatchIndex: number,
  avgBatchTimeMinutes = 15
): {
  estimatedMinutes: number;
  description: string;
} {
  const batchesBehind = currentBatchIndex - batchIndex;
  
  if (batchesBehind < 0) {
    return {
      estimatedMinutes: Math.abs(batchesBehind) * avgBatchTimeMinutes + 60,
      description: 'Batch not yet committed. Estimated 1-4 hours for finalization.',
    };
  }
  
  // Already committed, waiting for proof
  return {
    estimatedMinutes: 60 - (batchesBehind * avgBatchTimeMinutes),
    description: 'Batch committed. Waiting for ZK proof verification.',
  };
}

/**
 * Decode batch hash from event
 */
export function decodeBatchHash(eventData: string): string {
  return eventData.slice(0, 66); // First 32 bytes
}

/**
 * Calculate state root from batch data
 */
export function calculateStateRoot(
  previousStateRoot: string,
  transactions: string[]
): string {
  // Simplified - actual implementation depends on Scroll's state trie
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes[]'],
    [previousStateRoot, transactions]
  );
  return ethers.keccak256(encoded);
}

/**
 * Verify merkle proof for a transaction in a batch
 */
export function verifyMerkleProof(
  txHash: string,
  proof: string[],
  root: string,
  index: number
): boolean {
  let computedHash = txHash;
  
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    
    if (index % 2 === 0) {
      computedHash = ethers.keccak256(
        ethers.concat([computedHash, proofElement])
      );
    } else {
      computedHash = ethers.keccak256(
        ethers.concat([proofElement, computedHash])
      );
    }
    
    index = Math.floor(index / 2);
  }
  
  return computedHash === root;
}

/**
 * Get proof data structure for message claiming
 */
export function formatMessageProof(
  batchIndex: number,
  merkleProof: string
): { batchIndex: number; merkleProof: string } {
  return {
    batchIndex,
    merkleProof,
  };
}

/**
 * Parse rollup event for batch info
 */
export function parseRollupEvent(
  log: ethers.Log,
  eventType: 'commit' | 'finalize'
): Partial<BatchInfo> | null {
  try {
    const batchIndex = parseInt(log.topics[1], 16);
    const batchHash = log.topics[2];
    
    if (eventType === 'commit') {
      return {
        index: batchIndex,
        hash: batchHash,
        status: BatchStatus.COMMITTED,
        l1TxHash: log.transactionHash,
      };
    } else {
      // Finalize event includes state root and withdraw root
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const decoded = abiCoder.decode(['bytes32', 'bytes32'], log.data);
      
      return {
        index: batchIndex,
        hash: batchHash,
        status: BatchStatus.FINALIZED,
        l1TxHash: log.transactionHash,
        stateRoot: decoded[0],
        withdrawRoot: decoded[1],
      };
    }
  } catch {
    return null;
  }
}

/**
 * Calculate the batch index for a given block number
 * This is an approximation based on average transactions per batch
 */
export function estimateBatchForBlock(
  blockNumber: number,
  genesisBlock: number,
  avgBlocksPerBatch = 100
): number {
  if (blockNumber < genesisBlock) {
    return 0;
  }
  return Math.floor((blockNumber - genesisBlock) / avgBlocksPerBatch);
}

/**
 * Format batch status for display
 */
export function formatBatchStatus(status: BatchStatus): string {
  const statusMap: Record<BatchStatus, string> = {
    [BatchStatus.PENDING]: '⏳ Pending',
    [BatchStatus.COMMITTED]: '📝 Committed',
    [BatchStatus.PROVED]: '🔐 Proved',
    [BatchStatus.FINALIZED]: '✅ Finalized',
  };
  return statusMap[status] || status;
}
