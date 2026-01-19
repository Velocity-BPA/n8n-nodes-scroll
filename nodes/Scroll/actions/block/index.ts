/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';
import { ethers } from 'ethers';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['block'] } },
		options: [
			{ name: 'Get Batch Info', value: 'getBatchInfo', description: 'Get batch info for a block', action: 'Get batch info' },
			{ name: 'Get Block', value: 'getBlock', description: 'Get block by number or hash', action: 'Get block' },
			{ name: 'Get Block By Hash', value: 'getBlockByHash', description: 'Get block by hash', action: 'Get block by hash' },
			{ name: 'Get Block By Number', value: 'getBlockByNumber', description: 'Get block by number', action: 'Get block by number' },
			{ name: 'Get Block Receipts', value: 'getBlockReceipts', description: 'Get all receipts in a block', action: 'Get block receipts' },
			{ name: 'Get Block Transactions', value: 'getBlockTransactions', description: 'Get transactions in a block', action: 'Get block transactions' },
			{ name: 'Get Finalized Block', value: 'getFinalizedBlock', description: 'Get the latest finalized block', action: 'Get finalized block' },
			{ name: 'Get Latest Block', value: 'getLatestBlock', description: 'Get the latest block', action: 'Get latest block' },
			{ name: 'Get Safe Block', value: 'getSafeBlock', description: 'Get the latest safe block', action: 'Get safe block' },
			{ name: 'Subscribe To Blocks', value: 'subscribeToBlocks', description: 'Get recent blocks', action: 'Subscribe to blocks' },
		],
		default: 'getLatestBlock',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: { resource: ['block'], operation: ['getBlockByNumber', 'getBlock', 'getBatchInfo'] } },
	},
	{
		displayName: 'Block Hash',
		name: 'blockHash',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['block'], operation: ['getBlockByHash'] } },
	},
	{
		displayName: 'Block Identifier',
		name: 'blockIdentifier',
		type: 'string',
		default: 'latest',
		displayOptions: { show: { resource: ['block'], operation: ['getBlockTransactions', 'getBlockReceipts'] } },
	},
	{
		displayName: 'Include Transactions',
		name: 'includeTransactions',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['block'], operation: ['getBlock', 'getBlockByNumber', 'getBlockByHash', 'getLatestBlock', 'getFinalizedBlock', 'getSafeBlock'] } },
	},
	{
		displayName: 'Block Count',
		name: 'blockCount',
		type: 'number',
		default: 10,
		displayOptions: { show: { resource: ['block'], operation: ['subscribeToBlocks'] } },
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('scrollNetwork');
	const scrollClient = await createScrollClient({
		network: credentials.network as string,
		rpcUrl: credentials.rpcUrl as string,
		privateKey: credentials.privateKey as string,
		chainId: credentials.chainId as number,
	});

	const provider = scrollClient.getProvider();
	let result: IDataObject;

	const formatBlock = (block: ethers.Block | null, includeTransactions: boolean) => {
		if (!block) return null;
		return {
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: block.timestamp,
			timestampDate: new Date(block.timestamp * 1000).toISOString(),
			nonce: block.nonce,
			difficulty: block.difficulty?.toString(),
			gasLimit: block.gasLimit.toString(),
			gasUsed: block.gasUsed.toString(),
			miner: block.miner,
			extraData: block.extraData,
			baseFeePerGas: block.baseFeePerGas?.toString(),
			transactionCount: block.transactions?.length || 0,
			transactions: includeTransactions ? block.transactions : undefined,
		};
	};

	switch (operation) {
		case 'getLatestBlock': {
			const includeTransactions = this.getNodeParameter('includeTransactions', index) as boolean;
			const block = await provider.getBlock('latest', includeTransactions);
			result = formatBlock(block, includeTransactions) || { error: 'Block not found' };
			break;
		}

		case 'getBlockByNumber':
		case 'getBlock': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;
			const includeTransactions = this.getNodeParameter('includeTransactions', index) as boolean;
			const block = await provider.getBlock(blockNumber, includeTransactions);
			result = formatBlock(block, includeTransactions) || { error: 'Block not found' };
			break;
		}

		case 'getBlockByHash': {
			const blockHash = this.getNodeParameter('blockHash', index) as string;
			const includeTransactions = this.getNodeParameter('includeTransactions', index) as boolean;
			const block = await provider.getBlock(blockHash, includeTransactions);
			result = formatBlock(block, includeTransactions) || { error: 'Block not found' };
			break;
		}

		case 'getFinalizedBlock': {
			const includeTransactions = this.getNodeParameter('includeTransactions', index) as boolean;
			const block = await provider.getBlock('finalized', includeTransactions);
			result = formatBlock(block, includeTransactions) || { error: 'Block not found' };
			break;
		}

		case 'getSafeBlock': {
			const includeTransactions = this.getNodeParameter('includeTransactions', index) as boolean;
			const block = await provider.getBlock('safe', includeTransactions);
			result = formatBlock(block, includeTransactions) || { error: 'Block not found' };
			break;
		}

		case 'getBlockTransactions': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const blockId = blockIdentifier === 'latest' ? 'latest' : parseInt(blockIdentifier);
			const block = await provider.getBlock(blockId, true);
			if (!block) throw new Error('Block not found');
			result = {
				blockNumber: block.number,
				blockHash: block.hash,
				transactionCount: block.transactions.length,
				transactions: block.prefetchedTransactions?.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: ethers.formatEther(tx.value),
					gasLimit: tx.gasLimit.toString(),
					nonce: tx.nonce,
				})) || block.transactions,
			};
			break;
		}

		case 'getBlockReceipts': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const blockId = blockIdentifier === 'latest' ? 'latest' : parseInt(blockIdentifier);
			const block = await provider.getBlock(blockId, true);
			if (!block) throw new Error('Block not found');
			
			const receipts = await Promise.all(
				block.transactions.map(txHash => provider.getTransactionReceipt(txHash as string))
			);
			result = {
				blockNumber: block.number,
				blockHash: block.hash,
				receipts: receipts.filter(r => r).map(r => ({
					transactionHash: r!.hash,
					status: r!.status,
					gasUsed: r!.gasUsed.toString(),
					cumulativeGasUsed: r!.cumulativeGasUsed.toString(),
					contractAddress: r!.contractAddress,
					from: r!.from,
					to: r!.to,
					logsCount: r!.logs.length,
				})),
			};
			break;
		}

		case 'subscribeToBlocks': {
			const blockCount = this.getNodeParameter('blockCount', index) as number;
			const latestBlock = await provider.getBlockNumber();
			const startBlock = Math.max(0, latestBlock - blockCount + 1);
			
			const blocks = await Promise.all(
				Array.from({ length: blockCount }, (_, i) => provider.getBlock(startBlock + i))
			);
			result = {
				latestBlockNumber: latestBlock,
				blockCount,
				blocks: blocks.filter(b => b).map(b => formatBlock(b, false)),
			};
			break;
		}

		case 'getBatchInfo': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;
			// Estimate batch based on block number (approximately 100 blocks per batch)
			const estimatedBatchIndex = Math.floor(blockNumber / 100);
			result = {
				blockNumber,
				estimatedBatchIndex,
				message: 'Batch information requires querying the L1 ScrollChain contract for accurate data',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
