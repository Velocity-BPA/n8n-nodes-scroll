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

const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['token'] } },
		options: [
			{ name: 'Approve Token', value: 'approveToken', description: 'Approve token spending', action: 'Approve token spending' },
			{ name: 'Get Token Allowance', value: 'getTokenAllowance', description: 'Get token allowance', action: 'Get token allowance' },
			{ name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get token balance for an address', action: 'Get token balance' },
			{ name: 'Get Token Holders', value: 'getTokenHolders', description: 'Get token holders', action: 'Get token holders' },
			{ name: 'Get Token Info', value: 'getTokenInfo', description: 'Get token metadata', action: 'Get token info' },
			{ name: 'Get Token Metadata', value: 'getTokenMetadata', description: 'Get detailed token metadata', action: 'Get token metadata' },
			{ name: 'Get Token Transfers', value: 'getTokenTransfers', description: 'Get token transfer history', action: 'Get token transfers' },
			{ name: 'Get Total Supply', value: 'getTotalSupply', description: 'Get token total supply', action: 'Get total supply' },
			{ name: 'Transfer From', value: 'transferFrom', description: 'Transfer tokens from another address', action: 'Transfer from' },
			{ name: 'Transfer Token', value: 'transferToken', description: 'Transfer tokens to an address', action: 'Transfer token' },
		],
		default: 'getTokenInfo',
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'] } },
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['getTokenBalance', 'getTokenTransfers'] } },
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['getTokenAllowance'] } },
	},
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['getTokenAllowance', 'approveToken'] } },
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['transferToken', 'transferFrom'] } },
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['transferFrom'] } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '0',
		required: true,
		displayOptions: { show: { resource: ['token'], operation: ['transferToken', 'approveToken', 'transferFrom'] } },
	},
	{
		displayName: 'Use Max Approval',
		name: 'useMaxApproval',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['token'], operation: ['approveToken'] } },
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
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

	if (!isValidAddress(tokenAddress)) throw new Error('Invalid token address');

	const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer || provider);
	let result: IDataObject;

	switch (operation) {
		case 'getTokenInfo': {
			const [name, symbol, decimals, totalSupply] = await Promise.all([
				tokenContract.name().catch(() => 'Unknown'),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
				tokenContract.decimals().catch(() => 18),
				tokenContract.totalSupply().catch(() => 0n),
			]);
			result = { tokenAddress: toChecksumAddress(tokenAddress), name, symbol, decimals, totalSupply: totalSupply.toString(), totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals) };
			break;
		}

		case 'getTokenBalance': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidAddress(address)) throw new Error('Invalid address');
			const [balance, decimals, symbol] = await Promise.all([tokenContract.balanceOf(address), tokenContract.decimals().catch(() => 18), tokenContract.symbol().catch(() => 'TOKEN')]);
			result = { tokenAddress: toChecksumAddress(tokenAddress), address: toChecksumAddress(address), balance: balance.toString(), balanceFormatted: ethers.formatUnits(balance, decimals), symbol, decimals };
			break;
		}

		case 'getTokenAllowance': {
			const owner = this.getNodeParameter('ownerAddress', index) as string;
			const spender = this.getNodeParameter('spenderAddress', index) as string;
			if (!isValidAddress(owner) || !isValidAddress(spender)) throw new Error('Invalid address');
			const [allowance, decimals] = await Promise.all([tokenContract.allowance(owner, spender), tokenContract.decimals().catch(() => 18)]);
			result = { tokenAddress: toChecksumAddress(tokenAddress), owner: toChecksumAddress(owner), spender: toChecksumAddress(spender), allowance: allowance.toString(), allowanceFormatted: ethers.formatUnits(allowance, decimals) };
			break;
		}

		case 'transferToken': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			if (!isValidAddress(to)) throw new Error('Invalid destination address');
			if (!signer) throw new Error('Private key required');
			const decimals = await tokenContract.decimals().catch(() => 18);
			const amountWei = ethers.parseUnits(amount, decimals);
			const tx = await tokenContract.transfer(toChecksumAddress(to), amountWei);
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, from: await signer.getAddress(), to: toChecksumAddress(to), amount, amountWei: amountWei.toString(), blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'approveToken': {
			const spender = this.getNodeParameter('spenderAddress', index) as string;
			const useMax = this.getNodeParameter('useMaxApproval', index) as boolean;
			const amount = this.getNodeParameter('amount', index) as string;
			if (!isValidAddress(spender)) throw new Error('Invalid spender address');
			if (!signer) throw new Error('Private key required');
			const decimals = await tokenContract.decimals().catch(() => 18);
			const amountWei = useMax ? ethers.MaxUint256 : ethers.parseUnits(amount, decimals);
			const tx = await tokenContract.approve(toChecksumAddress(spender), amountWei);
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, owner: await signer.getAddress(), spender: toChecksumAddress(spender), amount: useMax ? 'MAX' : amount, blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'transferFrom': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const to = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			if (!isValidAddress(from) || !isValidAddress(to)) throw new Error('Invalid address');
			if (!signer) throw new Error('Private key required');
			const decimals = await tokenContract.decimals().catch(() => 18);
			const amountWei = ethers.parseUnits(amount, decimals);
			const tx = await tokenContract.transferFrom(toChecksumAddress(from), toChecksumAddress(to), amountWei);
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, from: toChecksumAddress(from), to: toChecksumAddress(to), amount, amountWei: amountWei.toString(), blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'getTotalSupply': {
			const [totalSupply, decimals, symbol] = await Promise.all([tokenContract.totalSupply(), tokenContract.decimals().catch(() => 18), tokenContract.symbol().catch(() => 'TOKEN')]);
			result = { tokenAddress: toChecksumAddress(tokenAddress), totalSupply: totalSupply.toString(), totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals), symbol, decimals };
			break;
		}

		case 'getTokenMetadata': {
			const [name, symbol, decimals, totalSupply] = await Promise.all([tokenContract.name().catch(() => 'Unknown'), tokenContract.symbol().catch(() => 'UNKNOWN'), tokenContract.decimals().catch(() => 18), tokenContract.totalSupply().catch(() => 0n)]);
			const code = await provider.getCode(tokenAddress);
			result = { tokenAddress: toChecksumAddress(tokenAddress), name, symbol, decimals, totalSupply: totalSupply.toString(), totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals), isContract: code !== '0x', codeSize: (code.length - 2) / 2 };
			break;
		}

		case 'getTokenHolders':
		case 'getTokenTransfers': {
			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const address = operation === 'getTokenTransfers' ? this.getNodeParameter('address', index) as string : undefined;
				const action = operation === 'getTokenHolders' ? 'tokenholderlist' : 'tokentx';
				const url = address ? `${baseUrl}?module=account&action=${action}&contractaddress=${tokenAddress}&address=${address}&apikey=${apiCredentials.scrollscanApiKey}` : `${baseUrl}?module=token&action=${action}&contractaddress=${tokenAddress}&apikey=${apiCredentials.scrollscanApiKey}`;
				const response = await this.helpers.request({ method: 'GET', url });
				const data = JSON.parse(response as string);
				result = { tokenAddress: toChecksumAddress(tokenAddress), [operation === 'getTokenHolders' ? 'holders' : 'transfers']: data.result || [], status: data.status, message: data.message };
			} else {
				result = { tokenAddress: toChecksumAddress(tokenAddress), message: 'Scrollscan API key required for this operation' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
