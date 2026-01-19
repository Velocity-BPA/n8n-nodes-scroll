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
		displayOptions: { show: { resource: ['sessionKeys'] } },
		options: [
			{ name: 'Create Session Key', value: 'createSessionKey', description: 'Create a new session key', action: 'Create session key' },
			{ name: 'Execute With Session', value: 'executeWithSession', description: 'Execute transaction with session key', action: 'Execute with session' },
			{ name: 'Get Session Key', value: 'getSessionKey', description: 'Get session key details', action: 'Get session key' },
			{ name: 'Get Session Permissions', value: 'getSessionPermissions', description: 'Get session key permissions', action: 'Get session permissions' },
			{ name: 'Get Session Transactions', value: 'getSessionTransactions', description: 'Get session key transactions', action: 'Get session transactions' },
			{ name: 'Revoke Session Key', value: 'revokeSessionKey', description: 'Revoke a session key', action: 'Revoke session key' },
		],
		default: 'createSessionKey',
	},
	{
		displayName: 'Session Key Address',
		name: 'sessionKeyAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['sessionKeys'], operation: ['getSessionKey', 'revokeSessionKey', 'getSessionPermissions', 'getSessionTransactions', 'executeWithSession'] } },
	},
	{
		displayName: 'Smart Account Address',
		name: 'smartAccountAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['sessionKeys'] } },
	},
	{
		displayName: 'Valid Until',
		name: 'validUntil',
		type: 'number',
		default: 0,
		description: 'Unix timestamp for session expiry (0 for no expiry)',
		displayOptions: { show: { resource: ['sessionKeys'], operation: ['createSessionKey'] } },
	},
	{
		displayName: 'Allowed Contracts',
		name: 'allowedContracts',
		type: 'string',
		default: '',
		placeholder: '0x..., 0x...',
		description: 'Comma-separated list of allowed contract addresses',
		displayOptions: { show: { resource: ['sessionKeys'], operation: ['createSessionKey'] } },
	},
	{
		displayName: 'Target Contract',
		name: 'targetContract',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['sessionKeys'], operation: ['executeWithSession'] } },
	},
	{
		displayName: 'Call Data',
		name: 'callData',
		type: 'string',
		default: '0x',
		displayOptions: { show: { resource: ['sessionKeys'], operation: ['executeWithSession'] } },
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

	const signer = scrollClient.getSigner();
	let result: IDataObject;

	switch (operation) {
		case 'createSessionKey': {
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;
			const validUntil = this.getNodeParameter('validUntil', index) as number;
			const allowedContracts = this.getNodeParameter('allowedContracts', index) as string;

			if (!signer) throw new Error('Private key required');

			// Generate a new session key
			const sessionWallet = ethers.Wallet.createRandom();
			const contracts = allowedContracts ? allowedContracts.split(',').map(c => c.trim()).filter(c => isValidAddress(c)) : [];

			result = {
				sessionKeyAddress: sessionWallet.address,
				sessionKeyPrivateKey: sessionWallet.privateKey,
				smartAccountAddress: smartAccountAddress ? toChecksumAddress(smartAccountAddress) : null,
				validUntil: validUntil || 'no expiry',
				allowedContracts: contracts.map(c => toChecksumAddress(c)),
				message: 'Session key generated. Register it with your smart account contract.',
				note: 'Store the private key securely - it will not be shown again',
			};
			break;
		}

		case 'getSessionKey': {
			const sessionKeyAddress = this.getNodeParameter('sessionKeyAddress', index) as string;
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;

			if (!isValidAddress(sessionKeyAddress)) throw new Error('Invalid session key address');

			result = {
				sessionKeyAddress: toChecksumAddress(sessionKeyAddress),
				smartAccountAddress: smartAccountAddress ? toChecksumAddress(smartAccountAddress) : null,
				message: 'Session key details require querying the smart account contract',
			};
			break;
		}

		case 'revokeSessionKey': {
			const sessionKeyAddress = this.getNodeParameter('sessionKeyAddress', index) as string;
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;

			if (!isValidAddress(sessionKeyAddress)) throw new Error('Invalid session key address');

			result = {
				sessionKeyAddress: toChecksumAddress(sessionKeyAddress),
				smartAccountAddress: smartAccountAddress ? toChecksumAddress(smartAccountAddress) : null,
				message: 'Revoking session key requires calling the smart account contract',
				note: 'Execute removeSessionKey() on your smart account',
			};
			break;
		}

		case 'getSessionPermissions': {
			const sessionKeyAddress = this.getNodeParameter('sessionKeyAddress', index) as string;
			const smartAccountAddress = this.getNodeParameter('smartAccountAddress', index) as string;

			result = {
				sessionKeyAddress: sessionKeyAddress ? toChecksumAddress(sessionKeyAddress) : null,
				smartAccountAddress: smartAccountAddress ? toChecksumAddress(smartAccountAddress) : null,
				message: 'Session permissions are stored in the smart account contract',
			};
			break;
		}

		case 'executeWithSession': {
			const sessionKeyAddress = this.getNodeParameter('sessionKeyAddress', index) as string;
			const targetContract = this.getNodeParameter('targetContract', index) as string;
			const callData = this.getNodeParameter('callData', index) as string;

			result = {
				sessionKeyAddress: sessionKeyAddress ? toChecksumAddress(sessionKeyAddress) : null,
				targetContract: targetContract ? toChecksumAddress(targetContract) : null,
				callData,
				message: 'Session key execution requires signing with the session key and submitting through the smart account',
			};
			break;
		}

		case 'getSessionTransactions': {
			const sessionKeyAddress = this.getNodeParameter('sessionKeyAddress', index) as string;

			result = {
				sessionKeyAddress: sessionKeyAddress ? toChecksumAddress(sessionKeyAddress) : null,
				message: 'Session transactions can be tracked through the smart account events',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
