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
		displayOptions: { show: { resource: ['contract'] } },
		options: [
			{ name: 'Call Contract', value: 'callContract', description: 'Call a read-only contract function', action: 'Call contract' },
			{ name: 'Decode Function Result', value: 'decodeFunctionResult', description: 'Decode function return data', action: 'Decode function result' },
			{ name: 'Deploy Contract', value: 'deployContract', description: 'Deploy a new smart contract', action: 'Deploy contract' },
			{ name: 'Encode Function Data', value: 'encodeFunctionData', description: 'Encode function call data', action: 'Encode function data' },
			{ name: 'Estimate Contract Gas', value: 'estimateContractGas', description: 'Estimate gas for contract call', action: 'Estimate contract gas' },
			{ name: 'Execute Contract', value: 'executeContract', description: 'Execute a state-changing contract function', action: 'Execute contract' },
			{ name: 'Get Contract ABI', value: 'getContractABI', description: 'Get contract ABI from explorer', action: 'Get contract ABI' },
			{ name: 'Get Contract Bytecode', value: 'getContractBytecode', description: 'Get contract bytecode', action: 'Get contract bytecode' },
			{ name: 'Get Contract Creation Info', value: 'getContractCreationInfo', description: 'Get contract creation info', action: 'Get contract creation info' },
			{ name: 'Get Contract Events', value: 'getContractEvents', description: 'Get contract events', action: 'Get contract events' },
			{ name: 'Get Contract Source', value: 'getContractSource', description: 'Get verified contract source code', action: 'Get contract source' },
			{ name: 'Verify Contract', value: 'verifyContract', description: 'Verify contract on explorer', action: 'Verify contract' },
		],
		default: 'callContract',
	},
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		required: true,
		displayOptions: { show: { resource: ['contract'], operation: ['callContract', 'executeContract', 'getContractABI', 'getContractSource', 'getContractEvents', 'getContractBytecode', 'getContractCreationInfo', 'estimateContractGas', 'verifyContract'] } },
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		required: true,
		displayOptions: { show: { resource: ['contract'], operation: ['callContract', 'executeContract', 'deployContract', 'encodeFunctionData', 'decodeFunctionResult', 'estimateContractGas'] } },
	},
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['contract'], operation: ['callContract', 'executeContract', 'encodeFunctionData', 'decodeFunctionResult', 'estimateContractGas'] } },
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['contract'], operation: ['callContract', 'executeContract', 'encodeFunctionData', 'estimateContractGas'] } },
	},
	{
		displayName: 'Bytecode',
		name: 'bytecode',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['contract'], operation: ['deployContract'] } },
	},
	{
		displayName: 'Constructor Arguments',
		name: 'constructorArgs',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['contract'], operation: ['deployContract'] } },
	},
	{
		displayName: 'Value (ETH)',
		name: 'value',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['contract'], operation: ['executeContract', 'deployContract', 'estimateContractGas'] } },
	},
	{
		displayName: 'Event Signature',
		name: 'eventSignature',
		type: 'string',
		default: '',
		placeholder: 'Transfer(address,address,uint256)',
		displayOptions: { show: { resource: ['contract'], operation: ['getContractEvents'] } },
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['contract'], operation: ['getContractEvents'] } },
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		default: 'latest',
		displayOptions: { show: { resource: ['contract'], operation: ['getContractEvents'] } },
	},
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['contract'], operation: ['decodeFunctionResult'] } },
	},
	{
		displayName: 'Source Code',
		name: 'sourceCode',
		type: 'string',
		typeOptions: { rows: 10 },
		default: '',
		displayOptions: { show: { resource: ['contract'], operation: ['verifyContract'] } },
	},
	{
		displayName: 'Compiler Version',
		name: 'compilerVersion',
		type: 'string',
		default: '',
		placeholder: 'v0.8.20+commit.a1b79de6',
		displayOptions: { show: { resource: ['contract'], operation: ['verifyContract'] } },
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
		case 'callContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgs = JSON.parse(this.getNodeParameter('functionArgs', index) as string);

			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const contract = new ethers.Contract(contractAddress, abi, provider);
			const response = await contract[functionName](...functionArgs);
			result = { contractAddress: toChecksumAddress(contractAddress), functionName, result: response?.toString ? response.toString() : response };
			break;
		}

		case 'executeContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgs = JSON.parse(this.getNodeParameter('functionArgs', index) as string);
			const value = this.getNodeParameter('value', index) as number;

			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');
			if (!signer) throw new Error('Private key required');

			const contract = new ethers.Contract(contractAddress, abi, signer);
			const tx = await contract[functionName](...functionArgs, { value: ethers.parseEther(value.toString()) });
			const receipt = await tx.wait();
			result = { transactionHash: tx.hash, contractAddress: toChecksumAddress(contractAddress), functionName, blockNumber: receipt?.blockNumber, status: receipt?.status, gasUsed: receipt?.gasUsed?.toString() };
			break;
		}

		case 'deployContract': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const bytecode = this.getNodeParameter('bytecode', index) as string;
			const constructorArgs = JSON.parse(this.getNodeParameter('constructorArgs', index) as string);
			const value = this.getNodeParameter('value', index) as number;

			if (!signer) throw new Error('Private key required');

			const factory = new ethers.ContractFactory(abi, bytecode, signer);
			const contract = await factory.deploy(...constructorArgs, { value: ethers.parseEther(value.toString()) });
			await contract.waitForDeployment();
			const address = await contract.getAddress();
			result = { contractAddress: address, transactionHash: contract.deploymentTransaction()?.hash, deployer: await signer.getAddress() };
			break;
		}

		case 'getContractABI':
		case 'getContractSource': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const action = operation === 'getContractABI' ? 'getabi' : 'getsourcecode';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=contract&action=${action}&address=${contractAddress}&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { contractAddress: toChecksumAddress(contractAddress), [operation === 'getContractABI' ? 'abi' : 'source']: data.result, status: data.status, message: data.message };
			} else {
				result = { contractAddress: toChecksumAddress(contractAddress), message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'getContractEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const topics = eventSignature ? [ethers.id(eventSignature)] : undefined;
			const logs = await provider.getLogs({ address: contractAddress, topics, fromBlock, toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock) });
			result = { contractAddress: toChecksumAddress(contractAddress), eventSignature, events: logs.map(log => ({ blockNumber: log.blockNumber, transactionHash: log.transactionHash, topics: log.topics, data: log.data, logIndex: log.index })) };
			break;
		}

		case 'encodeFunctionData': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgs = JSON.parse(this.getNodeParameter('functionArgs', index) as string);

			const iface = new ethers.Interface(abi);
			const encodedData = iface.encodeFunctionData(functionName, functionArgs);
			result = { functionName, encodedData, selector: encodedData.slice(0, 10) };
			break;
		}

		case 'decodeFunctionResult': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const encodedData = this.getNodeParameter('encodedData', index) as string;

			const iface = new ethers.Interface(abi);
			const decoded = iface.decodeFunctionResult(functionName, encodedData);
			result = { functionName, decoded: decoded.map(d => d?.toString ? d.toString() : d) };
			break;
		}

		case 'estimateContractGas': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgs = JSON.parse(this.getNodeParameter('functionArgs', index) as string);
			const value = this.getNodeParameter('value', index) as number;

			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const contract = new ethers.Contract(contractAddress, abi, provider);
			const gasEstimate = await contract[functionName].estimateGas(...functionArgs, { value: ethers.parseEther(value.toString()) });
			const feeData = await provider.getFeeData();
			result = { contractAddress: toChecksumAddress(contractAddress), functionName, gasEstimate: gasEstimate.toString(), gasPrice: feeData.gasPrice?.toString(), estimatedCostWei: feeData.gasPrice ? (gasEstimate * feeData.gasPrice).toString() : null };
			break;
		}

		case 'getContractBytecode': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const bytecode = await provider.getCode(contractAddress);
			result = { contractAddress: toChecksumAddress(contractAddress), bytecode, isContract: bytecode !== '0x', size: (bytecode.length - 2) / 2 };
			break;
		}

		case 'getContractCreationInfo': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const apiCredentials = await this.getCredentials('scrollApi').catch(() => null);
			if (apiCredentials?.scrollscanApiKey) {
				const network = credentials.network as string;
				const baseUrl = network === 'mainnet' ? 'https://api.scrollscan.com/api' : 'https://api-sepolia.scrollscan.com/api';
				const response = await this.helpers.request({ method: 'GET', url: `${baseUrl}?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${apiCredentials.scrollscanApiKey}` });
				const data = JSON.parse(response as string);
				result = { contractAddress: toChecksumAddress(contractAddress), creationInfo: data.result, status: data.status };
			} else {
				result = { contractAddress: toChecksumAddress(contractAddress), message: 'Scrollscan API key required' };
			}
			break;
		}

		case 'verifyContract': {
			result = { message: 'Contract verification requires manual submission to Scrollscan. Use the Scrollscan verification tool.' };
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
