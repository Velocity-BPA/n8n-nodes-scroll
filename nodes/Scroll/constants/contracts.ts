/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Scroll Contract Addresses
 *
 * Official Scroll protocol contract addresses for mainnet and testnet.
 * These contracts handle bridging, rollup operations, and messaging.
 */

export interface ContractAddresses {
  // L1 Contracts (Ethereum)
  l1: {
    scrollChain: string;
    l1MessageQueue: string;
    l1ScrollMessenger: string;
    l1GatewayRouter: string;
    l1ETHGateway: string;
    l1StandardERC20Gateway: string;
    l1CustomERC20Gateway: string;
    l1ERC721Gateway: string;
    l1ERC1155Gateway: string;
    l1WETHGateway: string;
    enrolledSequencer: string;
    rollup: string;
    multipleVersionRollupVerifier: string;
  };
  // L2 Contracts (Scroll)
  l2: {
    l2ScrollMessenger: string;
    l2GatewayRouter: string;
    l2ETHGateway: string;
    l2StandardERC20Gateway: string;
    l2CustomERC20Gateway: string;
    l2ERC721Gateway: string;
    l2ERC1155Gateway: string;
    l2WETHGateway: string;
    l2MessageQueue: string;
    l2TxFeeVault: string;
    l1GasPriceOracle: string;
    whitelist: string;
    scrollOwner: string;
  };
  // Utility Contracts
  multicall3: string;
  // Account Abstraction
  entryPoint: string;
}

export const MAINNET_CONTRACTS: ContractAddresses = {
  l1: {
    scrollChain: '0xa13BAF47339d63B743e7Da8741db5456DAc1E556',
    l1MessageQueue: '0x0d7E906BD9cAFa154b048cFa766Cc1E54E39AF9B',
    l1ScrollMessenger: '0x6774Bcbd5ceCeF1336b5300fb5186a12DDD8b367',
    l1GatewayRouter: '0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6',
    l1ETHGateway: '0x7F2b8C31F88B6006c382775eea88297Ec1e3E905',
    l1StandardERC20Gateway: '0xD8A791fE2bE73eb6E6cF1eb0cb3F36adC9B3F8f9',
    l1CustomERC20Gateway: '0xb2b10a289A229415a124EFDeF310C10cb004B6ff',
    l1ERC721Gateway: '0x6260aF48e8948617b8FA17F4e5CEa2571f7EaFCc',
    l1ERC1155Gateway: '0xb94f7F6ABcb811c5Ac709dE14E37590fcCd975B6',
    l1WETHGateway: '0x7AC440cAe8EB6328de4fA621163a792c1EA9D4fE',
    enrolledSequencer: '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0',
    rollup: '0xa13BAF47339d63B743e7Da8741db5456DAc1E556',
    multipleVersionRollupVerifier: '0x4CEA3E866e7c57fD75CB015CA7c3e8b380A16C6e',
  },
  l2: {
    l2ScrollMessenger: '0x781e90f1c8Fc4611c9b7497C3B47F99Ef6969CbC',
    l2GatewayRouter: '0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79',
    l2ETHGateway: '0x6EA73e05AdC79974B931123675ea8F78FfdacDF0',
    l2StandardERC20Gateway: '0xE2b4795039517653c5Ae8C2A9BFdd783b48f447A',
    l2CustomERC20Gateway: '0x64CCBE37c9A82D85A1F2E74649b7A42923067988',
    l2ERC721Gateway: '0x7bC08E1c04fb41d75F1410363F0c5746Eae80571',
    l2ERC1155Gateway: '0x62597Cc19703aF10B58feF87B0d5D29eFE263bcc',
    l2WETHGateway: '0x7003E7B7186f0E6601203b99F7B8DECBfA391cf9',
    l2MessageQueue: '0x5300000000000000000000000000000000000000',
    l2TxFeeVault: '0x5300000000000000000000000000000000000005',
    l1GasPriceOracle: '0x5300000000000000000000000000000000000002',
    whitelist: '0x5300000000000000000000000000000000000003',
    scrollOwner: '0x798576400F7D662961BA15C6b3F3d813447a26a6',
  },
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
};

export const SEPOLIA_CONTRACTS: ContractAddresses = {
  l1: {
    scrollChain: '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0',
    l1MessageQueue: '0xF0B2293F5D834eAe920c6974D50d0D00D815d885',
    l1ScrollMessenger: '0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A',
    l1GatewayRouter: '0x13FBE0D0e5552b8c9c4AE9e2435F38f37355998a',
    l1ETHGateway: '0x8A54A2347Da2562917304141ab67324615e9866d',
    l1StandardERC20Gateway: '0x65D123d6389b900d954677c26327bfc1C3e88A13',
    l1CustomERC20Gateway: '0x31C994F2017E71b82fd4D8118F140c81215bbb37',
    l1ERC721Gateway: '0xEF27f368a5aF9Ae7D03b0F9C27c025a9f18523dc',
    l1ERC1155Gateway: '0xa27f1F2502836613B7C3B898F9350A03398EA55d',
    l1WETHGateway: '0x3dA0BF44814cfC678376b3311838272158211695',
    enrolledSequencer: '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0',
    rollup: '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0',
    multipleVersionRollupVerifier: '0x24E97a68F1E07D5F303d8249a2BFd733865E67Ac',
  },
  l2: {
    l2ScrollMessenger: '0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d',
    l2GatewayRouter: '0x9aD3c5617eCAa556d6E166787A97081907171230',
    l2ETHGateway: '0x91e8ADDFe1358aCa5314c644312d38237fC1101C',
    l2StandardERC20Gateway: '0xaDcA915971A336EA2f5b567e662F5bd74F4e887e',
    l2CustomERC20Gateway: '0x058dec71E53079F9ED053F3a0bBca877F6f3eAcf',
    l2ERC721Gateway: '0xDd8FA4329fBB4b559721d41F1cFF0B537A4E9Aa4',
    l2ERC1155Gateway: '0x102dF6D48002B0A1f4a4F23460380869cAABe463',
    l2WETHGateway: '0xB6c2C4B42eceD72C0C8B0cDB646D87e7A64E9fc6',
    l2MessageQueue: '0x5300000000000000000000000000000000000000',
    l2TxFeeVault: '0x5300000000000000000000000000000000000005',
    l1GasPriceOracle: '0x5300000000000000000000000000000000000002',
    whitelist: '0x5300000000000000000000000000000000000003',
    scrollOwner: '0x798576400F7D662961BA15C6b3F3d813447a26a6',
  },
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
};

