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
import { L1_GAS_PRICE_ORACLE_ADDRESS, L1_GAS_PRICE_ORACLE_ABI } from '../../constants/contracts';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['gas'] } },
		options: [
			{ name: 'Calculate ZK Proof Fee', value: 'calculateZKProofFee', description: 'Calculate ZK proof fee component', action: 'Calculate ZK proof fee' },
			{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for transaction', action: 'Estimate gas' },
			{ name: 'Get Gas History', value: 'getGasHistory', description: 'Get historical gas prices', action: 'Get gas history' },
			{ name: 'Get Gas Oracle', value: 'getGasOracle', description: 'Get gas oracle info', action: 'Get gas oracle' },
			{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get current gas price', action: 'Get gas price' },
			{ name: 'Get L1 Data Fee', value: 'getL1DataFee', description: 'Get L1 data availability fee', action: 'Get L1 data fee' },
			{ name: 'Get L2 Execution Fee', value: 'getL2ExecutionFee', description: 'Get L2 execution fee', action: 'Get L2 execution fee' },
			{ name: 'Get Max Fee Per Gas', value: 'getMaxFeePerGas', description: 'Get max fee per gas', action: 'Get max fee per gas' },
			{ name: 'Get Max Priority Fee', value: 'getMaxPriorityFee', description: 'Get max priority fee', action: 'Get max priority fee' },
			{ name: 'Get Total Fee Estimate', value: 'getTotalFeeEstimate', description: 'Get total fee estimate', action: 'Get total fee estimate' },
		],
		default: 'getGasPrice',
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateGas', 'getL1DataFee', 'getTotalFeeEstimate'] } },
	},
	{
		displayName: 'Value (ETH)',
		name: 'value',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['gas'], operation: ['estimateGas', 'getTotalFeeEstimate'] } },
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '0x',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateGas', 'getL1DataFee', 'getTotalFeeEstimate'] } },
	},
	{
		displayName: 'Block Count',
		name: 'blockCount',
		type: 'number',
		default: 10,
		displayOptions: { show: { resource: ['gas'], operation: ['getGasHistory'] } },
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
		case 'getGasPrice': {
			const feeData = await provider.getFeeData();
			result = {
				gasPrice: feeData.gasPrice?.toString(),
				gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxFeePerGasGwei: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeeGwei: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
			};
			break;
		}

		case 'getMaxFeePerGas': {
			const feeData = await provider.getFeeData();
			result = {
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxFeePerGasGwei: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
			};
			break;
		}

		case 'getMaxPriorityFee': {
			const feeData = await provider.getFeeData();
			result = {
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeeGwei: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
			};
			break;
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;

			const tx: ethers.TransactionRequest = { data };
			if (toAddress && isValidAddress(toAddress)) tx.to = toChecksumAddress(toAddress);
			if (value > 0) tx.value = ethers.parseEther(value.toString());

			const gasEstimate = await provider.estimateGas(tx);
			const feeData = await provider.getFeeData();
			const estimatedCost = feeData.gasPrice ? gasEstimate * feeData.gasPrice : 0n;

			result = {
				gasEstimate: gasEstimate.toString(),
				gasPrice: feeData.gasPrice?.toString(),
				estimatedCostWei: estimatedCost.toString(),
				estimatedCostEth: ethers.formatEther(estimatedCost),
			};
			break;
		}

		case 'getL1DataFee': {
			const data = this.getNodeParameter('data', index) as string;
			
			try {
				const oracle = new ethers.Contract(L1_GAS_PRICE_ORACLE_ADDRESS, L1_GAS_PRICE_ORACLE_ABI, provider);
				const l1DataFee = await oracle.getL1Fee(data || '0x');
				result = {
					l1DataFee: l1DataFee.toString(),
					l1DataFeeEth: ethers.formatEther(l1DataFee),
					dataSize: data ? (data.length - 2) / 2 : 0,
				};
			} catch {
				result = {
					message: 'Could not calculate L1 data fee',
					dataSize: data ? (data.length - 2) / 2 : 0,
				};
			}
			break;
		}

		case 'getL2ExecutionFee': {
			const feeData = await provider.getFeeData();
			const baseGas = 21000n;
			const executionFee = feeData.gasPrice ? baseGas * feeData.gasPrice : 0n;
			result = {
				baseGas: baseGas.toString(),
				gasPrice: feeData.gasPrice?.toString(),
				l2ExecutionFee: executionFee.toString(),
				l2ExecutionFeeEth: ethers.formatEther(executionFee),
			};
			break;
		}

		case 'getTotalFeeEstimate': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;

			const tx: ethers.TransactionRequest = { data };
			if (toAddress && isValidAddress(toAddress)) tx.to = toChecksumAddress(toAddress);
			if (value > 0) tx.value = ethers.parseEther(value.toString());

			const gasEstimate = await provider.estimateGas(tx);
			const feeData = await provider.getFeeData();
			const l2Fee = feeData.gasPrice ? gasEstimate * feeData.gasPrice : 0n;

			let l1Fee = 0n;
			try {
				const oracle = new ethers.Contract(L1_GAS_PRICE_ORACLE_ADDRESS, L1_GAS_PRICE_ORACLE_ABI, provider);
				l1Fee = await oracle.getL1Fee(data || '0x');
			} catch { /* ignore */ }

			const totalFee = l2Fee + l1Fee;
			result = {
				gasEstimate: gasEstimate.toString(),
				l2ExecutionFee: l2Fee.toString(),
				l1DataFee: l1Fee.toString(),
				totalFee: totalFee.toString(),
				totalFeeEth: ethers.formatEther(totalFee),
			};
			break;
		}

		case 'getGasOracle': {
			try {
				const oracle = new ethers.Contract(L1_GAS_PRICE_ORACLE_ADDRESS, L1_GAS_PRICE_ORACLE_ABI, provider);
				const [l1BaseFee, overhead, scalar] = await Promise.all([
					oracle.l1BaseFee().catch(() => 0n),
					oracle.overhead().catch(() => 0n),
					oracle.scalar().catch(() => 0n),
				]);
				result = {
					oracleAddress: L1_GAS_PRICE_ORACLE_ADDRESS,
					l1BaseFee: l1BaseFee.toString(),
					overhead: overhead.toString(),
					scalar: scalar.toString(),
				};
			} catch {
				result = {
					oracleAddress: L1_GAS_PRICE_ORACLE_ADDRESS,
					message: 'Could not fetch oracle data',
				};
			}
			break;
		}

		case 'getGasHistory': {
			const blockCount = this.getNodeParameter('blockCount', index) as number;
			const currentBlock = await provider.getBlockNumber();
			const history = [];

			for (let i = 0; i < blockCount; i++) {
				const blockNum = currentBlock - i;
				const block = await provider.getBlock(blockNum);
				if (block) {
					history.push({
						blockNumber: block.number,
						baseFeePerGas: block.baseFeePerGas?.toString(),
						gasUsed: block.gasUsed.toString(),
						gasLimit: block.gasLimit.toString(),
						utilization: Number((block.gasUsed * 100n) / block.gasLimit),
					});
				}
			}
			result = { history, blockCount: history.length };
			break;
		}

		case 'calculateZKProofFee': {
			// ZK proof fees are part of the L1 data fee
			const feeData = await provider.getFeeData();
			result = {
				message: 'ZK proof fees are included in the L1 data fee component',
				currentGasPrice: feeData.gasPrice?.toString(),
				note: 'Proof generation costs are amortized across all transactions in a batch',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
