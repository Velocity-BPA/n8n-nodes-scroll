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
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{ name: 'Cancel Transaction', value: 'cancelTransaction', description: 'Cancel a pending transaction', action: 'Cancel transaction' },
			{ name: 'Decode Transaction', value: 'decodeTransaction', description: 'Decode transaction input data', action: 'Decode transaction' },
			{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for a transaction', action: 'Estimate gas' },
			{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get current gas price', action: 'Get gas price' },
			{ name: 'Get Max Priority Fee', value: 'getMaxPriorityFee', description: 'Get max priority fee', action: 'Get max priority fee' },
			{ name: 'Get Pending Transactions', value: 'getPendingTransactions', description: 'Get pending transactions', action: 'Get pending transactions' },
			{ name: 'Get Transaction', value: 'getTransaction', description: 'Get transaction details', action: 'Get transaction' },
			{ name: 'Get Transaction Proof', value: 'getTransactionProof', description: 'Get transaction proof', action: 'Get transaction proof' },
			{ name: 'Get Transaction Receipt', value: 'getTransactionReceipt', description: 'Get transaction receipt', action: 'Get transaction receipt' },
			{ name: 'Get Transaction Status', value: 'getTransactionStatus', description: 'Get transaction status', action: 'Get transaction status' },
			{ name: 'Send ETH', value: 'sendETH', description: 'Send ETH to an address', action: 'Send ETH' },
			{ name: 'Send Transaction', value: 'sendTransaction', description: 'Send a raw transaction', action: 'Send transaction' },
			{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign a transaction without sending', action: 'Sign transaction' },
			{ name: 'Speed Up Transaction', value: 'speedUpTransaction', description: 'Speed up a pending transaction', action: 'Speed up transaction' },
			{ name: 'Wait For Transaction', value: 'waitForTransaction', description: 'Wait for transaction confirmation', action: 'Wait for transaction' },
		],
		default: 'getTransaction',
	},
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransaction', 'getTransactionReceipt', 'getTransactionStatus', 'waitForTransaction', 'cancelTransaction', 'speedUpTransaction', 'getTransactionProof', 'decodeTransaction'],
			},
		},
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendETH', 'sendTransaction', 'signTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Value (ETH)',
		name: 'value',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendETH', 'sendTransaction', 'signTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '0x',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendTransaction', 'signTransaction', 'estimateGas', 'decodeTransaction'],
			},
		},
	},
	{
		displayName: 'Confirmations',
		name: 'confirmations',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForTransaction'],
			},
		},
	},
	{
		displayName: 'Timeout (seconds)',
		name: 'timeout',
		type: 'number',
		default: 120,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForTransaction'],
			},
		},
	},
	{
		displayName: 'Gas Increase (%)',
		name: 'gasIncrease',
		type: 'number',
		default: 20,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['speedUpTransaction'],
			},
		},
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['decodeTransaction'],
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getPendingTransactions'],
			},
		},
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
	let result: IDataObject;

	switch (operation) {
		case 'getTransaction': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const tx = await provider.getTransaction(hash);
			if (!tx) throw new Error('Transaction not found');
			result = {
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: ethers.formatEther(tx.value),
				valueWei: tx.value.toString(),
				nonce: tx.nonce,
				gasLimit: tx.gasLimit.toString(),
				gasPrice: tx.gasPrice?.toString(),
				maxFeePerGas: tx.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
				data: tx.data,
				chainId: tx.chainId?.toString(),
				blockNumber: tx.blockNumber,
				blockHash: tx.blockHash,
			};
			break;
		}

		case 'getTransactionReceipt': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await provider.getTransactionReceipt(hash);
			if (!receipt) throw new Error('Receipt not found');
			result = {
				transactionHash: receipt.hash,
				blockNumber: receipt.blockNumber,
				blockHash: receipt.blockHash,
				from: receipt.from,
				to: receipt.to,
				contractAddress: receipt.contractAddress,
				status: receipt.status,
				gasUsed: receipt.gasUsed.toString(),
				cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
				effectiveGasPrice: receipt.gasPrice?.toString(),
				logsCount: receipt.logs.length,
			};
			break;
		}

		case 'getTransactionStatus': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const tx = await provider.getTransaction(hash);
			const receipt = await provider.getTransactionReceipt(hash);
			let status = 'unknown';
			if (!tx) status = 'not_found';
			else if (!receipt) status = 'pending';
			else if (receipt.status === 1) status = 'success';
			else if (receipt.status === 0) status = 'failed';
			result = { transactionHash: hash, status, blockNumber: receipt?.blockNumber, confirmations: receipt ? (await provider.getBlockNumber()) - receipt.blockNumber : 0 };
			break;
		}

		case 'sendETH': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			if (!isValidAddress(to)) throw new Error('Invalid destination address');
			if (!signer) throw new Error('Private key required');
			const tx = await signer.sendTransaction({ to: toChecksumAddress(to), value: ethers.parseEther(value.toString()) });
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, from: tx.from, to: tx.to, value: ethers.formatEther(tx.value), blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'sendTransaction': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;
			if (!isValidAddress(to)) throw new Error('Invalid destination address');
			if (!signer) throw new Error('Private key required');
			const tx = await signer.sendTransaction({ to: toChecksumAddress(to), value: ethers.parseEther(value.toString()), data });
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, from: tx.from, to: tx.to, value: ethers.formatEther(tx.value), blockNumber: receipt?.blockNumber, status: receipt?.status };
			break;
		}

		case 'signTransaction': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;
			if (!isValidAddress(to)) throw new Error('Invalid destination address');
			if (!signer) throw new Error('Private key required');
			const nonce = await provider.getTransactionCount(await signer.getAddress());
			const feeData = await provider.getFeeData();
			const txRequest = { to: toChecksumAddress(to), value: ethers.parseEther(value.toString()), data, nonce, gasLimit: 21000n, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
			const signedTx = await signer.signTransaction(txRequest);
			result = { signedTransaction: signedTx, nonce, to, value };
			break;
		}

		case 'waitForTransaction': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const confirmations = this.getNodeParameter('confirmations', index) as number;
			const timeout = this.getNodeParameter('timeout', index) as number;
			const receipt = await provider.waitForTransaction(hash, confirmations, timeout * 1000);
			if (!receipt) throw new Error('Transaction not found or timed out');
			result = { transactionHash: receipt.hash, blockNumber: receipt.blockNumber, status: receipt.status, gasUsed: receipt.gasUsed.toString(), confirmations };
			break;
		}

		case 'estimateGas': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const data = this.getNodeParameter('data', index) as string;
			if (!isValidAddress(to)) throw new Error('Invalid destination address');
			const gasEstimate = await provider.estimateGas({ to: toChecksumAddress(to), value: ethers.parseEther(value.toString()), data });
			const feeData = await provider.getFeeData();
			result = { gasEstimate: gasEstimate.toString(), gasPrice: feeData.gasPrice?.toString(), maxFeePerGas: feeData.maxFeePerGas?.toString(), maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() };
			break;
		}

		case 'getGasPrice': {
			const feeData = await provider.getFeeData();
			result = { gasPrice: feeData.gasPrice?.toString(), gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null, maxFeePerGas: feeData.maxFeePerGas?.toString(), maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() };
			break;
		}

		case 'getMaxPriorityFee': {
			const feeData = await provider.getFeeData();
			result = { maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(), maxPriorityFeeGwei: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null };
			break;
		}

		case 'cancelTransaction':
		case 'speedUpTransaction': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			if (!signer) throw new Error('Private key required');
			const tx = await provider.getTransaction(hash);
			if (!tx) throw new Error('Transaction not found');
			if (tx.blockNumber) throw new Error('Transaction already mined');
			const gasIncrease = operation === 'speedUpTransaction' ? this.getNodeParameter('gasIncrease', index) as number : 100;
			const newMaxFeePerGas = tx.maxFeePerGas ? (tx.maxFeePerGas * BigInt(100 + gasIncrease)) / 100n : undefined;
			const newMaxPriorityFeePerGas = tx.maxPriorityFeePerGas ? (tx.maxPriorityFeePerGas * BigInt(100 + gasIncrease)) / 100n : undefined;
			const newTx = await signer.sendTransaction({
				to: operation === 'cancelTransaction' ? await signer.getAddress() : tx.to,
				value: operation === 'cancelTransaction' ? 0n : tx.value,
				data: operation === 'cancelTransaction' ? '0x' : tx.data,
				nonce: tx.nonce,
				maxFeePerGas: newMaxFeePerGas,
				maxPriorityFeePerGas: newMaxPriorityFeePerGas,
			});
			result = { originalHash: hash, newTransactionHash: newTx.hash, nonce: tx.nonce, operation };
			break;
		}

		case 'getPendingTransactions': {
			const address = this.getNodeParameter('address', index) as string;
			const pendingNonce = await provider.getTransactionCount(address, 'pending');
			const confirmedNonce = await provider.getTransactionCount(address, 'latest');
			result = { address: toChecksumAddress(address), pendingNonce, confirmedNonce, pendingCount: pendingNonce - confirmedNonce };
			break;
		}

		case 'getTransactionProof': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await provider.getTransactionReceipt(hash);
			if (!receipt) throw new Error('Transaction not found');
			result = { transactionHash: hash, blockNumber: receipt.blockNumber, blockHash: receipt.blockHash, transactionIndex: receipt.index, status: receipt.status };
			break;
		}

		case 'decodeTransaction': {
			const hash = this.getNodeParameter('transactionHash', index) as string;
			const abiParam = this.getNodeParameter('abi', index) as string;
			const tx = await provider.getTransaction(hash);
			if (!tx) throw new Error('Transaction not found');
			try {
				const abi = JSON.parse(abiParam);
				const iface = new ethers.Interface(abi);
				const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
				result = { transactionHash: hash, functionName: decoded?.name, args: decoded?.args ? Object.fromEntries(decoded.args.map((arg, i) => [i.toString(), arg?.toString()])) : {}, signature: decoded?.signature };
			} catch {
				result = { transactionHash: hash, data: tx.data, error: 'Could not decode with provided ABI' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
