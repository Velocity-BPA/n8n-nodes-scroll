/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['batch'] } },
		options: [
			{ name: 'Get Batch Status', value: 'getBatchStatus', action: 'Get batch status' },
			{ name: 'Get Latest Batch', value: 'getLatestBatch', action: 'Get latest batch' },
			{ name: 'Get Pending Batches', value: 'getPendingBatches', action: 'Get pending batches' },
		],
		default: 'getLatestBatch',
	},
	{
		displayName: 'Batch Index',
		name: 'batchIndex',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['batch'], operation: ['getBatchStatus'] } },
	},
];

export async function execute(this: IExecuteFunctions, index: number, operation: string): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('scrollNetwork');
	const scrollClient = await createScrollClient({
		network: credentials.network as string,
		rpcUrl: credentials.rpcUrl as string,
		privateKey: credentials.privateKey as string,
		chainId: credentials.chainId as number,
	});

	const provider = scrollClient.getProvider();
	let result: IDataObject;

	switch (operation) {
		case 'getLatestBatch': {
			const blockNumber = await provider.getBlockNumber();
			const estimatedBatch = Math.floor(blockNumber / 100);
			result = { latestBlockNumber: blockNumber, estimatedBatchIndex: estimatedBatch, message: 'Batch indices are estimated. Use L1 ScrollChain contract for exact data.' };
			break;
		}
		case 'getBatchStatus': {
			const batchIndex = this.getNodeParameter('batchIndex', index) as number;
			result = { batchIndex, message: 'Batch status requires querying L1 ScrollChain contract', estimatedBlocks: `${batchIndex * 100} - ${(batchIndex + 1) * 100}` };
			break;
		}
		case 'getPendingBatches': {
			result = { message: 'Pending batches require querying L1 ScrollChain contract' };
			break;
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
