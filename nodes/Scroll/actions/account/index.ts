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
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for a transaction', action: 'Estimate gas' },
			{ name: 'Get Account Info', value: 'getAccountInfo', description: 'Get comprehensive account information', action: 'Get account info' },
			{ name: 'Get Balance', value: 'getBalance', description: 'Get ETH balance of an address', action: 'Get ETH balance' },
			{ name: 'Get Internal Transactions', value: 'getInternalTransactions', description: 'Get internal transactions', action: 'Get internal transactions' },
			{ name: 'Get NFT Holdings', value: 'getNFTHoldings', description: 'Get NFT holdings for an address', action: 'Get NFT holdings' },
			{ name: 'Get Token Balances', value: 'getTokenBalances', description: 'Get ERC-20 token balances', action: 'Get token balances' },
			{ name: 'Get Token Transfers', value: 'getTokenTransfers', description: 'Get token transfer history', action: 'Get token transfers' },
			{ name: 'Get Transaction Count', value: 'getTransactionCount', description: 'Get nonce/transaction count', action: 'Get transaction count' },
			{ name: 'Get Transaction History', value: 'getTransactionHistory', description: 'Get transaction history', action: 'Get transaction history' },
		],
		default: 'getBalance',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['account'], operation: ['getBalance', 'getTokenBalances', 'getTransactionCount', 'getTransactionHistory', 'getInternalTransactions', 'getTokenTransfers', 'getNFTHoldings', 'getAccountInfo'] } },
	},
	{
		displayName: 'Token Addresses',
		name: 'tokenAddresses',
		type: 'string',
		default: '',
		placeholder: '0x..., 0x...',
		description: 'Comma-separated list of token addresses',
		displayOptions: { show: { resource: ['account'], operation: ['getTokenBalances'] } },
	},
	{
		displayName: 'Block',
		name: 'blockTag',
		type: 'options',
		options: [
			{ name: 'Latest', value: 'latest' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Finalized', value: 'finalized' },
			{ name: 'Safe', value: 'safe' },
			{ name: 'Specific Block', value: 'specific' },
		],
		default: 'latest',
		displayOptions: { show: { resource: ['account'], operation: ['getBalance', 'getTransactionCount'] } },
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['account'], operation: ['getBalance', 'getTransactionCount'], blockTag: ['specific'] } },
	},
	{
		displayName: 'Start Block',
		name: 'startBlock',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['account'], operation: ['getTransactionHistory', 'getInternalTransactions', 'getTokenTransfers'] } },
	},
	{
		displayName: 'End Block',
		name: 'endBlock',
		type: 'number',
		default: 99999999,
		displayOptions: { show: { resource: ['account'], operation: ['getTransactionHistory', 'getInternalTransactions', 'getTokenTransfers'] } },
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['account'], operation: ['estimateGas'] } },
	},
	{
		displayName: 'Value (ETH)',
		name: 'value',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['account'], operation: ['estimateGas'] } },
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '0x',
		displayOptions: { show: { resource: ['account'], operation: ['estimateGas'] } },
	},
];

