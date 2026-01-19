/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { ScrollClient } from './scrollClient';
import { getContracts, ABIS } from '../constants/contracts';
import { BatchStatus, BatchInfo } from '../utils/proofUtils';

/**
 * Batch Client
 *
 * Handles batch and ZK proof operations for Scroll zkEVM.
 * 
 * Scroll zkEVM Flow:
 * 1. Transactions are executed on L2
 * 2. Transactions are grouped into batches
 * 3. Batches are committed to L1 (data availability)
 * 4. ZK proofs are generated off-chain
 * 5. Proofs are verified on L1 (finalization)
 */

export interface BatchDetails extends BatchInfo {
  startBlockNumber: number;
  endBlockNumber: number;
  totalL1CommitGas: bigint;
  totalL1FinalizeGas: bigint;
  commitTxHash?: string;
  finalizeTxHash?: string;
}

export interface RollupInfo {
  lastCommittedBatchIndex: number;
  lastFinalizedBatchIndex: number;
  pendingBatches: number;
  l1Contract: string;
  l2MessageQueue: string;
}

export class BatchClient {
  private l1Provider: ethers.JsonRpcProvider;
  private contracts: ReturnType<typeof getContracts>;
  private scrollChain: ethers.Contract;

  constructor(scrollClient: ScrollClient, l1RpcUrl: string) {
    this.l1Provider = new ethers.JsonRpcProvider(l1RpcUrl);

    // Get contracts for the network
    const networkName = scrollClient.getNetwork().chainId === 534352 ? 'mainnet' : 'sepolia';
    this.contracts = getContracts(networkName);

    // Initialize ScrollChain contract on L1
    this.scrollChain = new ethers.Contract(
      this.contracts.l1.scrollChain,
      ABIS.ScrollChain,
      this.l1Provider
    );
  }

  /**
   * Get the last finalized batch index
   */
  async getLastFinalizedBatchIndex(): Promise<number> {
    const index = await this.scrollChain.lastFinalizedBatchIndex();
    return Number(index);
  }

  /**
   * Check if a batch is finalized
   */
  async isBatchFinalized(batchIndex: number): Promise<boolean> {
    return this.scrollChain.isBatchFinalized(batchIndex);
  }

  /**
   * Get batch hash (commitment)
   */
  async getBatchCommitment(batchIndex: number): Promise<string> {
    return this.scrollChain.committedBatches(batchIndex);
  }

  /**
   * Get finalized state root for a batch
   */
  async getFinalizedStateRoot(batchIndex: number): Promise<string> {
    return this.scrollChain.finalizedStateRoots(batchIndex);
  }

  /**
   * Get withdraw root for a batch
   */
  async getWithdrawRoot(batchIndex: number): Promise<string> {
    return this.scrollChain.withdrawRoots(batchIndex);
  }

  /**
   * Get batch info
   */
  async getBatchInfo(batchIndex: number): Promise<BatchInfo> {
    const [isFinalized, commitment, stateRoot, withdrawRoot] = await Promise.all([
      this.isBatchFinalized(batchIndex),
      this.getBatchCommitment(batchIndex),
      this.getFinalizedStateRoot(batchIndex).catch(() => ethers.ZeroHash),
      this.getWithdrawRoot(batchIndex).catch(() => ethers.ZeroHash),
    ]);

    let status: BatchStatus;
    if (isFinalized) {
      status = BatchStatus.FINALIZED;
    } else if (commitment !== ethers.ZeroHash) {
      status = BatchStatus.COMMITTED;
    } else {
      status = BatchStatus.PENDING;
    }

    return {
      index: batchIndex,
      hash: commitment,
      status,
      stateRoot: stateRoot !== ethers.ZeroHash ? stateRoot : undefined,
      withdrawRoot: withdrawRoot !== ethers.ZeroHash ? withdrawRoot : undefined,
    };
  }

  /**
   * Get rollup info
   */
  async getRollupInfo(): Promise<RollupInfo> {
    const lastFinalizedBatchIndex = await this.getLastFinalizedBatchIndex();

    // Estimate last committed by checking recent batches
    let lastCommittedBatchIndex = lastFinalizedBatchIndex;
    for (let i = lastFinalizedBatchIndex + 1; i <= lastFinalizedBatchIndex + 100; i++) {
      const commitment = await this.getBatchCommitment(i);
      if (commitment === ethers.ZeroHash) {
        break;
      }
      lastCommittedBatchIndex = i;
    }

    return {
      lastCommittedBatchIndex,
      lastFinalizedBatchIndex,
      pendingBatches: lastCommittedBatchIndex - lastFinalizedBatchIndex,
      l1Contract: this.contracts.l1.scrollChain,
      l2MessageQueue: this.contracts.l2.l2MessageQueue,
    };
  }

