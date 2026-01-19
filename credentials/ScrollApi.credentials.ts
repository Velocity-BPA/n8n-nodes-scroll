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
 * Scroll API Credentials
 *
 * Provides API access credentials for Scrollscan, Bridge API, and Subgraph services.
 */
export class ScrollApi implements ICredentialType {
  name = 'scrollApi';
  displayName = 'Scroll API';
  documentationUrl = 'https://docs.scroll.io/';
  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
          description: 'Scroll Mainnet APIs',
        },
        {
          name: 'Sepolia Testnet',
          value: 'sepolia',
          description: 'Scroll Sepolia Testnet APIs',
        },
      ],
      default: 'mainnet',
      description: 'Select the environment for API access',
    },
    {
      displayName: 'Scrollscan API Key',
      name: 'scrollscanApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for Scrollscan explorer API',
      hint: 'Get your API key at https://scrollscan.com/apis',
    },
    {
      displayName: 'Custom Scrollscan Endpoint',
      name: 'scrollscanEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://api.scrollscan.com/api',
      description: 'Custom Scrollscan API endpoint. Leave empty to use default.',
    },
    {
      displayName: 'Bridge API Endpoint',
      name: 'bridgeApiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://mainnet-api-bridge.scroll.io/api',
      description: 'Custom Bridge API endpoint. Leave empty to use default.',
    },
    {
      displayName: 'Subgraph URL',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/scroll-tech/scroll',
      description: 'The Graph subgraph URL for indexed data queries',
    },
    {
      displayName: 'Canvas API Endpoint',
      name: 'canvasApiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://canvas.scroll.cat/api',
      description: 'Scroll Canvas API endpoint for profile and badge data',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "mainnet" ? "https://api.scrollscan.com/api" : "https://api-sepolia.scrollscan.com/api"}}',
      url: '?module=stats&action=ethprice&apikey={{$credentials.scrollscanApiKey}}',
      method: 'GET',
    },
  };
}