const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function balanceOf(address) view returns (uint256)',
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
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const blockTag = this.getNodeParameter('blockTag', index) as string;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			let block: string | number = blockTag;
			if (blockTag === 'specific') {
				block = this.getNodeParameter('blockNumber', index) as number;
			}

			const balance = await provider.getBalance(toChecksumAddress(address), block);
			result = {
				address: toChecksumAddress(address),
				balance: ethers.formatEther(balance),
				balanceWei: balance.toString(),
				blockTag: block,
			};
			break;
		}

		case 'getTokenBalances': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenAddressesStr = this.getNodeParameter('tokenAddresses', index) as string;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const tokenAddresses = tokenAddressesStr.trim() 
				? tokenAddressesStr.split(',').map((a) => a.trim()).filter(isValidAddress)
				: [];

			const balances: Array<Record<string, unknown>> = [];
			for (const tokenAddress of tokenAddresses) {
				try {
					const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
					const [balance, decimals, symbol, name] = await Promise.all([
						erc20.balanceOf(address),
						erc20.decimals().catch(() => 18),
						erc20.symbol().catch(() => 'UNKNOWN'),
						erc20.name().catch(() => 'Unknown Token'),
					]);
					balances.push({
						tokenAddress: toChecksumAddress(tokenAddress),
						name,
						symbol,
						decimals,
						balance: balance.toString(),
						balanceFormatted: ethers.formatUnits(balance, decimals),
					});
				} catch { /* skip invalid tokens */ }
			}

			result = { address: toChecksumAddress(address), balances };
			break;
		}

		case 'getTransactionCount': {
			const address = this.getNodeParameter('address', index) as string;
			const blockTag = this.getNodeParameter('blockTag', index) as string;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			let block: string | number = blockTag;
			if (blockTag === 'specific') {
				block = this.getNodeParameter('blockNumber', index) as number;
			}

			const nonce = await provider.getTransactionCount(toChecksumAddress(address), block);
			result = { address: toChecksumAddress(address), nonce, transactionCount: nonce, blockTag: block };
			break;
		}

		case 'getTransactionHistory': {
			const address = this.getNodeParameter('address', index) as string;
			const startBlock = this.getNodeParameter('startBlock', index) as number;
			const endBlock = this.getNodeParameter('endBlock', index) as number;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { address: toChecksumAddress(address), transactions: data.result || [], status: data.status };
			} else {
				result = { address: toChecksumAddress(address), transactions: [], message: 'Scrollscan API key required for transaction history' };
			}
			break;
		}

		case 'getInternalTransactions': {
			const address = this.getNodeParameter('address', index) as string;
			const startBlock = this.getNodeParameter('startBlock', index) as number;
			const endBlock = this.getNodeParameter('endBlock', index) as number;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=txlistinternal&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { address: toChecksumAddress(address), internalTransactions: data.result || [], status: data.status };
			} else {
				result = { address: toChecksumAddress(address), internalTransactions: [], message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'getTokenTransfers': {
			const address = this.getNodeParameter('address', index) as string;
			const startBlock = this.getNodeParameter('startBlock', index) as number;
			const endBlock = this.getNodeParameter('endBlock', index) as number;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { address: toChecksumAddress(address), tokenTransfers: data.result || [], status: data.status };
			} else {
				result = { address: toChecksumAddress(address), tokenTransfers: [], message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'getNFTHoldings': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const erc721Response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=tokennfttx&address=${address}&sort=desc&apikey=${apiCredentials.scrollscanApiKey}` });
				const erc721Data = JSON.parse(erc721Response as string);
				result = { address: toChecksumAddress(address), erc721Transfers: erc721Data.result || [] };
			} else {
				result = { address: toChecksumAddress(address), nftHoldings: [], message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'getAccountInfo': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) throw new Error('Invalid Ethereum address');

			const [balance, nonce, code] = await Promise.all([
				provider.getBalance(address),
				provider.getTransactionCount(address),
				provider.getCode(address),
			]);

			const isContract = code !== '0x';
			result = {
				address: toChecksumAddress(address),
				balance: ethers.formatEther(balance),
				balanceWei: balance.toString(),
				nonce,
				transactionCount: nonce,
				isContract,
				codeSize: isContract ? (code.length - 2) / 2 : 0,
			};
			break;
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;

			if (!isValidAddress(toAddress)) throw new Error('Invalid destination address');

			const tx = { to: toChecksumAddress(toAddress), value: ethers.parseEther(value.toString()), data: data || '0x' };
			const gasEstimate = await provider.estimateGas(tx);
			const feeData = await provider.getFeeData();

			result = {
				gasEstimate: gasEstimate.toString(),
				gasPrice: feeData.gasPrice?.toString(),
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				estimatedCostWei: feeData.gasPrice ? (gasEstimate * feeData.gasPrice).toString() : null,
				estimatedCostEth: feeData.gasPrice ? ethers.formatEther(gasEstimate * feeData.gasPrice) : null,
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
