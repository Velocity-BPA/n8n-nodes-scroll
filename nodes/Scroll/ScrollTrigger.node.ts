/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IPollFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
} from 'n8n-workflow';

import { createScrollClient } from './transport/scrollClient';
import { ethers } from 'ethers';

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

export class ScrollTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Scroll Trigger',
		name: 'scrollTrigger',
		icon: 'file:scroll.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerType"]}}',
		description: 'Trigger workflows on Scroll zkEVM blockchain events',
		defaults: {
			name: 'Scroll Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'scrollNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'New Block', value: 'newBlock', description: 'Trigger on new blocks' },
					{ name: 'Block Finalized', value: 'blockFinalized', description: 'Trigger when a block is finalized' },
					{ name: 'Transaction Confirmed', value: 'transactionConfirmed', description: 'Trigger when a specific transaction is confirmed' },
					{ name: 'Token Transfer', value: 'tokenTransfer', description: 'Trigger on ERC-20 token transfers' },
					{ name: 'NFT Transfer', value: 'nftTransfer', description: 'Trigger on ERC-721/1155 NFT transfers' },
					{ name: 'Contract Event', value: 'contractEvent', description: 'Trigger on specific contract events' },
					{ name: 'Address Activity', value: 'addressActivity', description: 'Trigger on any activity for an address' },
					{ name: 'Bridge Deposit', value: 'bridgeDeposit', description: 'Trigger on L1→L2 bridge deposits' },
					{ name: 'Bridge Withdrawal', value: 'bridgeWithdrawal', description: 'Trigger on L2→L1 bridge withdrawals' },
					{ name: 'Large Transaction', value: 'largeTransaction', description: 'Trigger on transactions above a threshold' },
					{ name: 'Canvas Badge Minted', value: 'canvasBadgeMinted', description: 'Trigger when a Scroll Canvas badge is minted' },
				],
				default: 'newBlock',
			},
			{
				displayName: 'Block Interval',
				name: 'blockInterval',
				type: 'number',
				default: 1,
				description: 'Trigger every N blocks',
				displayOptions: { show: { triggerType: ['newBlock'] } },
			},
			{
				displayName: 'Transaction Hash',
				name: 'transactionHash',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['transactionConfirmed'] } },
			},
			{
				displayName: 'Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				displayOptions: { show: { triggerType: ['transactionConfirmed'] } },
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['tokenTransfer'] } },
			},
			{
				displayName: 'Filter By',
				name: 'tokenFilterBy',
				type: 'options',
				options: [
					{ name: 'Any Transfer', value: 'any' },
					{ name: 'From Address', value: 'from' },
					{ name: 'To Address', value: 'to' },
				],
				default: 'any',
				displayOptions: { show: { triggerType: ['tokenTransfer'] } },
			},
			{
				displayName: 'From Address',
				name: 'tokenFromAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['tokenTransfer'], tokenFilterBy: ['from'] } },
			},
			{
				displayName: 'To Address',
				name: 'tokenToAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['tokenTransfer'], tokenFilterBy: ['to'] } },
			},
			{
				displayName: 'NFT Contract Address',
				name: 'nftAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['nftTransfer'] } },
			},
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['contractEvent'] } },
			},
			{
				displayName: 'Event Signature',
				name: 'eventSignature',
				type: 'string',
				default: '',
				placeholder: 'Transfer(address,address,uint256)',
				displayOptions: { show: { triggerType: ['contractEvent'] } },
			},
			{
				displayName: 'Watch Address',
				name: 'watchAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['addressActivity'] } },
			},
			{
				displayName: 'Minimum Value (ETH)',
				name: 'minValue',
				type: 'number',
				default: 1,
				displayOptions: { show: { triggerType: ['largeTransaction'] } },
			},
			{
				displayName: 'Filter Address (Optional)',
				name: 'largeTransactionAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['largeTransaction'] } },
			},
			{
				displayName: 'Badge Contract (Optional)',
				name: 'badgeContract',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['canvasBadgeMinted'] } },
			},
			{
				displayName: 'Badge Recipient (Optional)',
				name: 'badgeRecipient',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { triggerType: ['canvasBadgeMinted'] } },
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const credentials = await this.getCredentials('scrollNetwork');
		const triggerType = this.getNodeParameter('triggerType') as string;
		const workflowStaticData = this.getWorkflowStaticData('node');

		const scrollClient = await createScrollClient({
			network: credentials.network as string,
			rpcUrl: credentials.rpcUrl as string,
			privateKey: credentials.privateKey as string,
			chainId: credentials.chainId as number,
		});

		const provider = scrollClient.getProvider();
		const events: INodeExecutionData[] = [];

		switch (triggerType) {
			case 'newBlock': {
				const blockInterval = this.getNodeParameter('blockInterval') as number;
				const lastBlock = (workflowStaticData.lastBlock as number) || 0;
				const currentBlock = await provider.getBlockNumber();

				if (lastBlock === 0) {
					workflowStaticData.lastBlock = currentBlock;
					return null;
				}

				if (currentBlock >= lastBlock + blockInterval) {
					const block = await provider.getBlock(currentBlock);
					if (block) {
						events.push({
							json: {
								blockNumber: block.number,
								blockHash: block.hash,
								timestamp: block.timestamp,
								transactionCount: block.transactions.length,
								gasUsed: block.gasUsed.toString(),
								gasLimit: block.gasLimit.toString(),
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'blockFinalized': {
				const lastFinalized = (workflowStaticData.lastFinalized as number) || 0;
				const finalizedBlock = await provider.getBlock('finalized');

				if (finalizedBlock && finalizedBlock.number > lastFinalized) {
					events.push({
						json: {
							blockNumber: finalizedBlock.number,
							blockHash: finalizedBlock.hash,
							timestamp: finalizedBlock.timestamp,
							status: 'finalized',
						},
					});
					workflowStaticData.lastFinalized = finalizedBlock.number;
				}
				break;
			}

			case 'transactionConfirmed': {
				const txHash = this.getNodeParameter('transactionHash') as string;
				const requiredConfirmations = this.getNodeParameter('confirmations') as number;
				const alreadyTriggered = workflowStaticData.triggered as boolean;

				if (!alreadyTriggered && txHash) {
					const receipt = await provider.getTransactionReceipt(txHash);
					if (receipt) {
						const currentBlock = await provider.getBlockNumber();
						const confirmations = currentBlock - receipt.blockNumber;
						if (confirmations >= requiredConfirmations) {
							events.push({
								json: {
									transactionHash: txHash,
									blockNumber: receipt.blockNumber,
									status: receipt.status,
									confirmations,
									gasUsed: receipt.gasUsed.toString(),
								},
							});
							workflowStaticData.triggered = true;
						}
					}
				}
				break;
			}

			case 'tokenTransfer': {
				const tokenAddress = this.getNodeParameter('tokenAddress') as string;
				const filterBy = this.getNodeParameter('tokenFilterBy') as string;
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					const transferTopic = ethers.id('Transfer(address,address,uint256)');
					const topics: (string | null)[] = [transferTopic];

					if (filterBy === 'from') {
						const fromAddress = this.getNodeParameter('tokenFromAddress') as string;
						topics.push(ethers.zeroPadValue(fromAddress, 32));
					} else if (filterBy === 'to') {
						topics.push(null);
						const toAddress = this.getNodeParameter('tokenToAddress') as string;
						topics.push(ethers.zeroPadValue(toAddress, 32));
					}

					const logs = await provider.getLogs({
						address: tokenAddress,
						topics,
						fromBlock: lastBlock + 1,
						toBlock: currentBlock,
					});

					for (const log of logs) {
						const from = ethers.getAddress('0x' + log.topics[1].slice(26));
						const to = ethers.getAddress('0x' + log.topics[2].slice(26));
						const value = BigInt(log.data);

						events.push({
							json: {
								tokenAddress,
								from,
								to,
								value: value.toString(),
								blockNumber: log.blockNumber,
								transactionHash: log.transactionHash,
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'nftTransfer': {
				const nftAddress = this.getNodeParameter('nftAddress') as string;
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					const transferTopic = ethers.id('Transfer(address,address,uint256)');
					const logs = await provider.getLogs({
						address: nftAddress,
						topics: [transferTopic],
						fromBlock: lastBlock + 1,
						toBlock: currentBlock,
					});

					for (const log of logs) {
						const from = ethers.getAddress('0x' + log.topics[1].slice(26));
						const to = ethers.getAddress('0x' + log.topics[2].slice(26));
						const tokenId = BigInt(log.topics[3]);

						events.push({
							json: {
								nftAddress,
								from,
								to,
								tokenId: tokenId.toString(),
								blockNumber: log.blockNumber,
								transactionHash: log.transactionHash,
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'contractEvent': {
				const contractAddress = this.getNodeParameter('contractAddress') as string;
				const eventSignature = this.getNodeParameter('eventSignature') as string;
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					const eventTopic = ethers.id(eventSignature);
					const logs = await provider.getLogs({
						address: contractAddress,
						topics: [eventTopic],
						fromBlock: lastBlock + 1,
						toBlock: currentBlock,
					});

					for (const log of logs) {
						events.push({
							json: {
								contractAddress,
								eventSignature,
								topics: log.topics,
								data: log.data,
								blockNumber: log.blockNumber,
								transactionHash: log.transactionHash,
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'addressActivity': {
				const watchAddress = this.getNodeParameter('watchAddress') as string;
				const lastNonce = (workflowStaticData.lastNonce as number) || 0;
				const currentNonce = await provider.getTransactionCount(watchAddress);

				if (currentNonce > lastNonce || lastNonce === 0) {
					const balance = await provider.getBalance(watchAddress);
					events.push({
						json: {
							address: watchAddress,
							nonce: currentNonce,
							previousNonce: lastNonce,
							balance: ethers.formatEther(balance),
							balanceWei: balance.toString(),
						},
					});
					workflowStaticData.lastNonce = currentNonce;
				}
				break;
			}

			case 'largeTransaction': {
				const minValue = this.getNodeParameter('minValue') as number;
				const watchAddress = this.getNodeParameter('largeTransactionAddress') as string;
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					for (let blockNum = lastBlock + 1; blockNum <= Math.min(currentBlock, lastBlock + 5); blockNum++) {
						const block = await provider.getBlock(blockNum, true);
						if (block && block.prefetchedTransactions) {
							for (const tx of block.prefetchedTransactions) {
								const value = parseFloat(ethers.formatEther(tx.value));
								if (value >= minValue) {
									if (!watchAddress || tx.from.toLowerCase() === watchAddress.toLowerCase() || tx.to?.toLowerCase() === watchAddress.toLowerCase()) {
										events.push({
											json: {
												transactionHash: tx.hash,
												from: tx.from,
												to: tx.to,
												value: ethers.formatEther(tx.value),
												valueWei: tx.value.toString(),
												blockNumber: blockNum,
											},
										});
									}
								}
							}
						}
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'bridgeDeposit':
			case 'bridgeWithdrawal': {
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					const topic = triggerType === 'bridgeDeposit' 
						? ethers.id('DepositETH(address,address,uint256,bytes)')
						: ethers.id('WithdrawETH(address,address,uint256,bytes)');

					const logs = await provider.getLogs({
						topics: [topic],
						fromBlock: lastBlock + 1,
						toBlock: currentBlock,
					});

					for (const log of logs) {
						events.push({
							json: {
								type: triggerType,
								data: log.data,
								blockNumber: log.blockNumber,
								transactionHash: log.transactionHash,
								address: log.address,
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}

			case 'canvasBadgeMinted': {
				const badgeContract = this.getNodeParameter('badgeContract') as string;
				const badgeRecipient = this.getNodeParameter('badgeRecipient') as string;
				const lastBlock = (workflowStaticData.lastBlock as number) || await provider.getBlockNumber();
				const currentBlock = await provider.getBlockNumber();

				if (currentBlock > lastBlock) {
					const transferTopic = ethers.id('Transfer(address,address,uint256)');
					const topics: (string | null)[] = [transferTopic, ethers.zeroPadValue(ethers.ZeroAddress, 32)];
					if (badgeRecipient) topics.push(ethers.zeroPadValue(badgeRecipient, 32));

					const logs = await provider.getLogs({
						address: badgeContract || undefined,
						topics,
						fromBlock: lastBlock + 1,
						toBlock: currentBlock,
					});

					for (const log of logs) {
						const to = ethers.getAddress('0x' + log.topics[2].slice(26));
						const tokenId = BigInt(log.topics[3]);

						events.push({
							json: {
								type: 'canvasBadgeMinted',
								badgeContract: log.address,
								recipient: to,
								tokenId: tokenId.toString(),
								blockNumber: log.blockNumber,
								transactionHash: log.transactionHash,
							},
						});
					}
					workflowStaticData.lastBlock = currentBlock;
				}
				break;
			}
		}

		if (events.length === 0) {
			return null;
		}

		return [events];
	}
}
