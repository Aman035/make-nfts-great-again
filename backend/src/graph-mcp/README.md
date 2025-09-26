# Graph MCP Client Module

This module provides a client interface to The Graph's Token API MCP server, enabling access to on-chain token data through SQL queries.

## Features

- **Real MCP Protocol**: Full implementation of Model Context Protocol client
- **Database Discovery**: List available databases and networks
- **Table Discovery**: List tables for specific databases
- **Schema Discovery**: Get table schemas and column information
- **SQL Queries**: Execute ClickHouse SQL queries on blockchain data
- **Multi-Chain Support**: Access data from multiple blockchain networks

## Configuration

The module requires the `MCP_ACCESS_TOKEN` environment variable to be set with your JWT token from thegraph.market.

## API Endpoints

### Status

- `GET /graph-mcp/status` - Get connection status

### Database Discovery

- `GET /graph-mcp/databases` - List available databases
- `GET /graph-mcp/databases/:database/tables` - List tables for a database
- `GET /graph-mcp/databases/:database/tables/:table/schema` - Get table schema

### Query Execution

- `POST /graph-mcp/query` - Execute SQL query

## Usage in Agent Service

```typescript
import { GraphMCPService } from '../graph-mcp/graph-mcp.service';

@Injectable()
export class AgentService {
  constructor(private readonly graphMCPService: GraphMCPService) {}

  async analyzeToken(tokenAddress: string) {
    // 1. List available databases
    const databases = await this.graphMCPService.listDatabases();

    // 2. Get tables for mainnet tokens database
    const tables = await this.graphMCPService.listTables(
      'mainnet:evm-tokens@v1.16.0',
    );

    // 3. Get schema for erc20_transfers table
    const schema = await this.graphMCPService.describeTable(
      'mainnet:evm-tokens@v1.16.0',
      'erc20_transfers',
    );

    // 4. Query token transfers
    const query = `
      SELECT * FROM \`mainnet:evm-tokens@v1.16.0\`.erc20_transfers 
      WHERE contract = '${tokenAddress.toLowerCase()}' 
      LIMIT 10
    `;
    const result = await this.graphMCPService.runQuery(query);

    return result;
  }
}
```

## Integration with Agent Module

To use this service in your agent module, import the GraphMCPModule:

```typescript
import { GraphMCPModule } from '../graph-mcp/graph-mcp.module';

@Module({
  imports: [GraphMCPModule],
  // ... other module configuration
})
export class AgentModule {}
```

## Available MCP Tools

The Graph Token API MCP server provides these 4 main tools:

1. **`list_databases`** - Discover available networks and databases
2. **`list_tables`** - Discover tables for a specific database
3. **`describe_table`** - Get table schema with fields and column types
4. **`run_query`** - Execute read-only SQL queries using ClickHouse syntax

## Database Naming Convention

Databases follow the pattern: `{network}:{database_name}@{version}`

Examples:

- `mainnet:evm-tokens@v1.16.0` - Ethereum mainnet tokens
- `mainnet:evm-nft-tokens@v0.6.2` - Ethereum mainnet NFTs
- `arbitrum-one:evm-tokens@v1.16.0` - Arbitrum One tokens
- `polygon:evm-tokens@v1.16.0` - Polygon tokens

## Query Tips

- Always get table schema first before constructing queries
- Use LIMIT clauses to test queries with sample data
- Use backticks for database names: `SELECT * FROM \`database\`.table`
- Token addresses are the only reliable identifiers (not names/symbols)
- Use FINAL keyword to avoid duplicates but beware of performance cost
- Avoid functions on column names in filters to use indexes efficiently

## Example Queries

### Get Token Transfers

```sql
SELECT * FROM `mainnet:evm-tokens@v1.16.0`.erc20_transfers
WHERE contract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
LIMIT 10
```

### Get Wallet Balances

```sql
SELECT * FROM `mainnet:evm-tokens@v1.16.0`.balances
WHERE address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
AND CAST(balance AS DECIMAL) > 0
LIMIT 100
```

### Get Token Holders

```sql
SELECT address, balance FROM `mainnet:evm-tokens@v1.16.0`.balances
WHERE contract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
ORDER BY CAST(balance AS DECIMAL) DESC
LIMIT 10
```

## Error Handling

The service includes comprehensive error handling and logging. All methods return null or empty arrays on failure, and errors are logged for debugging.

## Future Enhancements

- Caching for frequently accessed data
- Query optimization suggestions
- Advanced analytics functions
- Integration with more Graph databases
