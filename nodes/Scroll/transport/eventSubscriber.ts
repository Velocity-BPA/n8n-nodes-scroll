/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { ethers } from 'ethers';

export interface EventFilter {
  address?: string;
  topics?: Array<string | null>;
  fromBlock?: number;
  toBlock?: number | 'latest';
}

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  callback: (event: ethers.Log) => void;
}

export class EventSubscriber {
  private provider: ethers.JsonRpcProvider;
  private subscriptions: Map<string, { filter: EventFilter; interval: ReturnType<typeof setInterval> }> = new Map();
  private lastBlock: number = 0;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async subscribe(filter: EventFilter, callback: (event: ethers.Log) => void): Promise<string> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.lastBlock === 0) {
      this.lastBlock = await this.provider.getBlockNumber();
    }

    const interval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        if (currentBlock > this.lastBlock) {
          const logs = await this.provider.getLogs({
            ...filter,
            fromBlock: this.lastBlock + 1,
            toBlock: currentBlock,
          });
          for (const log of logs) {
            callback(log);
          }
          this.lastBlock = currentBlock;
        }
      } catch (error) {
        console.error('Event polling error:', error);
      }
    }, 10000);

    this.subscriptions.set(id, { filter, interval });
    return id;
  }

  unsubscribe(id: string): boolean {
    const sub = this.subscriptions.get(id);
    if (sub) {
      clearInterval(sub.interval);
      this.subscriptions.delete(id);
      return true;
    }
    return false;
  }

  unsubscribeAll(): void {
    for (const [, sub] of this.subscriptions) {
      clearInterval(sub.interval);
    }
    this.subscriptions.clear();
  }

  async getLogs(filter: EventFilter): Promise<ethers.Log[]> {
    return this.provider.getLogs(filter);
  }
}

export function createEventSubscriber(provider: ethers.JsonRpcProvider): EventSubscriber {
  return new EventSubscriber(provider);
}
