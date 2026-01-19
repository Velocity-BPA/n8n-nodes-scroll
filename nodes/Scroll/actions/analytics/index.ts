/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
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
		displayOptions: { show: { resource: ['analytics'] } },
		options: [
			{ name: 'Get Gas Stats', value: 'getGasStats', action: 'Get gas stats' },
			{ name: 'Get Network Stats', value: 'getNetworkStats', action: 'Get network stats' },
			{ name: 'Get TPS', value: 'getTPS', action: 'Get TPS' },
		],
		default: 'getNetworkStats',
	},
	{
		displayName: 'Block Count',
		name: 'blockCount',
		type: 'number',
		default: 10,
		displayOptions: { show: { resource: ['analytics'], operation: ['getTPS', 'getGasStats'] } },
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
		case 'getNetworkStats': {
			const [blockNumber, network, feeData] = await Promise.all([provider.getBlockNumber(), provider.getNetwork(), provider.getFeeData()]);
			result = { blockNumber, chainId: network.chainId.toString(), gasPrice: feeData.gasPrice?.toString(), gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null };
			break;
		}
		case 'getTPS': {
			const blockCount = this.getNodeParameter('blockCount', index) as number;
			const currentBlock = await provider.getBlockNumber();
			let totalTxs = 0, totalTime = 0;
			const startBlock = await provider.getBlock(currentBlock - blockCount);
			const endBlock = await provider.getBlock(currentBlock);
			if (startBlock && endBlock) {
				for (let i = currentBlock - blockCount + 1; i <= currentBlock; i++) {
					const block = await provider.getBlock(i);
					if (block) totalTxs += block.transactions.length;
				}
				totalTime = endBlock.timestamp - startBlock.timestamp;
			}
			result = { tps: totalTime > 0 ? (totalTxs / totalTime).toFixed(2) : '0', totalTransactions: totalTxs, timeSpan: totalTime, blockCount };
			break;
		}
		case 'getGasStats': {
			const blockCount = this.getNodeParameter('blockCount', index) as number;
			const currentBlock = await provider.getBlockNumber();
			const history: IDataObject[] = [];
			for (let i = 0; i < blockCount; i++) {
				const block = await provider.getBlock(currentBlock - i);
				if (block) {
					history.push({ blockNumber: block.number, baseFeePerGas: block.baseFeePerGas?.toString(), gasUsed: block.gasUsed.toString(), gasLimit: block.gasLimit.toString() });
				}
			}
			result = { history, blockCount: history.length };
			break;
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
