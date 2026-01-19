# n8n-nodes-scroll

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for interacting with the **Scroll zkEVM Layer 2 blockchain**. This node provides 100+ operations across 19 resource categories for accounts, transactions, tokens, NFTs, smart contracts, bridge operations, batch/rollup status, gas estimation, DeFi protocols, Scroll Canvas identity, and more.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **19 Resource Categories** with 100+ operations
- **Scroll Trigger Node** with 11 event types for workflow automation
- **Full EVM Compatibility** - Works with all Ethereum-compatible tools
- **Bridge Operations** - L1↔L2 deposit and withdrawal support
- **zkEVM Features** - Batch status, rollup info, ZK proof fees
- **Scroll Canvas** - Identity profiles and badge attestations
- **Account Abstraction** - ERC-4337 smart account support
- **DeFi Integration** - DEX, lending, and liquidity pool operations

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-scroll`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-scroll
```

### Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-scroll.zip
cd n8n-nodes-scroll

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
# For Linux/macOS:
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-scroll

# For Windows (run as Administrator):
# mklink /D %USERPROFILE%\.n8n\custom\n8n-nodes-scroll %CD%

# 5. Restart n8n
n8n start
```

## Credentials Setup

### Scroll Network Credentials (Required)

| Field | Description |
|-------|-------------|
| Network | Select mainnet, sepolia, or custom |
| RPC URL | Custom RPC endpoint (optional) |
| Private Key | For signing transactions (optional for read operations) |
| Chain ID | Custom chain ID for custom networks |

### Scroll API Credentials (Optional)

| Field | Description |
|-------|-------------|
| Scrollscan API Key | For enhanced block explorer features |
| Subgraph URL | For GraphQL queries |

## Resources & Operations

| Resource | Operations |
|----------|------------|
| **Account** | Get Balance, Get Token Balances, Get Transaction Count, Get Transaction History, Get Internal Transactions, Get Token Transfers, Get NFT Holdings, Get Account Info, Estimate Gas |
| **Transaction** | Send ETH, Send Transaction, Sign Transaction, Get Transaction, Get Receipt, Get Status, Wait for Confirmation, Estimate Gas, Get Gas Price, Cancel/Speed Up |
| **Token** | Get Token Info, Get Balance, Get Allowance, Transfer, Approve, Transfer From, Get Total Supply, Get Metadata, Get Holders, Get Transfers |
| **NFT** | Get NFT, Get Metadata, Get NFTs by Owner, Get Collection, Transfer NFT, Approve NFT, Get Transfers, Get Collection Stats |
| **Contract** | Call Contract, Execute Contract, Deploy Contract, Encode Function Data, Decode Result, Estimate Gas, Get ABI, Get Source, Get Events, Verify Contract |
| **Block** | Get Latest Block, Get Block by Number/Hash, Get Finalized/Safe Block, Get Block Transactions, Get Block Receipts |
| **Event** | Get Logs, Get Events by Contract/Topic, Filter Events, Get Event History, Decode Event |
| **Bridge** | Withdraw ETH, Get Deposit/Withdrawal Status, Get Bridge Fee, Estimate Bridge Time |
| **Batch** | Get Latest Batch, Get Batch Status, Get Pending Batches |
| **Rollup** | Get Rollup Info, Get L1 Info, Get Rollup Stats |
| **Gas** | Get Gas Price, Get Max Fee, Get Priority Fee, Estimate Gas, Get L1 Data Fee, Get Total Fee Estimate, Get Gas Oracle, Calculate ZK Proof Fee |
| **DeFi** | Get DEX Prices, Get Liquidity Pools, Execute Swap, Add/Remove Liquidity, Get Yield Farms, Get TVL Stats, Get Protocol Stats, Get Lending Markets |
| **Session Keys** | Create Session Key, Get Session Key, Revoke Session Key, Get Permissions, Execute with Session |
| **Account Abstraction** | Deploy Smart Account, Get Smart Account, Execute User Operation, Estimate UserOp Gas, Get Paymaster Info |
| **Multicall** | Create Multicall, Execute Multicall, Batch Read/Write Calls |
| **Canvas** | Get Profile, Get Badges, Get Badge, Get Canvas Stats |
| **Analytics** | Get Network Stats, Get TPS, Get Gas Stats |
| **Subgraph** | Query Subgraph, Get Indexed Data, Custom GraphQL Query |
| **Utility** | Get Chain ID, Get Network Info, Validate Address, Convert Units, Encode/Decode ABI, Test Connection |

## Trigger Node

The **Scroll Trigger** node supports polling for:

- New blocks
- Finalized blocks
- Transaction confirmations
- Token transfers (ERC-20)
- NFT transfers (ERC-721/1155)
- Contract events
- Address activity
- Bridge deposits/withdrawals
- Large transactions
- Canvas badge minting

## Usage Examples

### Get Account Balance

```json
{
  "resource": "account",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

### Send ETH Transaction

```json
{
  "resource": "transaction",
  "operation": "sendETH",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f...",
  "amount": "0.1"
}
```

### Query Scroll Canvas Profile

```json
{
  "resource": "canvas",
  "operation": "getProfile",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

## Scroll zkEVM Concepts

**Scroll** is a zkEVM-based Layer 2 scaling solution for Ethereum that uses zero-knowledge proofs to achieve:

- **Low transaction costs**: ~10-100x cheaper than Ethereum mainnet
- **Fast confirmations**: ~3 second block times
- **Ethereum compatibility**: Full EVM equivalence
- **Security**: Inherits Ethereum's security through ZK proofs

### Key Concepts

| Term | Description |
|------|-------------|
| L1 (Layer 1) | Ethereum mainnet where ZK proofs are verified |
| L2 (Layer 2) | Scroll network where transactions execute |
| Batches | Groups of L2 transactions committed to L1 |
| Finalization | ZK proof verification on L1 (~10-20 minutes) |
| Bridge | Cross-chain asset transfers between L1 and L2 |

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 534352 | https://rpc.scroll.io |
| Sepolia | 534351 | https://sepolia-rpc.scroll.io |

## Error Handling

The node includes comprehensive error handling:

- Network connection errors
- Invalid address formats
- Insufficient funds detection
- Transaction revert reasons
- Rate limiting recovery

## Security Best Practices

1. **Never commit private keys** - Use environment variables or n8n credentials
2. **Use testnets first** - Test on Sepolia before mainnet
3. **Verify addresses** - Double-check recipient addresses
4. **Set gas limits** - Prevent unexpected high gas costs
5. **Monitor transactions** - Use triggers for confirmation tracking

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Documentation**: [Scroll Docs](https://docs.scroll.io)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-scroll/issues)
- **Commercial Support**: licensing@velobpa.com

## Acknowledgments

- [Scroll](https://scroll.io) - zkEVM Layer 2 blockchain
- [n8n](https://n8n.io) - Workflow automation platform
- [ethers.js](https://ethers.org) - Ethereum library
