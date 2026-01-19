/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { isValidAddress, toChecksumAddress, isContract } from '../../nodes/Scroll/utils/addressUtils';

describe('Address Utils', () => {
  describe('isValidAddress', () => {
    it('should return true for valid lowercase address', () => {
      expect(isValidAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e')).toBe(true);
    });

    it('should return true for valid checksum address', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(isValidAddress('0xinvalid')).toBe(false);
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });

    it('should return false for address with wrong length', () => {
      expect(isValidAddress('0x742d35cc6634c0532925a3b844bc454e4438f44')).toBe(false);
      expect(isValidAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e00')).toBe(false);
    });
  });

  describe('toChecksumAddress', () => {
    it('should convert lowercase address to checksum format', () => {
      const lowercase = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
      const result = toChecksumAddress(lowercase);
      expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should handle already checksummed addresses', () => {
      const checksummed = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const result = toChecksumAddress(checksummed);
      expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  describe('isContract', () => {
    it('should be a function', () => {
      expect(typeof isContract).toBe('function');
    });
  });
});
