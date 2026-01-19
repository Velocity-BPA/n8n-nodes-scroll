/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';
import { ethers } from 'ethers';
import { isValidAddress, toChecksumAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['utility'] } },
		options: [
			{ name: 'Convert Units', value: 'convertUnits', description: 'Convert between ETH units', action: 'Convert units' },
			{ name: 'Decode ABI', value: 'decodeABI', description: 'Decode ABI-encoded data', action: 'Decode ABI' },
			{ name: 'Encode ABI', value: 'encodeABI', description: 'Encode data using ABI', action: 'Encode ABI' },
			{ name: 'Get Block Number', value: 'getBlockNumber', description: 'Get current block number', action: 'Get block number' },
			{ name: 'Get Chain ID', value: 'getChainID', description: 'Get the chain ID', action: 'Get chain ID' },
			{ name: 'Get Network Info', value: 'getNetworkInfo', description: 'Get network information', action: 'Get network info' },
			{ name: 'Get RPC Health', value: 'getRPCHealth', description: 'Check RPC endpoint health', action: 'Get RPC health' },
			{ name: 'Get Scroll SDK Version', value: 'getScrollSDKVersion', description: 'Get SDK version info', action: 'Get Scroll SDK version' },
			{ name: 'Test Connection', value: 'testConnection', description: 'Test RPC connection', action: 'Test connection' },
			{ name: 'Validate Address', value: 'validateAddress', description: 'Validate an Ethereum address', action: 'Validate address' },
		],
		default: 'getNetworkInfo',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['utility'], operation: ['validateAddress'] } },
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '0',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'ether',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'wei',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['utility'], operation: ['encodeABI', 'decodeABI'] } },
	},
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['encodeABI', 'decodeABI'] } },
	},
	{
		displayName: 'Arguments',
		name: 'arguments',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['utility'], operation: ['encodeABI'] } },
	},
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['decodeABI'] } },
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

	switch (operation) {
		case 'getChainID': {
			const network = await provider.getNetwork();
			result = {
				chainId: network.chainId.toString(),
				name: credentials.network,
			};
			break;
		}

		case 'getNetworkInfo': {
			const [network, blockNumber, feeData] = await Promise.all([
				provider.getNetwork(),
				provider.getBlockNumber(),
				provider.getFeeData(),
			]);

			result = {
				chainId: network.chainId.toString(),
				name: credentials.network,
				latestBlock: blockNumber,
				gasPrice: feeData.gasPrice?.toString(),
				gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				rpcUrl: credentials.rpcUrl || 'default',
			};
			break;
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const valid = isValidAddress(address);
			const isContract = valid ? (await provider.getCode(address)) !== '0x' : false;

			result = {
				address,
				isValid: valid,
				checksumAddress: valid ? toChecksumAddress(address) : null,
				isContract,
			};
			break;
		}

		case 'convertUnits': {
			const value = this.getNodeParameter('value', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as string;
			const toUnit = this.getNodeParameter('toUnit', index) as string;

			let valueInWei: bigint;
			
			if (fromUnit === 'wei') {
				valueInWei = BigInt(value);
			} else if (fromUnit === 'gwei') {
				valueInWei = ethers.parseUnits(value, 'gwei');
			} else {
				valueInWei = ethers.parseEther(value);
			}

			let converted: string;
			if (toUnit === 'wei') {
				converted = valueInWei.toString();
			} else if (toUnit === 'gwei') {
				converted = ethers.formatUnits(valueInWei, 'gwei');
			} else {
				converted = ethers.formatEther(valueInWei);
			}

			result = {
				original: value,
				fromUnit,
				toUnit,
				converted,
				weiValue: valueInWei.toString(),
			};
			break;
		}

		case 'encodeABI': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const args = JSON.parse(this.getNodeParameter('arguments', index) as string);

			const iface = new ethers.Interface(abi);
			const encodedData = iface.encodeFunctionData(functionName, args);

			result = {
				functionName,
				encodedData,
				selector: encodedData.slice(0, 10),
			};
			break;
		}

		case 'decodeABI': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const encodedData = this.getNodeParameter('encodedData', index) as string;

			const iface = new ethers.Interface(abi);
			
			try {
				const decoded = iface.decodeFunctionResult(functionName, encodedData);
				result = {
					functionName,
					decoded: decoded.map(d => d?.toString ? d.toString() : d),
				};
			} catch {
				// Try decoding as function data
				try {
					const parsed = iface.parseTransaction({ data: encodedData });
					result = {
						functionName: parsed?.name,
						args: parsed?.args ? Object.fromEntries(parsed.args.map((arg, i) => [i.toString(), arg?.toString ? arg.toString() : arg])) : {},
					};
				} catch {
					result = {
						error: 'Could not decode data with provided ABI',
					};
				}
			}
			break;
		}

		case 'getBlockNumber': {
			const blockNumber = await provider.getBlockNumber();
			result = { blockNumber };
			break;
		}

		case 'getRPCHealth': {
			const startTime = Date.now();
			try {
				const blockNumber = await provider.getBlockNumber();
				const latency = Date.now() - startTime;
				result = {
					status: 'healthy',
					latencyMs: latency,
					blockNumber,
					rpcUrl: credentials.rpcUrl || 'default',
				};
			} catch (error) {
				result = {
					status: 'unhealthy',
					error: (error as Error).message,
					rpcUrl: credentials.rpcUrl || 'default',
				};
			}
			break;
		}

		case 'testConnection': {
			try {
				const [network, blockNumber] = await Promise.all([
					provider.getNetwork(),
					provider.getBlockNumber(),
				]);
				result = {
					connected: true,
					chainId: network.chainId.toString(),
					blockNumber,
					network: credentials.network,
				};
			} catch (error) {
				result = {
					connected: false,
					error: (error as Error).message,
				};
			}
			break;
		}

		case 'getScrollSDKVersion': {
			result = {
				nodeVersion: '1.0.0',
				ethersVersion: '6.9.0',
				supportedNetworks: ['mainnet', 'sepolia'],
				features: [
					'Account Management',
					'Transactions',
					'Token Operations',
					'NFT Support',
					'Smart Contracts',
					'Bridge Operations',
					'Batch/Rollup Queries',
					'Gas Estimation',
					'DeFi Integration',
					'Session Keys',
					'Account Abstraction',
					'Multicall',
					'Canvas Integration',
					'Analytics',
					'Subgraph Queries',
				],
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
