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
import { ENTRYPOINT_ADDRESS } from '../../constants/contracts';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['accountAbstraction'] } },
		options: [
			{ name: 'Deploy Smart Account', value: 'deploySmartAccount', description: 'Deploy a new smart account', action: 'Deploy smart account' },
			{ name: 'Estimate UserOp Gas', value: 'estimateUserOpGas', description: 'Estimate gas for user operation', action: 'Estimate user op gas' },
			{ name: 'Execute User Operation', value: 'executeUserOperation', description: 'Execute a user operation', action: 'Execute user operation' },
			{ name: 'Get Entry Point', value: 'getEntryPoint', description: 'Get EntryPoint contract address', action: 'Get entry point' },
			{ name: 'Get Paymaster Info', value: 'getPaymasterInfo', description: 'Get paymaster information', action: 'Get paymaster info' },
			{ name: 'Get Smart Account', value: 'getSmartAccount', description: 'Get smart account details', action: 'Get smart account' },
			{ name: 'Get User Operation', value: 'getUserOperation', description: 'Get user operation by hash', action: 'Get user operation' },
			{ name: 'Get User Operation Receipt', value: 'getUserOperationReceipt', description: 'Get user operation receipt', action: 'Get user operation receipt' },
		],
		default: 'getSmartAccount',
	},
	{
		displayName: 'Smart Account Address',
		name: 'smartAccountAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['getSmartAccount', 'executeUserOperation'] } },
	},
	{
		displayName: 'User Operation Hash',
		name: 'userOpHash',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['getUserOperation', 'getUserOperationReceipt'] } },
	},
	{
		displayName: 'Account Factory',
		name: 'accountFactory',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['deploySmartAccount'] } },
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['deploySmartAccount'] } },
	},
	{
		displayName: 'Salt',
		name: 'salt',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['deploySmartAccount'] } },
	},
	{
		displayName: 'Target',
		name: 'target',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['executeUserOperation', 'estimateUserOpGas'] } },
	},
	{
		displayName: 'Value (ETH)',
		name: 'value',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['executeUserOperation', 'estimateUserOpGas'] } },
	},
	{
		displayName: 'Call Data',
		name: 'callData',
		type: 'string',
		default: '0x',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['executeUserOperation', 'estimateUserOpGas'] } },
	},
	{
		displayName: 'Paymaster Address',
		name: 'paymasterAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['accountAbstraction'], operation: ['getPaymasterInfo'] } },
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
	const network = credentials.network as string;
	let result: IDataObject;

	switch (operation) {
		case 'getSmartAccount': {
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;
			if (!isValidAddress(smartAccountAddress)) throw new Error('Invalid smart account address');

			const [balance, code, nonce] = await Promise.all([
				provider.getBalance(smartAccountAddress),
				provider.getCode(smartAccountAddress),
				provider.getTransactionCount(smartAccountAddress),
			]);

			result = {
				address: toChecksumAddress(smartAccountAddress),
				balance: ethers.formatEther(balance),
				balanceWei: balance.toString(),
				isDeployed: code !== '0x',
				codeSize: (code.length - 2) / 2,
				nonce,
			};
			break;
		}

		case 'deploySmartAccount': {
			const accountFactory = this.getNodeParameter('accountFactory', index) as string;
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const salt = this.getNodeParameter('salt', index) as number;

			result = {
				accountFactory: accountFactory ? toChecksumAddress(accountFactory) : null,
				ownerAddress: ownerAddress ? toChecksumAddress(ownerAddress) : null,
				salt,
				entryPoint: ENTRYPOINT_ADDRESS[network as keyof typeof ENTRYPOINT_ADDRESS] || ENTRYPOINT_ADDRESS.mainnet,
				message: 'Smart account deployment requires calling the account factory contract',
				note: 'Use a bundler service to submit the deployment UserOperation',
			};
			break;
		}

		case 'executeUserOperation': {
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;
			const target = this.getNodeParameter('target', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const callData = this.getNodeParameter('callData', index) as string;

			result = {
				smartAccountAddress: smartAccountAddress ? toChecksumAddress(smartAccountAddress) : null,
				target: target ? toChecksumAddress(target) : null,
				value: value.toString(),
				callData,
				entryPoint: ENTRYPOINT_ADDRESS[network as keyof typeof ENTRYPOINT_ADDRESS] || ENTRYPOINT_ADDRESS.mainnet,
				message: 'UserOperation execution requires a bundler service',
				note: 'Sign the UserOperation and submit to a bundler',
			};
			break;
		}

		case 'getUserOperation':
		case 'getUserOperationReceipt': {
			const userOpHash = this.getNodeParameter('userOpHash', index) as string;

			result = {
				userOpHash,
				message: 'UserOperation lookup requires querying a bundler service',
				note: 'Use eth_getUserOperationByHash or eth_getUserOperationReceipt RPC methods',
			};
			break;
		}

		case 'estimateUserOpGas': {
			const target = this.getNodeParameter('target', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const callData = this.getNodeParameter('callData', index) as string;

			const gasEstimate = await provider.estimateGas({
				to: target ? toChecksumAddress(target) : undefined,
				value: ethers.parseEther(value.toString()),
				data: callData,
			});

			result = {
				callGasLimit: gasEstimate.toString(),
				verificationGasLimit: '100000',
				preVerificationGas: '21000',
				message: 'Accurate gas estimates require a bundler service',
			};
			break;
		}

		case 'getPaymasterInfo': {
			const paymasterAddress = this.getNodeParameter('paymasterAddress', index) as string;

			if (paymasterAddress && isValidAddress(paymasterAddress)) {
				const code = await provider.getCode(paymasterAddress);
				result = {
					paymasterAddress: toChecksumAddress(paymasterAddress),
					isDeployed: code !== '0x',
					message: 'Paymaster details require querying the specific paymaster contract',
				};
			} else {
				result = {
					message: 'Provide a paymaster address to get details',
					note: 'Paymasters sponsor gas fees for user operations',
				};
			}
			break;
		}

		case 'getEntryPoint': {
			result = {
				entryPoint: ENTRYPOINT_ADDRESS[network as keyof typeof ENTRYPOINT_ADDRESS] || ENTRYPOINT_ADDRESS.mainnet,
				network,
				version: '0.6.0',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
