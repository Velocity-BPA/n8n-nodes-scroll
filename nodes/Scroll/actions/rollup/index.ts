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
		displayOptions: { show: { resource: ['rollup'] } },
		options: [
			{ name: 'Get L1 Info', value: 'getL1Info', action: 'Get L1 info' },
			{ name: 'Get Rollup Info', value: 'getRollupInfo', action: 'Get rollup info' },
			{ name: 'Get Rollup Stats', value: 'getRollupStats', action: 'Get rollup stats' },
		],
		default: 'getRollupInfo',
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
	const network = credentials.network as string;
	let result: IDataObject;

	switch (operation) {
		case 'getRollupInfo': {
			const [latestBlock, networkInfo] = await Promise.all([provider.getBlockNumber(), provider.getNetwork()]);
			result = { chainId: networkInfo.chainId.toString(), latestBlock, network, rollupType: 'zkEVM' };
			break;
		}
		case 'getL1Info': {
			result = { l1ChainId: network === 'mainnet' ? 1 : 11155111, l1Network: network === 'mainnet' ? 'Ethereum Mainnet' : 'Sepolia Testnet', scrollChainContract: network === 'mainnet' ? '0xa13BAF47339d63B743e7Da8741db5456DAc1E556' : '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0' };
			break;
		}
		case 'getRollupStats': {
			const latestBlock = await provider.getBlockNumber();
			result = { totalBlocks: latestBlock, estimatedBatches: Math.floor(latestBlock / 100), network };
			break;
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
