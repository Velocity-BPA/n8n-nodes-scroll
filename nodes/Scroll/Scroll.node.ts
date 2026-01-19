/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as account from './actions/account';
import * as transaction from './actions/transaction';
import * as token from './actions/token';
import * as nft from './actions/nft';
import * as contract from './actions/contract';
import * as block from './actions/block';
import * as event from './actions/event';
import * as bridge from './actions/bridge';
import * as batch from './actions/batch';
import * as rollup from './actions/rollup';
import * as gas from './actions/gas';
import * as defi from './actions/defi';
import * as sessionKeys from './actions/sessionKeys';
import * as accountAbstraction from './actions/accountAbstraction';
import * as multicall from './actions/multicall';
import * as canvas from './actions/canvas';
import * as analytics from './actions/analytics';
import * as subgraph from './actions/subgraph';
import * as utility from './actions/utility';

/**
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

export class Scroll implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Scroll',
		name: 'scroll',
		icon: 'file:scroll.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Scroll zkEVM L2 blockchain - accounts, transactions, tokens, NFTs, contracts, bridge, batches, and more',
		defaults: {
			name: 'Scroll',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'scrollNetwork',
				required: true,
			},
			{
				name: 'scrollApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
						description: 'Account operations - balances, transactions, holdings',
					},
					{
						name: 'Account Abstraction',
						value: 'accountAbstraction',
						description: 'ERC-4337 smart accounts and user operations',
					},
					{
						name: 'Analytics',
						value: 'analytics',
						description: 'Network statistics and metrics',
					},
					{
						name: 'Batch',
						value: 'batch',
						description: 'ZK batch operations - proofs, status, verification',
					},
					{
						name: 'Block',
						value: 'block',
						description: 'Block operations - queries, transactions, finality',
					},
					{
						name: 'Bridge',
						value: 'bridge',
						description: 'L1↔L2 bridge operations - deposits, withdrawals, claims',
					},
					{
						name: 'Canvas',
						value: 'canvas',
						description: 'Scroll Canvas - profiles, badges, attestations',
					},
					{
						name: 'Contract',
						value: 'contract',
						description: 'Smart contract operations - deploy, call, execute',
					},
					{
						name: 'DeFi',
						value: 'defi',
						description: 'DeFi operations - swaps, liquidity, yields',
					},
					{
						name: 'Event',
						value: 'event',
						description: 'Event operations - logs, filters, subscriptions',
					},
					{
						name: 'Gas',
						value: 'gas',
						description: 'Gas operations - prices, estimates, L1 data fees',
					},
					{
						name: 'Multicall',
						value: 'multicall',
						description: 'Batch multiple contract calls in one transaction',
					},
					{
						name: 'NFT',
						value: 'nft',
						description: 'NFT operations - ERC-721/1155, transfers, metadata',
					},
					{
						name: 'Rollup',
						value: 'rollup',
						description: 'Rollup state and information',
					},
					{
						name: 'Session Keys',
						value: 'sessionKeys',
						description: 'ERC-4337 session key management',
					},
					{
						name: 'Subgraph',
						value: 'subgraph',
						description: 'Query Scroll subgraphs via GraphQL',
					},
					{
						name: 'Token',
						value: 'token',
						description: 'ERC-20 token operations - transfers, approvals',
					},
					{
						name: 'Transaction',
						value: 'transaction',
						description: 'Transaction operations - send, sign, track',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility operations - validation, encoding, conversion',
					},
				],
				default: 'account',
			},
			// Account operations
			...account.description,
			// Transaction operations
			...transaction.description,
			// Token operations
			...token.description,
			// NFT operations
			...nft.description,
			// Contract operations
			...contract.description,
			// Block operations
			...block.description,
			// Event operations
			...event.description,
			// Bridge operations
			...bridge.description,
			// Batch operations
			...batch.description,
			// Rollup operations
			...rollup.description,
			// Gas operations
			...gas.description,
			// DeFi operations
			...defi.description,
			// Session Keys operations
			...sessionKeys.description,
			// Account Abstraction operations
			...accountAbstraction.description,
			// Multicall operations
			...multicall.description,
			// Canvas operations
			...canvas.description,
			// Analytics operations
			...analytics.description,
			// Subgraph operations
			...subgraph.description,
			// Utility operations
			...utility.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Log licensing notice once per execution
		console.warn(
			'[Velocity BPA Licensing Notice] This n8n node is licensed under BSL 1.1. ' +
			'Commercial use requires a license from Velocity BPA. ' +
			'Visit https://velobpa.com/licensing for details.'
		);

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[];

				switch (resource) {
					case 'account':
						result = await account.execute.call(this, i, operation);
						break;
					case 'transaction':
						result = await transaction.execute.call(this, i, operation);
						break;
					case 'token':
						result = await token.execute.call(this, i, operation);
						break;
					case 'nft':
						result = await nft.execute.call(this, i, operation);
						break;
					case 'contract':
						result = await contract.execute.call(this, i, operation);
						break;
					case 'block':
						result = await block.execute.call(this, i, operation);
						break;
					case 'event':
						result = await event.execute.call(this, i, operation);
						break;
					case 'bridge':
						result = await bridge.execute.call(this, i, operation);
						break;
					case 'batch':
						result = await batch.execute.call(this, i, operation);
						break;
					case 'rollup':
						result = await rollup.execute.call(this, i, operation);
						break;
					case 'gas':
						result = await gas.execute.call(this, i, operation);
						break;
					case 'defi':
						result = await defi.execute.call(this, i, operation);
						break;
					case 'sessionKeys':
						result = await sessionKeys.execute.call(this, i, operation);
						break;
					case 'accountAbstraction':
						result = await accountAbstraction.execute.call(this, i, operation);
						break;
					case 'multicall':
						result = await multicall.execute.call(this, i, operation);
						break;
					case 'canvas':
						result = await canvas.execute.call(this, i, operation);
						break;
					case 'analytics':
						result = await analytics.execute.call(this, i, operation);
						break;
					case 'subgraph':
						result = await subgraph.execute.call(this, i, operation);
						break;
					case 'utility':
						result = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
