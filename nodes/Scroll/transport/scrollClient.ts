/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { IExecuteFunctions, ILoadOptionsFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { getNetworkConfig, NetworkConfig, SCROLL_NETWORKS } from '../constants/networks';
import { getContracts, ABIS } from '../constants/contracts';

/**
 * Scroll Client
 *
 * Main transport client for interacting with Scroll zkEVM network.
 * Handles provider/signer setup, contract interactions, and RPC calls.
 */

export interface ScrollClientOptions {
  network: string;
  rpcUrl?: string;
  privateKey?: string;
  chainId?: number;
  wsUrl?: string;
}

export class ScrollClient {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;
  private network: NetworkConfig;
  private wsProvider?: ethers.WebSocketProvider;

  constructor(options: ScrollClientOptions) {
    // Get network configuration
    if (options.network === 'custom') {
      if (!options.rpcUrl) {
        throw new Error('RPC URL is required for custom network');
      }
      this.network = {
        name: 'Custom Network',
        chainId: options.chainId || 534352,
        rpcUrl: options.rpcUrl,
        wsUrl: options.wsUrl || '',
        explorerUrl: '',
        explorerApiUrl: '',
        bridgeApiUrl: '',
        l1ChainId: 1,
        l1RpcUrl: '',
        isTestnet: false,
      };
    } else {
      this.network = getNetworkConfig(options.network);
    }

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      options.rpcUrl || this.network.rpcUrl,
      {
        chainId: this.network.chainId,
        name: this.network.name,
      }
    );

    // Initialize signer if private key provided
    if (options.privateKey) {
      const key = options.privateKey.startsWith('0x')
        ? options.privateKey
        : `0x${options.privateKey}`;
      this.signer = new ethers.Wallet(key, this.provider);
    }

    // Initialize WebSocket provider if URL provided
    const wsUrl = options.wsUrl || this.network.wsUrl;
    if (wsUrl) {
      try {
        this.wsProvider = new ethers.WebSocketProvider(wsUrl);
      } catch {
        // WebSocket connection failed, continue without it
      }
    }
  }

  /**
   * Get the JSON-RPC provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get the signer (wallet)
   */
  getSigner(): ethers.Wallet | undefined {
    return this.signer;
  }

  /**
   * Check if signer is available
   */
  hasSigner(): boolean {
    return !!this.signer;
  }

  /**
   * Get the WebSocket provider
   */
  getWsProvider(): ethers.WebSocketProvider | undefined {
    return this.wsProvider;
  }

  /**
   * Get the network configuration
   */
  getNetwork(): NetworkConfig {
    return this.network;
  }

  /**
   * Get contract addresses for the network
   */
  getContracts() {
    if (this.network.name === 'Custom Network') {
      throw new Error('Contract addresses not available for custom network');
    }
    return getContracts(
      this.network.chainId === 534352 ? 'mainnet' : 'sepolia'
    );
  }

  /**
   * Get signer address
   */
  getSignerAddress(): string {
    if (!this.signer) throw new Error('No signer available');
    return this.signer.address;
  }

  /**
   * Get ETH balance
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    return this.provider.getTransactionCount(address);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockHashOrNumber: string | number): Promise<ethers.Block | null> {
    return this.provider.getBlock(blockHashOrNumber);
  }

  /**
   * Get transaction
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    return this.provider.getTransaction(txHash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Send ETH
   */
  async sendETH(
    to: string,
    amount: bigint,
    options?: { gasLimit?: bigint; gasPrice?: bigint }
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) throw new Error('No signer available');
    
    const tx: ethers.TransactionRequest = {
      to,
      value: amount,
    };

    if (options?.gasLimit) {
      tx.gasLimit = options.gasLimit;
    }
    if (options?.gasPrice) {
      tx.gasPrice = options.gasPrice;
    }

    return this.signer.sendTransaction(tx);
  }

  /**
   * Send raw transaction
   */
  async sendTransaction(
    tx: ethers.TransactionRequest
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) throw new Error('No signer available');
    return this.signer.sendTransaction(tx);
  }

  /**
   * Sign transaction without sending
   */
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    if (!this.signer) throw new Error('No signer available');
    return this.signer.signTransaction(tx);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return this.provider.estimateGas(tx);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Get fee data
   */
  async getFeeData(): Promise<ethers.FeeData> {
    return this.provider.getFeeData();
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<bigint> {
    const network = await this.provider.getNetwork();
    return network.chainId;
  }

  /**
   * Call a contract function (read-only)
   */
  async call(tx: ethers.TransactionRequest): Promise<string> {
    return this.provider.call(tx);
  }

  /**
   * Get contract instance
   */
  getContract(
    address: string,
    abi: ethers.InterfaceAbi,
    useSigner = false
  ): ethers.Contract {
    return new ethers.Contract(
      address,
      abi,
      useSigner && this.signer ? this.signer : this.provider
    );
  }

  /**
   * Get ERC20 contract instance
   */
  getERC20Contract(address: string, useSigner = false): ethers.Contract {
    return this.getContract(address, ABIS.ERC20, useSigner);
  }

  /**
   * Get ERC721 contract instance
   */
  getERC721Contract(address: string, useSigner = false): ethers.Contract {
    return this.getContract(address, ABIS.ERC721, useSigner);
  }

  /**
   * Get ERC1155 contract instance
   */
  getERC1155Contract(address: string, useSigner = false): ethers.Contract {
    return this.getContract(address, ABIS.ERC1155, useSigner);
  }

  /**
   * Get logs by filter
   */
  async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
    return this.provider.getLogs(filter);
  }

  /**
   * Get code at address
   */
  async getCode(address: string): Promise<string> {
    return this.provider.getCode(address);
  }

  /**
   * Get storage at slot
   */
  async getStorageAt(address: string, slot: string | number): Promise<string> {
    return this.provider.getStorage(address, slot);
  }

  /**
   * Test connection to the network
   */
  async testConnection(): Promise<{ success: boolean; chainId: bigint; blockNumber: number }> {
    try {
      const [chainId, blockNumber] = await Promise.all([
        this.getChainId(),
        this.getBlockNumber(),
      ]);
      return { success: true, chainId, blockNumber };
    } catch (error) {
      throw new Error(`Connection test failed: ${(error as Error).message}`);
    }
  }

  /**
   * Close WebSocket connection
   */
  async close(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
  }
}

