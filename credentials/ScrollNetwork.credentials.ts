/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Scroll Network Credentials
 *
 * Provides authentication and connection details for interacting with
 * Scroll zkEVM L2 blockchain networks (Mainnet, Sepolia Testnet, or Custom).
 */
export class ScrollNetwork implements ICredentialType {
  name = 'scrollNetwork';
  displayName = 'Scroll Network';
  documentationUrl = 'https://docs.scroll.io/';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Scroll Mainnet',
          value: 'mainnet',
          description: 'Scroll Mainnet (Chain ID: 534352)',
        },
        {
          name: 'Scroll Sepolia Testnet',
          value: 'sepolia',
          description: 'Scroll Sepolia Testnet (Chain ID: 534351)',
        },
        {
          name: 'Custom Endpoint',
          value: 'custom',
          description: 'Custom RPC endpoint',
        },
      ],
      default: 'mainnet',
      description: 'Select the Scroll network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://rpc.scroll.io',
      description: 'The RPC endpoint URL for the Scroll network. Leave empty to use default endpoints.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The private key for signing transactions. Keep this secure and never share it.',
      hint: 'Required for write operations (sending transactions, deploying contracts, etc.)',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 534352,
      description: 'The chain ID for the network. Auto-populated for known networks.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Scrollscan API Key',
      name: 'explorerApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for Scrollscan explorer. Required for some operations like contract verification.',
    },
    {
      displayName: 'WebSocket Endpoint',
      name: 'wsUrl',
      type: 'string',
      default: '',
      placeholder: 'wss://wss.scroll.io',
      description: 'WebSocket endpoint for real-time event subscriptions. Leave empty to use default.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "mainnet" ? "https://rpc.scroll.io" : $credentials.network === "sepolia" ? "https://sepolia-rpc.scroll.io" : $credentials.rpcUrl}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
