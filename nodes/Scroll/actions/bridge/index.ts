/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createScrollClient } from '../../transport/scrollClient';
import { ethers } from 'ethers';


export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bridge'] } },
		options: [
			{ name: 'Estimate Bridge Time', value: 'estimateBridgeTime', action: 'Estimate bridge time' },
			{ name: 'Get Bridge Fee', value: 'getBridgeFee', action: 'Get bridge fee' },
			{ name: 'Get Deposit Status', value: 'getDepositStatus', action: 'Get deposit status' },
			{ name: 'Get Withdrawal Status', value: 'getWithdrawalStatus', action: 'Get withdrawal status' },
			{ name: 'Withdraw ETH', value: 'withdrawETH', action: 'Withdraw ETH' },
		],
		default: 'getBridgeFee',
	},
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['bridge'], operation: ['getDepositStatus', 'getWithdrawalStatus'] } },
	},
	{
		displayName: 'Amount (ETH)',
		name: 'amount',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['bridge'], operation: ['withdrawETH'] } },
	},
	{
		displayName: 'Direction',
		name: 'direction',
		type: 'options',
		options: [
			{ name: 'Deposit (L1→L2)', value: 'deposit' },
			{ name: 'Withdrawal (L2→L1)', value: 'withdrawal' },
		],
		default: 'deposit',
		displayOptions: { show: { resource: ['bridge'], operation: ['estimateBridgeTime', 'getBridgeFee'] } },
	},
];

const L2_GATEWAY_ROUTER = '0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79';
const GATEWAY_ROUTER_ABI = ['function withdrawETH(uint256 amount, uint256 gasLimit) payable'];

export async function execute(this: IExecuteFunctions, index: number, operation: string): Promise<INodeExecutionData[]> {
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
		case 'getBridgeFee': {
			const direction = this.getNodeParameter('direction', index) as string;
			const feeData = await provider.getFeeData();
			const estimatedGas = direction === 'deposit' ? 150000n : 200000n;
			const estimatedFee = feeData.gasPrice ? estimatedGas * feeData.gasPrice : 0n;
			result = { direction, estimatedGasUnits: estimatedGas.toString(), gasPrice: feeData.gasPrice?.toString(), estimatedFeeWei: estimatedFee.toString(), estimatedFeeEth: ethers.formatEther(estimatedFee) };
			break;
		}
		case 'estimateBridgeTime': {
			const direction = this.getNodeParameter('direction', index) as string;
			result = { direction, estimatedTime: direction === 'deposit' ? '10-20 minutes' : '7-14 days', description: direction === 'deposit' ? 'Deposits are processed after block finalization on L1' : 'Withdrawals require a challenge period before claiming on L1' };
			break;
		}
		case 'getDepositStatus': {
			const txHash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await provider.getTransactionReceipt(txHash);
			result = { transactionHash: txHash, status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending', blockNumber: receipt?.blockNumber, direction: 'deposit' };
			break;
		}
		case 'getWithdrawalStatus': {
			const txHash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await provider.getTransactionReceipt(txHash);
			result = { transactionHash: txHash, status: receipt ? (receipt.status === 1 ? 'initiated' : 'failed') : 'pending', blockNumber: receipt?.blockNumber, direction: 'withdrawal', note: 'Withdrawals require 7-14 days challenge period before claiming on L1' };
			break;
		}
		case 'withdrawETH': {
			const amount = this.getNodeParameter('amount', index) as number;
			if (!signer) throw new Error('Private key required');
			const gateway = new ethers.Contract(L2_GATEWAY_ROUTER, GATEWAY_ROUTER_ABI, signer);
			const tx = await gateway.withdrawETH(ethers.parseEther(amount.toString()), 200000, { value: ethers.parseEther(amount.toString()) });
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, from: await signer.getAddress(), amount: amount.toString(), blockNumber: receipt?.blockNumber, status: receipt?.status, estimatedClaimTime: '7-14 days' };
			break;
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
