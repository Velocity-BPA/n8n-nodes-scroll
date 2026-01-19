/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { ethers } from 'ethers';

/**
 * Encoding Utility Functions
 * 
 * Provides ABI encoding/decoding and data manipulation functions.
 */

/**
 * Encode function call data
 */
export function encodeFunctionData(
  abi: ethers.InterfaceAbi,
  functionName: string,
  args: unknown[]
): string {
  const iface = new ethers.Interface(abi);
  return iface.encodeFunctionData(functionName, args);
}

/**
 * Decode function result
 */
export function decodeFunctionResult(
  abi: ethers.InterfaceAbi,
  functionName: string,
  data: string
): ethers.Result {
  const iface = new ethers.Interface(abi);
  return iface.decodeFunctionResult(functionName, data);
}

/**
 * Encode constructor arguments
 */
export function encodeConstructorArgs(
  abi: ethers.InterfaceAbi,
  args: unknown[]
): string {
  const iface = new ethers.Interface(abi);
  const deployFragment = iface.deploy;
  if (!deployFragment) throw new Error('No constructor in ABI');
  return iface.encodeDeploy(args);
}

/**
 * Decode event log
 */
export function decodeEventLog(
  abi: ethers.InterfaceAbi,
  eventName: string,
  data: string,
  topics: string[]
): ethers.Result {
  const iface = new ethers.Interface(abi);
  return iface.decodeEventLog(eventName, data, topics);
}

/**
 * Get event topic hash
 */
export function getEventTopic(
  abi: ethers.InterfaceAbi,
  eventName: string
): string {
  const iface = new ethers.Interface(abi);
  const event = iface.getEvent(eventName);
  if (!event) throw new Error(`Event ${eventName} not found`);
  return event.topicHash;
}

/**
 * Encode packed data
 */
export function encodePacked(types: string[], values: unknown[]): string {
  return ethers.solidityPacked(types, values);
}

/**
 * Keccak256 hash
 */
export function keccak256(data: string | Uint8Array): string {
  return ethers.keccak256(data);
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  return ethers.getBytes(hex);
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return ethers.hexlify(bytes);
}

/**
 * Zero-pad value to 32 bytes
 */
export function zeroPad(value: string, length = 32): string {
  return ethers.zeroPadValue(value, length);
}

/**
 * Parse units (e.g., ETH to Wei)
 */
export function parseUnits(value: string, decimals: number | string = 18): bigint {
  return ethers.parseUnits(value, decimals);
}

/**
 * Format units (e.g., Wei to ETH)
 */
export function formatUnits(value: bigint | string, decimals: number | string = 18): string {
  return ethers.formatUnits(value, decimals);
}

/**
 * Check if string is valid hex
 */
export function isHexString(value: string, length?: number): boolean {
  return ethers.isHexString(value, length);
}

/**
 * Get function selector (first 4 bytes of keccak256 hash)
 */
export function getFunctionSelector(signature: string): string {
  return ethers.id(signature).slice(0, 10);
}