/**
 * Create a ScrollClient from options or n8n credentials
 */
export async function createScrollClient(
  optionsOrContext: ScrollClientOptions | IExecuteFunctions | ILoadOptionsFunctions,
  credentialsName = 'scrollNetwork'
): Promise<ScrollClient> {
  // Check if this is a direct options object
  if ('network' in optionsOrContext && typeof optionsOrContext.network === 'string' && !('getCredentials' in optionsOrContext)) {
    // Direct options
    const options = optionsOrContext as ScrollClientOptions;
    return new ScrollClient(options);
  }

  // n8n context
  const context = optionsOrContext as IExecuteFunctions | ILoadOptionsFunctions;
  const credentials = await context.getCredentials(credentialsName) as ICredentialDataDecryptedObject;

  const network = credentials.network as string;
  const rpcUrl = credentials.rpcUrl as string;
  const privateKey = credentials.privateKey as string;
  const chainId = credentials.chainId as number;
  const wsUrl = credentials.wsUrl as string;

  return new ScrollClient({
    network,
    rpcUrl: rpcUrl || undefined,
    privateKey: privateKey || undefined,
    chainId: chainId || undefined,
    wsUrl: wsUrl || undefined,
  });
}

/**
 * Get default RPC URL for a network
 */
export function getDefaultRpcUrl(network: string): string {
  const config = SCROLL_NETWORKS[network];
  return config?.rpcUrl || '';
}
