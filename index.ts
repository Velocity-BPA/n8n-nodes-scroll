/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * n8n-nodes-scroll
 *
 * A comprehensive n8n community node for Scroll zkEVM L2 blockchain.
 * Provides resources for account management, transactions, bridging,
 * smart contracts, DeFi, and zkEVM-specific functionality.
 *
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

export * from './credentials/ScrollNetwork.credentials';
export * from './credentials/ScrollApi.credentials';
export * from './nodes/Scroll/Scroll.node';
export * from './nodes/Scroll/ScrollTrigger.node';
