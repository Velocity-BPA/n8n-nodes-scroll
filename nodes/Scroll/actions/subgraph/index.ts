/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['subgraph'] } },
		options: [
			{ name: 'Custom GraphQL Query', value: 'customGraphQLQuery', description: 'Execute custom GraphQL query', action: 'Custom Graph QL query' },
			{ name: 'Get Indexed Data', value: 'getIndexedData', description: 'Get indexed blockchain data', action: 'Get indexed data' },
			{ name: 'Get Subgraph Status', value: 'getSubgraphStatus', description: 'Get subgraph indexing status', action: 'Get subgraph status' },
			{ name: 'Query Subgraph', value: 'querySubgraph', description: 'Query a Scroll subgraph', action: 'Query subgraph' },
		],
		default: 'querySubgraph',
	},
	{
		displayName: 'Subgraph URL',
		name: 'subgraphUrl',
		type: 'string',
		default: '',
		placeholder: 'https://api.studio.thegraph.com/query/...',
		displayOptions: { show: { resource: ['subgraph'] } },
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: { rows: 10 },
		default: '{\n  \n}',
		displayOptions: { show: { resource: ['subgraph'], operation: ['querySubgraph', 'customGraphQLQuery'] } },
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'json',
		default: '{}',
		displayOptions: { show: { resource: ['subgraph'], operation: ['querySubgraph', 'customGraphQLQuery'] } },
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		options: [
			{ name: 'Transactions', value: 'transactions' },
			{ name: 'Transfers', value: 'transfers' },
			{ name: 'Swaps', value: 'swaps' },
			{ name: 'Liquidity Positions', value: 'positions' },
			{ name: 'Tokens', value: 'tokens' },
			{ name: 'Pools', value: 'pools' },
		],
		default: 'transactions',
		displayOptions: { show: { resource: ['subgraph'], operation: ['getIndexedData'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		displayOptions: { show: { resource: ['subgraph'], operation: ['getIndexedData'] } },
	},
	{
		displayName: 'Order By',
		name: 'orderBy',
		type: 'string',
		default: 'timestamp',
		displayOptions: { show: { resource: ['subgraph'], operation: ['getIndexedData'] } },
	},
	{
		displayName: 'Order Direction',
		name: 'orderDirection',
		type: 'options',
		options: [
			{ name: 'Ascending', value: 'asc' },
			{ name: 'Descending', value: 'desc' },
		],
		default: 'desc',
		displayOptions: { show: { resource: ['subgraph'], operation: ['getIndexedData'] } },
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
	
	let subgraphUrl = this.getNodeParameter('subgraphUrl', index, '') as string;
	
	// Use API credentials if no URL provided
	if (!subgraphUrl && apiCredentials?.subgraphUrl) {
		subgraphUrl = apiCredentials.subgraphUrl as string;
	}

	let result: IDataObject;

	switch (operation) {
		case 'querySubgraph':
		case 'customGraphQLQuery': {
			const query = this.getNodeParameter('query', index) as string;
			const variablesParam = this.getNodeParameter('variables', index) as string;
			const variables = JSON.parse(variablesParam);

			if (!subgraphUrl) {
				throw new Error('Subgraph URL required. Provide it in the node or in ScrollApi credentials.');
			}

			try {
				const response = await this.helpers.request({
					method: 'POST',
					url: subgraphUrl,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query, variables }),
				});

				const data = JSON.parse(response as string);
				result = {
					subgraphUrl,
					data: data.data,
					errors: data.errors,
				};
			} catch (error) {
				result = {
					subgraphUrl,
					error: (error as Error).message,
				};
			}
			break;
		}

		case 'getIndexedData': {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const limit = this.getNodeParameter('limit', index) as number;
			const orderBy = this.getNodeParameter('orderBy', index) as string;
			const orderDirection = this.getNodeParameter('orderDirection', index) as string;

			if (!subgraphUrl) {
				throw new Error('Subgraph URL required. Provide it in the node or in ScrollApi credentials.');
			}

			// Build query based on entity type
			const query = `{
				${entityType}(
					first: ${limit},
					orderBy: ${orderBy},
					orderDirection: ${orderDirection}
				) {
					id
					${entityType === 'transactions' ? 'hash from to value blockNumber timestamp' : ''}
					${entityType === 'transfers' ? 'from to value token { symbol } blockNumber timestamp' : ''}
					${entityType === 'swaps' ? 'sender recipient amount0In amount0Out amount1In amount1Out timestamp' : ''}
					${entityType === 'positions' ? 'owner pool { token0 { symbol } token1 { symbol } } liquidity' : ''}
					${entityType === 'tokens' ? 'symbol name decimals totalSupply' : ''}
					${entityType === 'pools' ? 'token0 { symbol } token1 { symbol } liquidity volumeUSD' : ''}
				}
			}`;

			try {
				const response = await this.helpers.request({
					method: 'POST',
					url: subgraphUrl,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query }),
				});

				const data = JSON.parse(response as string);
				result = {
					entityType,
					limit,
					orderBy,
					orderDirection,
					data: data.data?.[entityType] || [],
					errors: data.errors,
				};
			} catch (error) {
				result = {
					entityType,
					error: (error as Error).message,
					note: 'The query structure depends on the specific subgraph schema',
				};
			}
			break;
		}

		case 'getSubgraphStatus': {
			if (!subgraphUrl) {
				result = {
					message: 'Subgraph URL required to check status',
					availableSubgraphs: [
						'https://api.studio.thegraph.com/query/... (The Graph hosted service)',
						'https://api.goldsky.com/api/public/project_... (Goldsky)',
					],
				};
			} else {
				// Query the subgraph meta
				const metaQuery = `{
					_meta {
						block { number timestamp }
						deployment
						hasIndexingErrors
					}
				}`;

				try {
					const response = await this.helpers.request({
						method: 'POST',
						url: subgraphUrl,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ query: metaQuery }),
					});

					const data = JSON.parse(response as string);
					result = {
						subgraphUrl,
						status: data.data?._meta || 'Unknown',
						errors: data.errors,
					};
				} catch (error) {
					result = {
						subgraphUrl,
						status: 'unreachable',
						error: (error as Error).message,
					};
				}
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