/**
 * Get contract addresses for a network
 */
export function getContracts(network: string): ContractAddresses {
  switch (network) {
    case 'mainnet':
      return MAINNET_CONTRACTS;
    case 'sepolia':
      return SEPOLIA_CONTRACTS;
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

/**
 * Common ABIs for protocol contracts
 */
export const ABIS = {
  ERC20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  ERC721: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function setApprovalForAll(address operator, bool approved)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  ],
  ERC1155: [
    'function uri(uint256 id) view returns (string)',
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address account, address operator) view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
    'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
    'event URI(string value, uint256 indexed id)',
  ],
  L1ScrollMessenger: [
    'function sendMessage(address target, uint256 value, bytes message, uint256 gasLimit, address refundAddress) payable',
    'function relayMessageWithProof(address from, address to, uint256 value, uint256 nonce, bytes message, tuple(uint256 batchIndex, bytes merkleProof) proof)',
    'function xDomainMessageSender() view returns (address)',
    'event SentMessage(address indexed sender, address indexed target, uint256 value, uint256 messageNonce, uint256 gasLimit, bytes message)',
    'event RelayedMessage(bytes32 indexed messageHash)',
  ],
  L2ScrollMessenger: [
    'function sendMessage(address target, uint256 value, bytes message, uint256 gasLimit) payable',
    'function relayMessage(address from, address to, uint256 value, uint256 nonce, bytes message)',
    'function xDomainMessageSender() view returns (address)',
    'event SentMessage(address indexed sender, address indexed target, uint256 value, uint256 messageNonce, uint256 gasLimit, bytes message)',
    'event RelayedMessage(bytes32 indexed messageHash)',
  ],
  L1GatewayRouter: [
    'function depositETH(uint256 amount, uint256 gasLimit) payable',
    'function depositERC20(address token, uint256 amount, uint256 gasLimit) payable',
    'function depositERC20(address token, address to, uint256 amount, uint256 gasLimit) payable',
    'function getL2ERC20Address(address l1Token) view returns (address)',
    'event DepositETH(address indexed from, address indexed to, uint256 amount, bytes data)',
    'event DepositERC20(address indexed l1Token, address indexed l2Token, address indexed from, address to, uint256 amount, bytes data)',
  ],
  L2GatewayRouter: [
    'function withdrawETH(uint256 amount, uint256 gasLimit) payable',
    'function withdrawERC20(address token, uint256 amount, uint256 gasLimit) payable',
    'function withdrawERC20(address token, address to, uint256 amount, uint256 gasLimit) payable',
    'function getL1ERC20Address(address l2Token) view returns (address)',
    'event WithdrawETH(address indexed from, address indexed to, uint256 amount, bytes data)',
    'event WithdrawERC20(address indexed l1Token, address indexed l2Token, address indexed from, address to, uint256 amount, bytes data)',
  ],
  L1GasPriceOracle: [
    'function l1BaseFee() view returns (uint256)',
    'function overhead() view returns (uint256)',
    'function scalar() view returns (uint256)',
    'function getL1Fee(bytes data) view returns (uint256)',
    'function getL1GasUsed(bytes data) view returns (uint256)',
  ],
  ScrollChain: [
    'function lastFinalizedBatchIndex() view returns (uint256)',
    'function committedBatches(uint256 batchIndex) view returns (bytes32)',
    'function finalizedStateRoots(uint256 batchIndex) view returns (bytes32)',
    'function isBatchFinalized(uint256 batchIndex) view returns (bool)',
    'function withdrawRoots(uint256 batchIndex) view returns (bytes32)',
    'event CommitBatch(uint256 indexed batchIndex, bytes32 indexed batchHash)',
    'event FinalizeBatch(uint256 indexed batchIndex, bytes32 indexed batchHash, bytes32 stateRoot, bytes32 withdrawRoot)',
  ],
  Multicall3: [
    'function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returnData)',
    'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) returns (tuple(bool success, bytes returnData)[] returnData)',
    'function blockAndAggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
    'function getBlockNumber() view returns (uint256 blockNumber)',
    'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
    'function getEthBalance(address addr) view returns (uint256 balance)',
  ],
};

// Convenience exports for commonly used addresses
export const L1_GAS_PRICE_ORACLE_ADDRESS = '0x5300000000000000000000000000000000000002';

export const L1_GAS_PRICE_ORACLE_ABI = ABIS.L1GasPriceOracle;

export const MULTICALL3_ADDRESS: Record<string, string> = {
  mainnet: MAINNET_CONTRACTS.multicall3,
  sepolia: SEPOLIA_CONTRACTS.multicall3,
};

export const MULTICALL3_ABI = ABIS.Multicall3;

export const ENTRYPOINT_ADDRESS: Record<string, string> = {
  mainnet: MAINNET_CONTRACTS.entryPoint,
  sepolia: SEPOLIA_CONTRACTS.entryPoint,
};