  /**
   * Get batch events from L1
   */
  async getBatchEvents(
    fromBlock: number,
    toBlock: number | 'latest' = 'latest'
  ): Promise<{ commits: Array<{ batchIndex: number; batchHash: string; txHash: string; blockNumber: number }>; finalizations: Array<{ batchIndex: number; batchHash: string; stateRoot: string; withdrawRoot: string; txHash: string; blockNumber: number }> }> {
    const commitFilter = this.scrollChain.filters.CommitBatch();
    const finalizeFilter = this.scrollChain.filters.FinalizeBatch();

    const [commitEvents, finalizeEvents] = await Promise.all([
      this.scrollChain.queryFilter(commitFilter, fromBlock, toBlock),
      this.scrollChain.queryFilter(finalizeFilter, fromBlock, toBlock),
    ]);

    return {
      commits: commitEvents.map((e) => {
        const event = e as ethers.EventLog;
        return {
          batchIndex: Number(event.args?.[0] || 0),
          batchHash: event.args?.[1] || '',
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
        };
      }),
      finalizations: finalizeEvents.map((e) => {
        const event = e as ethers.EventLog;
        return {
          batchIndex: Number(event.args?.[0] || 0),
          batchHash: event.args?.[1] || '',
          stateRoot: event.args?.[2] || '',
          withdrawRoot: event.args?.[3] || '',
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
        };
      }),
    };
  }

  /**
   * Get batch for a specific L2 block number
   * Note: This is an approximation
   */
  async getBatchForBlock(l2BlockNumber: number): Promise<number | null> {
    // Query Scrollscan API or estimate based on average blocks per batch
    const avgBlocksPerBatch = 100;
    const estimatedBatch = Math.floor(l2BlockNumber / avgBlocksPerBatch);
    
    // Verify this batch exists
    const info = await this.getBatchInfo(estimatedBatch);
    if (info.status !== BatchStatus.PENDING) {
      return estimatedBatch;
    }
    
    return null;
  }

  /**
   * Wait for a batch to be finalized
   */
  async waitForBatchFinalization(
    batchIndex: number,
    timeoutMs = 3600000, // 1 hour default
    pollIntervalMs = 30000 // 30 seconds
  ): Promise<BatchInfo> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const info = await this.getBatchInfo(batchIndex);
      
      if (info.status === BatchStatus.FINALIZED) {
        return info;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timeout waiting for batch ${batchIndex} finalization`);
  }

  /**
   * Get finalized batches in range
   */
  async getFinalizedBatches(
    startIndex: number,
    endIndex: number
  ): Promise<BatchInfo[]> {
    const batches: BatchInfo[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      const info = await this.getBatchInfo(i);
      if (info.status === BatchStatus.FINALIZED) {
        batches.push(info);
      }
    }

    return batches;
  }

  /**
   * Get pending batches (committed but not finalized)
   */
  async getPendingBatches(): Promise<BatchInfo[]> {
    const { lastCommittedBatchIndex, lastFinalizedBatchIndex } = await this.getRollupInfo();
    const batches: BatchInfo[] = [];

    for (let i = lastFinalizedBatchIndex + 1; i <= lastCommittedBatchIndex; i++) {
      const info = await this.getBatchInfo(i);
      batches.push(info);
    }

    return batches;
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(): Promise<{
    totalFinalized: number;
    totalCommitted: number;
    pendingCount: number;
    avgBatchTime: number;
  }> {
    const info = await this.getRollupInfo();

    return {
      totalFinalized: info.lastFinalizedBatchIndex,
      totalCommitted: info.lastCommittedBatchIndex,
      pendingCount: info.pendingBatches,
      avgBatchTime: 15 * 60, // ~15 minutes average (in seconds)
    };
  }
}

/**
 * Create a BatchClient from ScrollClient
 */
export function createBatchClient(
  scrollClient: ScrollClient,
  l1RpcUrl: string
): BatchClient {
  return new BatchClient(scrollClient, l1RpcUrl);
}
