/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { SCROLL_NETWORKS } from '../../nodes/Scroll/constants/networks';
import { MAINNET_TOKENS, SEPOLIA_TOKENS } from '../../nodes/Scroll/constants/tokens';
import { getContracts } from '../../nodes/Scroll/constants/contracts';

describe('Constants', () => {
  describe('Networks', () => {
    it('should have mainnet configuration', () => {
      expect(SCROLL_NETWORKS.mainnet).toBeDefined();
      expect(SCROLL_NETWORKS.mainnet.chainId).toBe(534352);
      expect(SCROLL_NETWORKS.mainnet.name).toBe('Scroll Mainnet');
    });

    it('should have sepolia configuration', () => {
      expect(SCROLL_NETWORKS.sepolia).toBeDefined();
      expect(SCROLL_NETWORKS.sepolia.chainId).toBe(534351);
      expect(SCROLL_NETWORKS.sepolia.name).toBe('Scroll Sepolia');
    });

    it('should have both networks defined', () => {
      expect(Object.keys(SCROLL_NETWORKS)).toContain('mainnet');
      expect(Object.keys(SCROLL_NETWORKS)).toContain('sepolia');
    });
  });

  describe('Tokens', () => {
    it('should have mainnet tokens defined', () => {
      expect(MAINNET_TOKENS).toBeDefined();
      expect(Object.keys(MAINNET_TOKENS).length).toBeGreaterThan(0);
    });

    it('should have sepolia tokens defined', () => {
      expect(SEPOLIA_TOKENS).toBeDefined();
    });

    it('should have ETH token in mainnet', () => {
      expect(MAINNET_TOKENS.ETH || MAINNET_TOKENS.WETH).toBeDefined();
    });
  });

  describe('Contracts', () => {
    it('should return mainnet contracts', () => {
      const contracts = getContracts('mainnet');
      expect(contracts).toBeDefined();
      expect(contracts.l1).toBeDefined();
      expect(contracts.l2).toBeDefined();
    });

    it('should return sepolia contracts', () => {
      const contracts = getContracts('sepolia');
      expect(contracts).toBeDefined();
      expect(contracts.l1).toBeDefined();
      expect(contracts.l2).toBeDefined();
    });
  });
});
