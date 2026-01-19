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
		displayOptions: { show: { resource: ['event'] } },
		options: [
			{ name: 'Decode Event', value: 'decodeEvent', description: 'Decode event log data', action: 'Decode event' },
			{ name: 'Filter Events', value: 'filterEvents', description: 'Filter events by criteria', action: 'Filter events' },
			{ name: 'Get Event History', value: 'getEventHistory', description: 'Get historical events', action: 'Get event history' },
			{ name: 'Get Events By Contract', value: 'getEventsByContract', description: 'Get events from a contract', action: 'Get events by contract' },
			{ name: 'Get Events By Topic', value: 'getEventsByTopic', description: 'Get events by topic', action: 'Get events by topic' },
			{ name: 'Get Logs', value: 'getLogs', description: 'Get raw event logs', action: 'Get logs' },
			{ name: 'Subscribe To Events', value: 'subscribeToEvents', description: 'Get recent events', action: 'Subscribe to events' },
		],
		default: 'getLogs',
	},
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['event'], operation: ['getLogs', 'getEventsByContract', 'filterEvents', 'getEventHistory', 'subscribeToEvents'] } },
	},
	{
		displayName: 'Event Signature',
		name: 'eventSignature',
		type: 'string',
		default: '',
		placeholder: 'Transfer(address,address,uint256)',
		displayOptions: { show: { resource: ['event'], operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'filterEvents', 'subscribeToEvents'] } },
	},
	{
		displayName: 'Topic 0',
		name: 'topic0',
		type: 'string',
		default: '',
		placeholder: '0x...',
		displayOptions: { show: { resource: ['event'], operation: ['getEventsByTopic', 'filterEvents'] } },
	},
	{
		displayName: 'Topic 1',
		name: 'topic1',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['event'], operation: ['filterEvents'] } },
	},
	{
		displayName: 'Topic 2',
		name: 'topic2',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['event'], operation: ['filterEvents'] } },
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['event'], operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'filterEvents', 'getEventHistory'] } },
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		default: 'latest',
		displayOptions: { show: { resource: ['event'], operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'filterEvents', 'getEventHistory'] } },
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['event'], operation: ['decodeEvent'] } },
	},
	{
		displayName: 'Log Data',
		name: 'logData',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['event'], operation: ['decodeEvent'] } },
	},
	{
		displayName: 'Log Topics',
		name: 'logTopics',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['event'], operation: ['decodeEvent'] } },
	},
	{
		displayName: 'Block Count',
		name: 'blockCount',
		type: 'number',
		default: 100,
		displayOptions: { show: { resource: ['event'], operation: ['subscribeToEvents'] } },
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

	const formatLog = (log: ethers.Log) => ({
		address: log.address,
		blockNumber: log.blockNumber,
		blockHash: log.blockHash,
		transactionHash: log.transactionHash,
		transactionIndex: log.transactionIndex,
		logIndex: log.index,
		topics: log.topics,
		data: log.data,
		removed: log.removed,
	});

	switch (operation) {
		case 'getLogs': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			const filter: ethers.Filter = {
				address: contractAddress && isValidAddress(contractAddress) ? contractAddress : undefined,
				topics: eventSignature ? [ethers.id(eventSignature)] : undefined,
				fromBlock,
				toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock),
			};

			const logs = await provider.getLogs(filter);
			result = { logs: logs.map(formatLog), count: logs.length, fromBlock, toBlock };
			break;
		}

		case 'getEventsByContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			if (!isValidAddress(contractAddress)) throw new Error('Invalid contract address');

			const filter: ethers.Filter = {
				address: contractAddress,
				topics: eventSignature ? [ethers.id(eventSignature)] : undefined,
				fromBlock,
				toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock),
			};

			const logs = await provider.getLogs(filter);
			result = { contractAddress: toChecksumAddress(contractAddress), eventSignature, events: logs.map(formatLog), count: logs.length };
			break;
		}

		case 'getEventsByTopic': {
			const topic0 = this.getNodeParameter('topic0', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			const topicHash = topic0 || (eventSignature ? ethers.id(eventSignature) : null);
			if (!topicHash) throw new Error('Topic or event signature required');

			const logs = await provider.getLogs({
				topics: [topicHash],
				fromBlock,
				toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock),
			});
			result = { topic: topicHash, events: logs.map(formatLog), count: logs.length };
			break;
		}

		case 'filterEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const topic0 = this.getNodeParameter('topic0', index) as string;
			const topic1 = this.getNodeParameter('topic1', index) as string;
			const topic2 = this.getNodeParameter('topic2', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			const topics: (string | null)[] = [];
			if (topic0 || eventSignature) topics.push(topic0 || ethers.id(eventSignature));
			else topics.push(null);
			if (topic1) topics.push(topic1);
			if (topic2) { if (topics.length === 1) topics.push(null); topics.push(topic2); }

			const logs = await provider.getLogs({
				address: contractAddress && isValidAddress(contractAddress) ? contractAddress : undefined,
				topics: topics.length > 0 ? topics : undefined,
				fromBlock,
				toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock),
			});
			result = { events: logs.map(formatLog), count: logs.length, filter: { contractAddress, topics } };
			break;
		}

		case 'getEventHistory': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as string;

			const logs = await provider.getLogs({
				address: contractAddress && isValidAddress(contractAddress) ? contractAddress : undefined,
				fromBlock,
				toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock),
			});
			result = { events: logs.map(formatLog), count: logs.length, fromBlock, toBlock };
			break;
		}

		case 'subscribeToEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const eventSignature = this.getNodeParameter('eventSignature', index) as string;
			const blockCount = this.getNodeParameter('blockCount', index) as number;

			const currentBlock = await provider.getBlockNumber();
			const fromBlock = Math.max(0, currentBlock - blockCount);

			const logs = await provider.getLogs({
				address: contractAddress && isValidAddress(contractAddress) ? contractAddress : undefined,
				topics: eventSignature ? [ethers.id(eventSignature)] : undefined,
				fromBlock,
				toBlock: 'latest',
			});
			result = { events: logs.map(formatLog), count: logs.length, fromBlock, toBlock: currentBlock };
			break;
		}

		case 'decodeEvent': {
			const abi = JSON.parse(this.getNodeParameter('abi', index) as string);
			const logData = this.getNodeParameter('logData', index) as string;
			const logTopics = JSON.parse(this.getNodeParameter('logTopics', index) as string);

			const iface = new ethers.Interface(abi);
			const parsed = iface.parseLog({ data: logData, topics: logTopics });
			result = parsed ? { eventName: parsed.name, signature: parsed.signature, args: Object.fromEntries(parsed.args.map((arg, i) => [parsed.fragment.inputs[i]?.name || i.toString(), arg?.toString ? arg.toString() : arg])) } : { error: 'Could not decode event' };
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
