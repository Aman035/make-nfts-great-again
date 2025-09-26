import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

export interface MCPDatabase {
  name: string;
  description: string;
}

export interface MCPTable {
  name: string;
  description: string;
}

export interface MCPColumn {
  name: string;
  type: string;
  comment?: string;
}

export interface MCPQueryResult {
  data: any[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

@Injectable()
export class MCPService {
  private readonly logger = new Logger(MCPService.name);
  private mcpProcess: any = null;

  constructor() {
    this.initializeMCP();
  }

  private async initializeMCP() {
    try {
      // Initialize MCP connection using the same config as your mcp.json
      this.mcpProcess = spawn(
        'npx',
        ['@pinax/mcp', '--sse-url', 'https://token-api.mcp.thegraph.com/sse'],
        {
          env: {
            ...process.env,
            ACCESS_TOKEN:
              'eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQ0NDIyNDksImp0aSI6ImIwYjc2Nzc2LTgzNWYtNGUyZi1iNTljLTg0NWZjYTdlZWFlNiIsImlhdCI6MTc1ODQ0MjI0OSwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwdm9qZWQxMjk1OWM0ODA3MjdkNzgiLCJ2IjoyLCJha2kiOiJkZjRhYTkzODI2YmNhOWM4YjliYmRjNTg4NjE3YmRiYmVhNmQwYWVjMGUxNzIzMTRlNjQ1NjA1MzY4YmE2ZjYxIiwidWlkIjoiMHZvamVkMTI5NTljNDgwNzI3ZDc4Iiwic3Vic3RyZWFtc19wbGFuX3RpZXIiOiJGUkVFIiwiY2ZnIjp7IlNVQlNUUkVBTVNfTUFYX1JFUVVFU1RTIjoiMiIsIlNVQlNUUkVBTVNfUEFSQUxMRUxfSk9CUyI6IjUiLCJTVUJTVFJFQU1TX1BBUkFMTEVMX1dPUktFUlMiOiI1In19.tkBY9uSazr-nc5u97NGAqYc4ye03Uds1cjfPd_-OCgvvx4H5tkgoGXegkVrziCUK-Cztelpm5ZPXHkmDJuhZQQ',
          },
        },
      );

      this.logger.log('MCP service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP service:', error);
    }
  }

  async listDatabases(): Promise<MCPDatabase[]> {
    try {
      // This would typically be done through MCP protocol
      // For now, returning the databases we know are available
      return [
        {
          name: 'mainnet:evm-tokens@v1.16.0',
          description:
            'Latest Ethereum mainnet token database with comprehensive ERC20 transfers, ETH native transactions, balances, and metadata.',
        },
        {
          name: 'mainnet:evm-nft-tokens@v0.6.2',
          description:
            'Latest Ethereum mainnet NFT database with enhanced metadata resolution, spam detection, and advanced marketplace analytics.',
        },
        {
          name: 'arbitrum-one:evm-tokens@v1.16.0',
          description:
            'Latest Arbitrum One token database with comprehensive ERC20 transfers, native ETH transactions, balances, and metadata.',
        },
        {
          name: 'polygon:evm-tokens@v1.16.0',
          description:
            'Latest Polygon token database with comprehensive MATIC staking, ERC20 transfers, bridge activity, and balance data.',
        },
        {
          name: 'base:evm-tokens@v1.16.0',
          description:
            'Latest Base network token database with comprehensive ETH L2 transfers, ERC20 tokens, balances, and gas optimization data.',
        },
        {
          name: 'optimism:evm-tokens@v1.16.0',
          description:
            'Latest Optimism token database with comprehensive OP governance tokens, ETH L2 transfers, and ecosystem incentive data.',
        },
        {
          name: 'avalanche:evm-tokens@v1.16.0',
          description:
            'Latest Avalanche C-Chain token database with AVAX native transfers, ERC20 token activity, balances, and metadata.',
        },
        {
          name: 'bsc:evm-tokens@v1.16.0',
          description:
            'Latest BSC token database with comprehensive BNB native transfers, BEP20 tokens, staking rewards, and balance data.',
        },
      ];
    } catch (error) {
      this.logger.error('Error listing databases:', error);
      throw new Error('Failed to list databases');
    }
  }

  async listTables(database: string): Promise<MCPTable[]> {
    try {
      // Common tables across token databases
      const commonTables = [
        {
          name: 'erc20_transfers',
          description:
            'Complete ERC20 token transfer events with sender, recipient, amount, and transaction context.',
        },
        {
          name: 'erc20_metadata',
          description:
            'Current ERC20 token metadata including names, symbols, decimals, and total supply information.',
        },
        {
          name: 'balances',
          description:
            'Current account balances for all tokens and native tokens across the network.',
        },
        {
          name: 'native_transfers',
          description:
            'Direct native token transfer events between addresses excluding contract interactions and gas fees.',
        },
        {
          name: 'erc20_balance_changes',
          description:
            'Atomic ERC20 balance change events with precise delta tracking for all token transfers.',
        },
        {
          name: 'historical_balances',
          description:
            'Time-series balance data for historical portfolio reconstruction and wealth tracking.',
        },
      ];

      // Add NFT-specific tables for NFT databases
      if (database.includes('nft-tokens')) {
        commonTables.push(
          {
            name: 'nft_transfers',
            description:
              'NFT transfer events including ERC721 and ERC1155 transfers with metadata.',
          },
          {
            name: 'nft_metadata',
            description:
              'NFT metadata including names, descriptions, images, and attributes.',
          },
          {
            name: 'nft_ownership',
            description:
              'Current NFT ownership information with holder addresses and token IDs.',
          },
        );
      }

      return commonTables;
    } catch (error) {
      this.logger.error('Error listing tables:', error);
      throw new Error('Failed to list tables');
    }
  }

  async describeTable(database: string, table: string): Promise<MCPColumn[]> {
    try {
      // Return common column schemas for different table types
      const schemas: Record<string, MCPColumn[]> = {
        erc20_transfers: [
          { name: 'block_num', type: 'UInt32', comment: 'Block number' },
          {
            name: 'tx_hash',
            type: 'FixedString(66)',
            comment: 'Transaction hash',
          },
          {
            name: 'timestamp',
            type: 'DateTime(UTC)',
            comment: 'Block timestamp',
          },
          { name: 'from', type: 'FixedString(42)', comment: 'Sender address' },
          { name: 'to', type: 'FixedString(42)', comment: 'Recipient address' },
          {
            name: 'contract',
            type: 'FixedString(42)',
            comment: 'Token contract address',
          },
          { name: 'value', type: 'UInt256', comment: 'Transfer value' },
        ],
        erc20_metadata: [
          {
            name: 'contract',
            type: 'FixedString(42)',
            comment: 'Token contract address',
          },
          { name: 'name', type: 'String', comment: 'Token name' },
          { name: 'symbol', type: 'String', comment: 'Token symbol' },
          { name: 'decimals', type: 'UInt8', comment: 'Token decimals' },
          {
            name: 'total_supply',
            type: 'UInt256',
            comment: 'Total token supply',
          },
        ],
        balances: [
          {
            name: 'address',
            type: 'FixedString(42)',
            comment: 'Account address',
          },
          {
            name: 'contract',
            type: 'FixedString(42)',
            comment: 'Token contract address',
          },
          { name: 'balance', type: 'UInt256', comment: 'Current balance' },
          { name: 'balance_usd', type: 'Float64', comment: 'Balance in USD' },
        ],
        native_transfers: [
          { name: 'block_num', type: 'UInt32', comment: 'Block number' },
          {
            name: 'tx_hash',
            type: 'FixedString(66)',
            comment: 'Transaction hash',
          },
          {
            name: 'timestamp',
            type: 'DateTime(UTC)',
            comment: 'Block timestamp',
          },
          { name: 'from', type: 'FixedString(42)', comment: 'Sender address' },
          { name: 'to', type: 'FixedString(42)', comment: 'Recipient address' },
          { name: 'value', type: 'UInt256', comment: 'Transfer value' },
        ],
      };

      return schemas[table] || [];
    } catch (error) {
      this.logger.error('Error describing table:', error);
      throw new Error('Failed to describe table');
    }
  }

  async runQuery(query: string): Promise<MCPQueryResult> {
    try {
      // This is a simplified implementation
      // In a real implementation, you'd use the MCP protocol to communicate with the server
      this.logger.log(`Executing query: ${query}`);

      // For demonstration, return a mock result
      // In practice, you'd execute the actual query through MCP
      return {
        data: [
          {
            block_num: 12345678,
            tx_hash: '0x1234567890abcdef...',
            from: '0xabcdef1234567890...',
            to: '0x9876543210fedcba...',
            contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            value: '1000000',
            timestamp: '2024-01-15 10:30:00',
          },
        ],
        statistics: {
          bytes_read: 1024,
          rows_read: 1,
          elapsed: 0.1,
        },
      };
    } catch (error) {
      this.logger.error('Error running query:', error);
      throw new Error('Failed to execute query');
    }
  }

  // Helper method to validate and sanitize queries
  validateQuery(query: string): boolean {
    // Basic SQL injection prevention
    const dangerousPatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /alter\s+table/i,
      /create\s+table/i,
      /truncate/i,
      /--/,
      /\/\*/,
      /union\s+select/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(query));
  }

  // Helper method to get popular token contracts
  getPopularTokenContracts(): Record<string, string> {
    return {
      USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
      AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    };
  }
}
