/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { ethers } from 'ethers';
import { ScrollClient } from './scrollClient';
import { getContracts } from '../constants/contracts';

export interface BridgeTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'finalized' | 'claimable' | 'claimed';
  direction: 'deposit' | 'withdrawal';
  timestamp?: number;
}

export class BridgeClient {
  private scrollClient: ScrollClient;
  private l1Provider: ethers.JsonRpcProvider;
  private contracts: ReturnType<typeof getContracts>;

  constructor(scrollClient: ScrollClient, l1RpcUrl: string) {
    this.scrollClient = scrollClient;
    this.l1Provider = new ethers.JsonRpcProvider(l1RpcUrl);
    const networkName = scrollClient.getNetwork().chainId === 534352 ? 'mainnet' : 'sepolia';
    this.contracts = getContracts(networkName);
  }

  async getDepositStatus(txHash: string): Promise<BridgeTransaction> {
    const receipt = await this.l1Provider.getTransactionReceipt(txHash);
    return {
      txHash,
      from: receipt?.from || '',
      to: receipt?.to || '',
      amount: '0',
      status: receipt ? (receipt.status === 1 ? 'confirmed' : 'pending') : 'pending',
      direction: 'deposit',
    };
  }

  async getWithdrawalStatus(txHash: string): Promise<BridgeTransaction> {
    const receipt = await this.scrollClient.getProvider().getTransactionReceipt(txHash);
    return {
      txHash,
      from: receipt?.from || '',
      to: receipt?.to || '',
      amount: '0',
      status: receipt ? (receipt.status === 1 ? 'confirmed' : 'pending') : 'pending',
      direction: 'withdrawal',
    };
  }

  async estimateDepositGas(): Promise<bigint> {
    return 150000n;
  }

  async estimateWithdrawalGas(): Promise<bigint> {
    return 200000n;
  }

  getL1Contracts() {
    return this.contracts.l1;
  }

  getL2Contracts() {
    return this.contracts.l2;
  }
}

export function createBridgeClient(scrollClient: ScrollClient, l1RpcUrl: string): BridgeClient {
  return new BridgeClient(scrollClient, l1RpcUrl);
}
