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

const ERC721_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function ownerOf(uint256 tokenId) view returns (address)',
	'function balanceOf(address owner) view returns (uint256)',
	'function getApproved(uint256 tokenId) view returns (address)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'function approve(address to, uint256 tokenId)',
	'function setApprovalForAll(address operator, bool approved)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId)',
	'function totalSupply() view returns (uint256)',
];

const ERC1155_ABI = [
	'function uri(uint256 id) view returns (string)',
	'function balanceOf(address account, uint256 id) view returns (uint256)',
	'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
	'function isApprovedForAll(address account, address operator) view returns (bool)',
	'function setApprovalForAll(address operator, bool approved)',
	'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
];

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nft'] } },
		options: [
			{ name: 'Approve NFT', value: 'approveNFT', description: 'Approve NFT transfer', action: 'Approve NFT' },
			{ name: 'Get Collection Stats', value: 'getCollectionStats', description: 'Get NFT collection statistics', action: 'Get collection stats' },
			{ name: 'Get NFT', value: 'getNFT', description: 'Get NFT details', action: 'Get NFT' },
			{ name: 'Get NFT Collection', value: 'getNFTCollection', description: 'Get NFT collection info', action: 'Get NFT collection' },
			{ name: 'Get NFT Metadata', value: 'getNFTMetadata', description: 'Get NFT metadata from URI', action: 'Get NFT metadata' },
			{ name: 'Get NFT Transfers', value: 'getNFTTransfers', description: 'Get NFT transfer history', action: 'Get NFT transfers' },
			{ name: 'Get NFTs By Owner', value: 'getNFTsByOwner', description: 'Get NFTs owned by an address', action: 'Get NFTs by owner' },
			{ name: 'Transfer NFT', value: 'transferNFT', description: 'Transfer an NFT', action: 'Transfer NFT' },
		],
		default: 'getNFT',
	},
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['nft'] } },
	},
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['nft'], operation: ['getNFT', 'getNFTMetadata', 'transferNFT', 'approveNFT'] } },
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['nft'], operation: ['getNFTsByOwner'] } },
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['nft'], operation: ['transferNFT', 'approveNFT'] } },
	},
	{
		displayName: 'NFT Standard',
		name: 'nftStandard',
		type: 'options',
		options: [
			{ name: 'ERC-721', value: 'erc721' },
			{ name: 'ERC-1155', value: 'erc1155' },
		],
		default: 'erc721',
		displayOptions: { show: { resource: ['nft'], operation: ['getNFT', 'transferNFT', 'getNFTMetadata'] } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 1,
		displayOptions: { show: { resource: ['nft'], operation: ['transferNFT'], nftStandard: ['erc1155'] } },
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
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;

	if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

	let result: IDataObject;

	switch (operation) {
		case 'getNFT': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const standard = this.getNodeParameter('nftStandard', index) as string;

			if (standard === 'erc721') {
				const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
				const [owner, tokenURI, name, symbol] = await Promise.all([
					contract.ownerOf(tokenId).catch(() => null),
					contract.tokenURI(tokenId).catch(() => null),
					contract.name().catch(() => 'Unknown'),
					contract.symbol().catch(() => 'NFT'),
				]);
				result = { contractAddress: toChecksumAddress(contractAddress), tokenId, standard: 'ERC-721', owner, tokenURI, name, symbol };
			} else {
				const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
				const uri = await contract.uri(tokenId).catch(() => null);
				result = { contractAddress: toChecksumAddress(contractAddress), tokenId, standard: 'ERC-1155', uri };
			}
			break;
		}

		case 'getNFTMetadata': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const standard = this.getNodeParameter('nftStandard', index) as string;
			const contract = new ethers.Contract(contractAddress, standard === 'erc721' ? ERC721_ABI : ERC1155_ABI, provider);
			const uri = standard === 'erc721' ? await contract.tokenURI(tokenId).catch(() => null) : await contract.uri(tokenId).catch(() => null);

			let metadata = null;
			if (uri) {
				try {
					let fetchUri = uri;
					if (uri.startsWith('ipfs://')) fetchUri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
					if (uri.startsWith('data:application/json')) {
						const base64Data = uri.split(',')[1];
						metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString());
					} else {
						const response = await this.helpers.request({ method: 'GET', url: fetchUri });
						metadata = JSON.parse(response as string);
					}
				} catch { /* ignore */ }
			}
			result = { contractAddress: toChecksumAddress(contractAddress), tokenId, uri, metadata };
			break;
		}

		case 'getNFTsByOwner': {
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			if (!isValidAddress(ownerAddress)) throw new Error('Invalid owner address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=tokennfttx&address=${ownerAddress}&contractaddress=${contractAddress}&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { ownerAddress: toChecksumAddress(ownerAddress), contractAddress: toChecksumAddress(contractAddress), transfers: data.result || [] };
			} else {
				const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
				const balance = await contract.balanceOf(ownerAddress).catch(() => 0n);
				result = { ownerAddress: toChecksumAddress(ownerAddress), contractAddress: toChecksumAddress(contractAddress), balance: balance.toString(), message: 'Use Scrollscan API for detailed holdings' };
			}
			break;
		}

		case 'getNFTCollection': {
			const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
			const [name, symbol, totalSupply] = await Promise.all([
				contract.name().catch(() => 'Unknown'),
				contract.symbol().catch(() => 'NFT'),
				contract.totalSupply().catch(() => null),
			]);
			result = { contractAddress: toChecksumAddress(contractAddress), name, symbol, totalSupply: totalSupply?.toString() };
			break;
		}

		case 'transferNFT': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const standard = this.getNodeParameter('nftStandard', index) as string;

			if (!isValidAddress(toAddress)) throw new Error('Invalid destination address');
			if (!signer) throw new Error('Private key required');

			const from = await signer.getAddress();

			if (standard === 'erc721') {
				const contract = new ethers.Contract(contractAddress, ERC721_ABI, signer);
				const tx = await contract.safeTransferFrom(from, toChecksumAddress(toAddress), tokenId);
				const receipt = await tx.wait();
				result = { transactionHash: tx.hash, from, to: toChecksumAddress(toAddress), tokenId, standard: 'ERC-721', blockNumber: receipt?.blockNumber, status: receipt?.status };
			} else {
				const amount = this.getNodeParameter('amount', index) as number;
				const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
				const tx = await contract.safeTransferFrom(from, toChecksumAddress(toAddress), tokenId, amount, '0x');
				const receipt = await tx.wait();
				result = { transactionHash: tx.hash, from, to: toChecksumAddress(toAddress), tokenId, amount, standard: 'ERC-1155', blockNumber: receipt?.blockNumber, status: receipt?.status };
			}
			break;
		}

		case 'approveNFT': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;

			if (!isValidAddress(toAddress)) throw new Error('Invalid address');
			if (!signer) throw new Error('Private key required');

			const contract = new ethers.Contract(contractAddress, ERC721_ABI, signer);
			const tx = await contract.approve(toChecksumAddress(toAddress), tokenId);
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, contractAddress: toChecksumAddress(contractAddress), tokenId, approved: toChecksumAddress(toAddress), blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'getNFTTransfers': {
			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=account&action=tokennfttx&contractaddress=${contractAddress}&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { contractAddress: toChecksumAddress(contractAddress), transfers: data.result || [], status: data.status };
			} else {
				result = { contractAddress: toChecksumAddress(contractAddress), message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'getCollectionStats': {
			const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
			const [name, symbol, totalSupply] = await Promise.all([
				contract.name().catch(() => 'Unknown'),
				contract.symbol().catch(() => 'NFT'),
				contract.totalSupply().catch(() => null),
			]);
			result = { contractAddress: toChecksumAddress(contractAddress), name, symbol, totalSupply: totalSupply?.toString() };
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
