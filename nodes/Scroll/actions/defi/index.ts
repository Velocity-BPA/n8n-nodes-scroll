/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { DEX_ADDRESSES, LENDING_PROTOCOLS } from '../../constants/gateways';
import { isValidAddress, toChecksumAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['defi'] } },
		options: [
			{ name: 'Add Liquidity', value: 'addLiquidity', description: 'Add liquidity to a pool', action: 'Add liquidity' },
			{ name: 'Execute Swap', value: 'executeSwap', description: 'Execute a token swap', action: 'Execute swap' },
			{ name: 'Get DEX Prices', value: 'getDEXPrices', description: 'Get DEX token prices', action: 'Get DEX prices' },
			{ name: 'Get Lending Markets', value: 'getLendingMarkets', description: 'Get lending market info', action: 'Get lending markets' },
			{ name: 'Get Liquidity Pools', value: 'getLiquidityPools', description: 'Get liquidity pool info', action: 'Get liquidity pools' },
			{ name: 'Get Protocol Stats', value: 'getProtocolStats', description: 'Get DeFi protocol stats', action: 'Get protocol stats' },
			{ name: 'Get TVL Stats', value: 'getTVLStats', description: 'Get TVL statistics', action: 'Get TVL stats' },
			{ name: 'Get Yield Farms', value: 'getYieldFarms', description: 'Get yield farming opportunities', action: 'Get yield farms' },
			{ name: 'Remove Liquidity', value: 'removeLiquidity', description: 'Remove liquidity from pool', action: 'Remove liquidity' },
		],
		default: 'getDEXPrices',
	},
	{
		displayName: 'Protocol',
		name: 'protocol',
		type: 'options',
		options: [
			{ name: 'SyncSwap', value: 'syncswap' },
			{ name: 'iZUMi', value: 'izumi' },
			{ name: 'Ambient', value: 'ambient' },
			{ name: 'Aave V3', value: 'aave' },
			{ name: 'Compound V3', value: 'compound' },
			{ name: 'LayerBank', value: 'layerbank' },
		],
		default: 'syncswap',
		displayOptions: { show: { resource: ['defi'], operation: ['getDEXPrices', 'getLiquidityPools', 'executeSwap', 'addLiquidity', 'removeLiquidity', 'getLendingMarkets'] } },
	},
	{
		displayName: 'Token In',
		name: 'tokenIn',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['defi'], operation: ['getDEXPrices', 'executeSwap'] } },
	},
	{
		displayName: 'Token Out',
		name: 'tokenOut',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['defi'], operation: ['getDEXPrices', 'executeSwap'] } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '0',
		displayOptions: { show: { resource: ['defi'], operation: ['executeSwap', 'addLiquidity', 'removeLiquidity'] } },
	},
	{
		displayName: 'Pool Address',
		name: 'poolAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['defi'], operation: ['addLiquidity', 'removeLiquidity', 'getLiquidityPools'] } },
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('scrollNetwork');
	const network = credentials.network as string;
	let result: IDataObject;

	switch (operation) {
		case 'getDEXPrices': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;

			const dexAddresses = DEX_ADDRESSES[network as keyof typeof DEX_ADDRESSES] || DEX_ADDRESSES.mainnet;
			const protocolAddress = dexAddresses[protocol as keyof typeof dexAddresses];

			result = {
				protocol,
				protocolAddress,
				tokenIn: tokenIn ? toChecksumAddress(tokenIn) : null,
				tokenOut: tokenOut ? toChecksumAddress(tokenOut) : null,
				message: 'Price quotes require direct interaction with DEX contracts or aggregators',
				note: 'Use a DEX aggregator API for accurate price quotes',
			};
			break;
		}

		case 'getLiquidityPools': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			const dexAddresses = DEX_ADDRESSES[network as keyof typeof DEX_ADDRESSES] || DEX_ADDRESSES.mainnet;
			const protocolAddress = dexAddresses[protocol as keyof typeof dexAddresses];

			result = {
				protocol,
				protocolAddress,
				poolAddress: poolAddress ? toChecksumAddress(poolAddress) : null,
				message: 'Pool details require querying the specific DEX factory contract',
			};
			break;
		}

		case 'executeSwap': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(tokenIn) || !isValidAddress(tokenOut)) {
				throw new Error('Invalid token addresses');
			}

			result = {
				protocol,
				tokenIn: toChecksumAddress(tokenIn),
				tokenOut: toChecksumAddress(tokenOut),
				amount,
				message: 'Swap execution requires direct contract interaction with proper slippage settings',
				note: 'Use a DEX router contract for safe swaps',
			};
			break;
		}

		case 'addLiquidity':
		case 'removeLiquidity': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			result = {
				operation,
				protocol,
				poolAddress: poolAddress ? toChecksumAddress(poolAddress) : null,
				amount,
				message: `${operation === 'addLiquidity' ? 'Adding' : 'Removing'} liquidity requires direct pool contract interaction`,
			};
			break;
		}

		case 'getLendingMarkets': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const lendingAddresses = LENDING_PROTOCOLS[network as keyof typeof LENDING_PROTOCOLS] || LENDING_PROTOCOLS.mainnet;
			const protocolAddress = lendingAddresses[protocol as keyof typeof lendingAddresses];

			result = {
				protocol,
				protocolAddress,
				message: 'Lending market data requires querying protocol-specific contracts',
				supportedProtocols: Object.keys(lendingAddresses),
			};
			break;
		}

		case 'getYieldFarms': {
			result = {
				message: 'Yield farming opportunities available on Scroll',
				protocols: ['SyncSwap LP Staking', 'iZUMi Farms', 'LayerBank Lending'],
				note: 'Check individual protocol websites for current APY rates',
			};
			break;
		}

		case 'getTVLStats': {
			result = {
				message: 'TVL statistics for Scroll ecosystem',
				note: 'Use DeFiLlama API for accurate TVL data',
				apiEndpoint: 'https://api.llama.fi/tvl/scroll',
			};
			break;
		}

		case 'getProtocolStats': {
			const dexAddresses = DEX_ADDRESSES[network as keyof typeof DEX_ADDRESSES] || DEX_ADDRESSES.mainnet;
			const lendingAddresses = LENDING_PROTOCOLS[network as keyof typeof LENDING_PROTOCOLS] || LENDING_PROTOCOLS.mainnet;

			result = {
				network,
				dexProtocols: Object.keys(dexAddresses),
				lendingProtocols: Object.keys(lendingAddresses),
				message: 'Protocol-specific stats require querying individual contracts',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
