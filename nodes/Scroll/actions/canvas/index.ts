/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';
import { ethers } from 'ethers';
import { isValidAddress, toChecksumAddress } from '../../utils/addressUtils';
import { MAINNET_CANVAS, SEPOLIA_CANVAS, CANVAS_ABIS } from '../../constants/canvas';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['canvas'] } },
		options: [
			{ name: 'Get Badge', value: 'getBadge', action: 'Get badge' },
			{ name: 'Get Badges', value: 'getBadges', action: 'Get badges' },
			{ name: 'Get Canvas Stats', value: 'getCanvasStats', action: 'Get canvas stats' },
			{ name: 'Get Profile', value: 'getProfile', action: 'Get profile' },
		],
		default: 'getProfile',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['canvas'], operation: ['getProfile', 'getBadges'] } },
	},
	{
		displayName: 'Badge ID',
		name: 'badgeId',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['canvas'], operation: ['getBadge'] } },
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
	const canvasConfig = network === 'mainnet' ? MAINNET_CANVAS : SEPOLIA_CANVAS;
	let result: IDataObject;

	switch (operation) {
		case 'getProfile': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidAddress(address)) throw new Error('Invalid address');
			const profileContract = new ethers.Contract(canvasConfig.profileContract, CANVAS_ABIS.Profile, provider);
			try {
				const hasProfile = await profileContract.hasProfile(address);
				if (hasProfile) {
					const profile = await profileContract.getProfile(address);
					result = { address: toChecksumAddress(address), hasProfile: true, username: profile.username, avatar: profile.avatar, bio: profile.bio, createdAt: profile.createdAt?.toString() };
				} else {
					result = { address: toChecksumAddress(address), hasProfile: false };
				}
			} catch {
				result = { address: toChecksumAddress(address), hasProfile: false, message: 'Could not fetch profile' };
			}
			break;
		}
		case 'getBadges': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidAddress(address)) throw new Error('Invalid address');
			const badgeContract = new ethers.Contract(canvasConfig.badgeContract, CANVAS_ABIS.Badge, provider);
			try {
				const balance = await badgeContract.balanceOf(address);
				result = { address: toChecksumAddress(address), badgeCount: balance.toString() };
			} catch {
				result = { address: toChecksumAddress(address), badgeCount: '0', message: 'Could not fetch badges' };
			}
			break;
		}
		case 'getBadge': {
			const badgeId = this.getNodeParameter('badgeId', index) as string;
			const badgeContract = new ethers.Contract(canvasConfig.badgeContract, CANVAS_ABIS.Badge, provider);
			try {
				const [tokenURI, badgeInfo] = await Promise.all([
					badgeContract.tokenURI(badgeId).catch(() => null),
					badgeContract.getBadgeInfo(badgeId).catch(() => null),
				]);
				result = { badgeId, tokenURI, badgeInfo: badgeInfo ? { name: badgeInfo.name, description: badgeInfo.description, imageUrl: badgeInfo.imageUrl } : null };
			} catch {
				result = { badgeId, message: 'Could not fetch badge' };
			}
			break;
		}
		case 'getCanvasStats': {
			result = { profileContract: canvasConfig.profileContract, badgeContract: canvasConfig.badgeContract, attestationContract: canvasConfig.attestationContract, apiEndpoint: canvasConfig.apiEndpoint, network };
			break;
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
