/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';
import { ethers } from 'ethers';
import { MULTICALL3_ADDRESS, MULTICALL3_ABI } from '../../constants/contracts';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['multicall'] } },
		options: [
			{ name: 'Batch Read Calls', value: 'batchReadCalls', description: 'Execute multiple read calls', action: 'Batch read calls' },
			{ name: 'Batch Write Calls', value: 'batchWriteCalls', description: 'Execute multiple write calls', action: 'Batch write calls' },
			{ name: 'Create Multicall', value: 'createMulticall', description: 'Create a multicall batch', action: 'Create multicall' },
			{ name: 'Execute Multicall', value: 'executeMulticall', description: 'Execute a multicall', action: 'Execute multicall' },
			{ name: 'Get Multicall Results', value: 'getMulticallResults', description: 'Get multicall results', action: 'Get multicall results' },
		],
		default: 'batchReadCalls',
	},
	{
		displayName: 'Calls',
		name: 'calls',
		type: 'json',
		default: '[]',
		description: 'Array of call objects: [{target: "0x...", callData: "0x..."}, ...]',
		displayOptions: { show: { resource: ['multicall'] } },
	},
	{
		displayName: 'Allow Failures',
		name: 'allowFailures',
		type: 'boolean',
		default: true,
		displayOptions: { show: { resource: ['multicall'], operation: ['batchReadCalls', 'batchWriteCalls', 'executeMulticall'] } },
	},
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['multicall'], operation: ['getMulticallResults'] } },
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
	const signer = scrollClient.getSigner();
	const network = credentials.network as string;
	const multicallAddress = MULTICALL3_ADDRESS[network as keyof typeof MULTICALL3_ADDRESS] || MULTICALL3_ADDRESS.mainnet;
	let result: IDataObject;

	switch (operation) {
		case 'createMulticall': {
			const callsParam = this.getNodeParameter('calls', index) as string;
			const calls = JSON.parse(callsParam);

			result = {
				multicallAddress,
				callCount: calls.length,
				calls: calls.map((call: { target: string; callData: string }, i: number) => ({
					index: i,
					target: call.target,
					callData: call.callData,
				})),
				message: 'Multicall batch created. Use batchReadCalls or batchWriteCalls to execute.',
			};
			break;
		}

		case 'batchReadCalls': {
			const callsParam = this.getNodeParameter('calls', index) as string;
			const allowFailures = this.getNodeParameter('allowFailures', index) as boolean;
			const calls = JSON.parse(callsParam);

			const multicall = new ethers.Contract(multicallAddress, MULTICALL3_ABI, provider);
			
			const formattedCalls = calls.map((call: { target: string; callData: string }) => ({
				target: call.target,
				allowFailure: allowFailures,
				callData: call.callData,
			}));

			try {
				const results = await multicall.aggregate3.staticCall(formattedCalls);
				result = {
					multicallAddress,
					callCount: calls.length,
					results: results.map((r: { success: boolean; returnData: string }, i: number) => ({
						index: i,
						success: r.success,
						returnData: r.returnData,
					})),
				};
			} catch (error) {
				result = {
					multicallAddress,
					callCount: calls.length,
					error: (error as Error).message,
				};
			}
			break;
		}

		case 'batchWriteCalls': {
			const callsParam = this.getNodeParameter('calls', index) as string;
			const allowFailures = this.getNodeParameter('allowFailures', index) as boolean;
			const calls = JSON.parse(callsParam);

			if (!signer) throw new Error('Private key required for write operations');

			const multicall = new ethers.Contract(multicallAddress, MULTICALL3_ABI, signer);
			
			const formattedCalls = calls.map((call: { target: string; callData: string }) => ({
				target: call.target,
				allowFailure: allowFailures,
				callData: call.callData,
			}));

			const tx = await multicall.aggregate3(formattedCalls);
			const receipt = await tx.wait();

			result = {
				transactionHash: tx.hash,
				multicallAddress,
				callCount: calls.length,
				blockNumber: receipt?.blockNumber,
				status: receipt?.status,
				gasUsed: receipt?.gasUsed?.toString(),
			};
			break;
		}

		case 'executeMulticall': {
			const callsParam = this.getNodeParameter('calls', index) as string;
			const allowFailures = this.getNodeParameter('allowFailures', index) as boolean;
			const calls = JSON.parse(callsParam);

			// Determine if this is a read or write operation
			const hasValue = calls.some((call: { value?: string }) => call.value && BigInt(call.value) > 0n);
			
			if (hasValue || !signer) {
				// Read operation
				const multicall = new ethers.Contract(multicallAddress, MULTICALL3_ABI, provider);
				const formattedCalls = calls.map((call: { target: string; callData: string }) => ({
					target: call.target,
					allowFailure: allowFailures,
					callData: call.callData,
				}));

				const results = await multicall.aggregate3.staticCall(formattedCalls);
				result = {
					type: 'read',
					multicallAddress,
					results: results.map((r: { success: boolean; returnData: string }, i: number) => ({
						index: i,
						success: r.success,
						returnData: r.returnData,
					})),
				};
			} else {
				// Write operation
				const multicall = new ethers.Contract(multicallAddress, MULTICALL3_ABI, signer);
				const formattedCalls = calls.map((call: { target: string; callData: string }) => ({
					target: call.target,
					allowFailure: allowFailures,
					callData: call.callData,
				}));

				const tx = await multicall.aggregate3(formattedCalls);
				const receipt = await tx.wait();

				result = {
					type: 'write',
					transactionHash: tx.hash,
					multicallAddress,
					blockNumber: receipt?.blockNumber,
					status: receipt?.status,
				};
			}
			break;
		}

		case 'getMulticallResults': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await provider.getTransactionReceipt(transactionHash);

			if (!receipt) throw new Error('Transaction not found');

			result = {
				transactionHash,
				blockNumber: receipt.blockNumber,
				status: receipt.status,
				gasUsed: receipt.gasUsed.toString(),
				logsCount: receipt.logs.length,
				logs: receipt.logs.map(log => ({
					address: log.address,
					topics: log.topics,
					data: log.data,
				})),
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
