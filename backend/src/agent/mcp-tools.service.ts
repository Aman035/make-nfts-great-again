import { Injectable } from '@nestjs/common';
import { MCPService } from './mcp.service';

@Injectable()
export class MCPToolsService {
  constructor(private readonly mcp: MCPService) {}

  async listDatabases() {
    return this.mcp.listDatabases();
  }

  async listTables(args: { database: string }) {
    return this.mcp.listTables(args.database);
  }

  async describeTable(args: { database: string; table: string }) {
    return this.mcp.describeTable(args.database, args.table);
  }

  async queryBlockchainData(args: {
    query: string;
    database: string;
    limit?: number;
  }) {
    // Validate query for security
    if (!this.mcp.validateQuery(args.query)) {
      throw new Error('Invalid query: potentially dangerous SQL detected');
    }

    // Add limit if not specified
    let query = args.query;
    if (args.limit && !query.toLowerCase().includes('limit')) {
      query += ` LIMIT ${args.limit}`;
    }

    return this.mcp.runQuery(query);
  }

  async getTokenTransfers(args: {
    database: string;
    token_address?: string;
    address?: string;
    limit?: number;
    order_by?: string;
    order_direction?: string;
  }) {
    const limit = args.limit || 10;
    const orderBy = args.order_by || 'block_num';
    const orderDirection = args.order_direction || 'desc';

    let query = `
      SELECT 
        block_num,
        tx_hash,
        timestamp,
        from,
        to,
        contract,
        value
      FROM \`${args.database}\`.erc20_transfers
    `;

    const conditions = [];
    if (args.token_address) {
      conditions.push(`contract = '${args.token_address}'`);
    }
    if (args.address) {
      conditions.push(`(from = '${args.address}' OR to = '${args.address}')`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()} LIMIT ${limit}`;

    return this.mcp.runQuery(query);
  }

  async getTokenBalances(args: {
    database: string;
    address?: string;
    token_address?: string;
    min_balance?: number;
  }) {
    let query = `
      SELECT 
        address,
        contract,
        balance,
        balance_usd
      FROM \`${args.database}\`.balances
    `;

    const conditions = [];
    if (args.address) {
      conditions.push(`address = '${args.address}'`);
    }
    if (args.token_address) {
      conditions.push(`contract = '${args.token_address}'`);
    }
    if (args.min_balance) {
      conditions.push(`balance >= ${args.min_balance}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY balance_usd DESC LIMIT 100`;

    return this.mcp.runQuery(query);
  }

  async analyzeTokenActivity(args: {
    database: string;
    token_address: string;
    time_period?: string;
    metric?: string;
  }) {
    const timePeriod = args.time_period || '24h';
    const metric = args.metric || 'volume';

    // Calculate time filter based on period
    let timeFilter = '';
    switch (timePeriod) {
      case '1h':
        timeFilter = `timestamp >= now() - INTERVAL 1 HOUR`;
        break;
      case '24h':
        timeFilter = `timestamp >= now() - INTERVAL 24 HOUR`;
        break;
      case '7d':
        timeFilter = `timestamp >= now() - INTERVAL 7 DAY`;
        break;
      case '30d':
        timeFilter = `timestamp >= now() - INTERVAL 30 DAY`;
        break;
    }

    let query = '';
    switch (metric) {
      case 'volume':
        query = `
          SELECT 
            COUNT(*) as transfer_count,
            SUM(value) as total_volume,
            COUNT(DISTINCT from) as unique_senders,
            COUNT(DISTINCT to) as unique_recipients
          FROM \`${args.database}\`.erc20_transfers
          WHERE contract = '${args.token_address}' 
          AND ${timeFilter}
        `;
        break;
      case 'transfers':
        query = `
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as transfer_count,
            SUM(value) as daily_volume
          FROM \`${args.database}\`.erc20_transfers
          WHERE contract = '${args.token_address}' 
          AND ${timeFilter}
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
        `;
        break;
      case 'unique_addresses':
        query = `
          SELECT 
            COUNT(DISTINCT from) as unique_senders,
            COUNT(DISTINCT to) as unique_recipients,
            COUNT(DISTINCT CASE WHEN from = to THEN NULL ELSE from END) as unique_addresses
          FROM \`${args.database}\`.erc20_transfers
          WHERE contract = '${args.token_address}' 
          AND ${timeFilter}
        `;
        break;
      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }

    return this.mcp.runQuery(query);
  }

  // Helper method to get popular tokens for easier querying
  getPopularTokens() {
    return this.mcp.getPopularTokenContracts();
  }
}
