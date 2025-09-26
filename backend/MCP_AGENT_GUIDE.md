# MCP-Only Agent Usage Guide

## Overview

Your custom agent now relies completely on MCP database query tools for comprehensive blockchain data analysis. This allows the agent to:

1. **Query blockchain databases** using MCP tools for comprehensive on-chain analysis
2. **Analyze token transfers, balances, and activity** across multiple networks
3. **Execute custom SQL queries** for advanced blockchain data insights

## API Usage

### MCP-Only Agent

```bash
POST /agent/mainnet/0x1234.../123/talk
{
  "message": "Analyze the recent USDC transfer activity and show me the top holders",
  "defaultNetwork": "mainnet"
}
```

## Available MCP Tools

### 1. Database Exploration

- `list_databases` - List all available blockchain databases
- `list_tables` - List tables in a specific database
- `describe_table` - Get schema information for a table

### 2. Data Querying

- `query_blockchain_data` - Execute custom SQL queries
- `get_token_transfers` - Get recent token transfers
- `get_token_balances` - Get current token balances
- `analyze_token_activity` - Analyze token activity patterns

## Example Conversations

### Example 1: Database Exploration

```
User: "What databases are available for querying?"

Agent will use: list_databases
Response: Lists all available databases like mainnet:evm-tokens@v1.16.0, etc.
```

### Example 2: Token Transfer Analysis

```
User: "Show me the last 10 USDC transfers on Ethereum"

Agent will use: get_token_transfers
Parameters: {
  database: "mainnet:evm-tokens@v1.16.0",
  token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  limit: 10
}
```

### Example 3: Custom SQL Query

```
User: "Find all addresses that received more than 1M USDC in the last 24 hours"

Agent will use: query_blockchain_data
Query: "SELECT to, SUM(value) as total_received FROM `mainnet:evm-tokens@v1.16.0`.erc20_transfers WHERE contract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' AND timestamp >= now() - INTERVAL 24 HOUR GROUP BY to HAVING total_received > 1000000000 ORDER BY total_received DESC"
```

### Example 4: Balance Analysis

```
User: "What are the top 5 USDC holders?"

Agent will use: get_token_balances
Parameters: {
  database: "mainnet:evm-tokens@v1.16.0",
  token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
}
```

## Popular Databases

- `mainnet:evm-tokens@v1.16.0` - Ethereum ERC20 tokens
- `mainnet:evm-nft-tokens@v0.6.2` - Ethereum NFTs
- `arbitrum-one:evm-tokens@v1.16.0` - Arbitrum tokens
- `polygon:evm-tokens@v1.16.0` - Polygon tokens
- `base:evm-tokens@v1.16.0` - Base tokens
- `optimism:evm-tokens@v1.16.0` - Optimism tokens

## Popular Token Contracts

- USDC: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- USDT: `0xdac17f958d2ee523a2206206994597c13d831ec7`
- WETH: `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`
- DAI: `0x6b175474e89094c44da98b954eedeac495271d0f`

## Security Features

- SQL injection prevention
- Query validation
- Rate limiting (built into MCP server)
- Read-only access to databases

## Error Handling

The agent includes comprehensive error handling for:

- Invalid database names
- Malformed SQL queries
- Network timeouts
- Permission errors
- Data validation failures

## Response Format

MCP tool responses include:

- Query results data
- Execution statistics (bytes read, rows processed, elapsed time)
- Error messages with helpful suggestions
- Tool usage information in the persona preview
