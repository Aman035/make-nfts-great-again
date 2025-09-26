// src/agent/tools.def.ts
import OpenAI from 'openai';

// MCP Database Query Tools
export const MCPChatToolDefs: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_databases',
      description: 'List all available blockchain databases for querying.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tables',
      description: 'List all tables available in a specific database.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description: 'Database name (e.g., mainnet:evm-tokens@v1.16.0)',
          },
        },
        required: ['database'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'describe_table',
      description: 'Get the schema/columns of a specific table.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description: 'Database name (e.g., mainnet:evm-tokens@v1.16.0)',
          },
          table: {
            type: 'string',
            description: 'Table name (e.g., erc20_transfers)',
          },
        },
        required: ['database', 'table'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_blockchain_data',
      description:
        'Execute SQL queries on blockchain databases to analyze token transfers, balances, and other on-chain data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'SQL query to execute on the blockchain database. Use proper table references like `database_name`.table_name',
          },
          database: {
            type: 'string',
            description:
              'Target database for the query (e.g., mainnet:evm-tokens@v1.16.0)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of rows to return (default: 100)',
          },
        },
        required: ['query', 'database'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_token_transfers',
      description:
        'Get recent token transfers for a specific token or address.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description: 'Database name (e.g., mainnet:evm-tokens@v1.16.0)',
          },
          token_address: {
            type: 'string',
            description: 'Token contract address (optional)',
          },
          address: {
            type: 'string',
            description: 'Wallet address to filter transfers (optional)',
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (default: 10)',
          },
          order_by: {
            type: 'string',
            enum: ['block_num', 'timestamp'],
            description: 'Order by field (default: block_num)',
          },
          order_direction: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Order direction (default: desc)',
          },
        },
        required: ['database'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_token_balances',
      description:
        'Get current token balances for a specific address or token.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description: 'Database name (e.g., mainnet:evm-tokens@v1.16.0)',
          },
          address: {
            type: 'string',
            description: 'Wallet address to get balances for',
          },
          token_address: {
            type: 'string',
            description: 'Specific token contract address (optional)',
          },
          min_balance: {
            type: 'number',
            description: 'Minimum balance threshold (optional)',
          },
        },
        required: ['database'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_token_activity',
      description:
        'Analyze token activity patterns including volume, unique addresses, and trends.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            description: 'Database name (e.g., mainnet:evm-tokens@v1.16.0)',
          },
          token_address: {
            type: 'string',
            description: 'Token contract address',
          },
          time_period: {
            type: 'string',
            enum: ['1h', '24h', '7d', '30d'],
            description: 'Time period for analysis (default: 24h)',
          },
          metric: {
            type: 'string',
            enum: ['volume', 'transfers', 'unique_addresses', 'price_impact'],
            description: 'Metric to analyze (default: volume)',
          },
        },
        required: ['database', 'token_address'],
        additionalProperties: false,
      },
    },
  },
];
