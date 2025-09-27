import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { getChainConfig } from './chain-config';

export interface GraphMCPDatabase {
  name: string;
  description: string;
}

export interface GraphMCPTable {
  name: string;
  description: string;
}

export interface GraphMCPColumn {
  name: string;
  type: string;
  comment?: string;
}

export interface GraphMCPQueryResult {
  data: any[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

export interface GraphMCPTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  total_supply?: string;
  price_usd?: number;
  market_cap_usd?: number;
}

export interface GraphMCPTokenBalance {
  address: string;
  token_address: string;
  balance: string;
  balance_usd?: number;
  token_info?: GraphMCPTokenInfo;
}

export interface GraphMCPTokenTransfer {
  from_address: string;
  to_address: string;
  token_address: string;
  amount: string;
  transaction_hash: string;
  block_number: number;
  timestamp: number;
  token_info?: GraphMCPTokenInfo;
}

@Injectable()
export class GraphMCPService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(GraphMCPService.name);
  private mcpProcess: ChildProcess | null = null;
  private isConnected = false;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: Function; reject: Function }
  >();
  private responseBuffer = '';

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.initializeMCP();
  }

  private async initializeMCP() {
    try {
      // Check if MCP access token is provided
      if (!process.env.MCP_ACCESS_TOKEN) {
        this.logger.warn(
          'MCP_ACCESS_TOKEN not provided. Graph MCP functionality will be limited.',
        );
        return;
      }

      this.logger.log('Initializing Graph MCP client...');

      // Initialize MCP connection to The Graph Token API
      this.mcpProcess = spawn(
        'npx',
        ['@pinax/mcp', '--sse-url', 'https://token-api.mcp.thegraph.com/sse'],
        {
          env: {
            ...process.env,
            ACCESS_TOKEN: process.env.MCP_ACCESS_TOKEN,
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      this.mcpProcess.stdout?.on('data', (data) => {
        this.handleMCPResponse(data.toString());
      });

      this.mcpProcess.stderr?.on('data', (data) => {
        this.logger.warn(`MCP stderr: ${data}`);
      });

      this.mcpProcess.on('close', (code) => {
        this.logger.log(`MCP process exited with code ${code}`);
        this.isConnected = false;
      });

      this.mcpProcess.on('error', (error) => {
        this.logger.error('MCP process error:', error);
        this.isConnected = false;
      });

      // Wait a bit for the connection to establish
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Initialize MCP connection
      try {
        // First, set as connected so we can send the initialize request
        this.isConnected = true;

        await this.sendMCPRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          clientInfo: {
            name: 'graph-mcp-client',
            version: '1.0.0',
          },
        });

        this.logger.log('Graph MCP client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize MCP connection:', error);
        this.isConnected = false;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Graph MCP client:', error);
    }
  }

  /**
   * Handle MCP protocol responses
   */
  private handleMCPResponse(data: string) {
    try {
      // Add new data to buffer
      this.responseBuffer += data;

      // Process complete JSON objects (separated by newlines)
      const lines = this.responseBuffer.split('\n');

      // Keep the last line in buffer (might be incomplete)
      this.responseBuffer = lines.pop() || '';

      // Process complete lines
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            this.logger.debug(`MCP Response: ${JSON.stringify(response)}`);

            if (response.id && this.pendingRequests.has(response.id)) {
              const { resolve, reject } = this.pendingRequests.get(
                response.id,
              )!;
              this.pendingRequests.delete(response.id);

              if (response.error) {
                reject(
                  new Error(response.error.message || 'MCP request failed'),
                );
              } else {
                resolve(response.result);
              }
            }
          } catch (parseError) {
            this.logger.warn(`Failed to parse MCP response line: ${line}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling MCP response:', error);
    }
  }

  /**
   * Send MCP request and wait for response
   */
  private async sendMCPRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('MCP client is not ready'));
        return;
      }

      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP request timeout'));
        }
      }, 60000); // 60 second timeout for large responses

      this.mcpProcess?.stdin?.write(JSON.stringify(request) + '\n');
      this.logger.debug(`MCP Request: ${JSON.stringify(request)}`);
    });
  }

  /**
   * Check if the MCP client is connected and ready
   */
  isReady(): boolean {
    return this.isConnected && this.mcpProcess !== null;
  }

  /**
   * List available databases from The Graph Token API
   */
  async listDatabases(): Promise<any[]> {
    try {
      if (!this.isReady()) {
        throw new Error('Graph MCP client is not ready');
      }

      const result = await this.sendMCPRequest('tools/call', {
        name: 'list_databases',
        arguments: {},
      });

      this.logger.log('Available databases:', result);
      return result || [];
    } catch (error) {
      this.logger.error('Error listing databases:', error);
      return [];
    }
  }

  /**
   * List tables for a specific database
   */
  async listTables(database: string): Promise<any[]> {
    try {
      if (!this.isReady()) {
        throw new Error('Graph MCP client is not ready');
      }

      const result = await this.sendMCPRequest('tools/call', {
        name: 'list_tables',
        arguments: {
          database: database,
        },
      });

      this.logger.log(`Tables for ${database}:`, result);
      return result || [];
    } catch (error) {
      this.logger.error(`Error listing tables for ${database}:`, error);
      return [];
    }
  }

  /**
   * Describe table schema
   */
  async describeTable(database: string, table: string): Promise<any> {
    try {
      if (!this.isReady()) {
        throw new Error('Graph MCP client is not ready');
      }

      const result = await this.sendMCPRequest('tools/call', {
        name: 'describe_table',
        arguments: {
          database: database,
          table: table,
        },
      });

      this.logger.log(`Schema for ${database}.${table}:`, result);
      return result || null;
    } catch (error) {
      this.logger.error(`Error describing table ${database}.${table}:`, error);
      return null;
    }
  }

  /**
   * Execute SQL query
   */
  async runQuery(query: string): Promise<any> {
    try {
      if (!this.isReady()) {
        throw new Error('Graph MCP client is not ready');
      }

      this.logger.log(`Executing query: ${query}`);

      const result = await this.sendMCPRequest('tools/call', {
        name: 'run_query',
        arguments: {
          query: query,
        },
      });

      // Normalize MCP tool response: many tools return { content: [{ type: 'text', text: '{"data":...}' }] }
      const content = (result as any)?.content;
      if (Array.isArray(content) && content.length > 0) {
        const first = content[0];
        if (first?.type === 'text' && typeof first?.text === 'string') {
          try {
            const parsed = JSON.parse(first.text);
            return parsed;
          } catch {
            // If not JSON, return the raw text
            return first.text;
          }
        }
        // If content exists but not text, return content as-is
        return content;
      }

      return result || null;
    } catch (error) {
      this.logger.error(`Error executing query:`, error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; ready: boolean } {
    return {
      connected: this.mcpProcess !== null,
      ready: this.isReady(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.isConnected = false;
      this.logger.log('Graph MCP client cleaned up');
    }
  }
}

// New high-level query helpers built on top of MCP tools
export interface NFTDetailsResult {
  contract: string;
  tokenId: string;
  owner?: string;
  tokenUri?: string;
  metadata?: {
    type?: string;
    name?: string;
    description?: string;
    media_uri?: string;
    attributes?: string;
    metadata_json?: string;
  } | null;
  recentTransfers?: any[];
}

export interface EthBalanceResult {
  address: string;
  balanceEth: number;
  lastUpdated?: string;
}

export interface Erc20BalanceRow {
  contract: string;
  balance_raw: string;
  balance_18dec: number;
  last_updated?: string;
}

export interface AddressLastTxResult {
  block_num: number;
  tx_hash: string;
  contract: string;
  from_address: string;
  to_address: string;
  value: string;
  timestamp: string;
}

export interface AddressNftsOwnedResult {
  erc721: Array<{ contract: string; token_id: string }>;
  erc1155: Array<{ contract: string; token_id: string; balance: string }>;
}

export class GraphMCPHighLevelQueriesMixin {
  // This mixin relies on methods from GraphMCPService via declaration merging
}

// Augment GraphMCPService with high-level convenience methods
export interface GraphMCPService {
  getNFTDetails(
    contract: string,
    tokenId: string | number,
    chain?: string,
  ): Promise<NFTDetailsResult>;
  getNFTTransferHistory(
    contract: string,
    tokenId: string | number,
    chain?: string,
    limit?: number,
  ): Promise<any>;
  getEthBalance(address: string, chain?: string): Promise<EthBalanceResult>;
  getERC20Balances(address: string, chain?: string): Promise<Erc20BalanceRow[]>;
  getNFTsOwned(
    address: string,
    chain?: string,
  ): Promise<AddressNftsOwnedResult>;
  getUserSummary(
    address: string,
    chain?: string,
  ): Promise<{
    address: string;
    ethBalance?: EthBalanceResult;
    erc20Balances?: Erc20BalanceRow[];
    nftCounts?: { erc721: number; erc1155: number };
  }>;
}

GraphMCPService.prototype.getNFTDetails = async function (
  this: GraphMCPService,
  contract: string,
  tokenId: string | number,
  chain: string = 'mainnet',
): Promise<NFTDetailsResult> {
  const contractLower = contract.toLowerCase();
  const tokenIdString = String(tokenId);
  const chainConfig = getChainConfig(chain);

  // metadata
  let metadata: NFTDetailsResult['metadata'] = null;
  try {
    const metaRes = await this.runQuery(
      `SELECT type, name, description, media_uri, attributes, metadata_json
       FROM \`${chainConfig.nftDatabase}\`.nft_metadata
       WHERE contract = '${contractLower}' AND token_id = ${tokenIdString}
       LIMIT 1`,
    );
    if (metaRes?.data?.length) {
      const row = metaRes.data[0];
      metadata = {
        type: row.type,
        name: row.name,
        description: row.description,
        media_uri: row.media_uri,
        attributes: row.attributes,
        metadata_json: row.metadata_json,
      };
    }
  } catch (e) {}

  // token URI
  let tokenUri: string | undefined;
  try {
    const uriRes = await this.runQuery(
      `SELECT uri
       FROM \`${chainConfig.nftDatabase}\`.erc721_metadata_by_token
       WHERE contract = '${contractLower}' AND token_id = ${tokenIdString}
       ORDER BY timestamp DESC
       LIMIT 1`,
    );
    if (uriRes?.data?.length) {
      tokenUri = uriRes.data[0].uri;
    }
  } catch (e) {}

  // owner
  let owner: string | undefined;
  try {
    const ownerRes = await this.runQuery(
      `SELECT owner
       FROM \`${chainConfig.nftDatabase}\`.erc721_owners
       WHERE contract = '${contractLower}' AND token_id = ${tokenIdString}
       LIMIT 1`,
    );
    if (ownerRes?.data?.length) {
      owner = ownerRes.data[0].owner;
    }
  } catch (e) {}

  // recent transfers
  let recentTransfers: any[] = [];
  try {
    const txRes = await this.runQuery(
      `SELECT \`from\` AS from_address, \`to\` AS to_address, tx_hash, block_num, timestamp
       FROM \`${chainConfig.nftDatabase}\`.erc721_transfers
       WHERE contract = '${contractLower}' AND token_id = ${tokenIdString}
       ORDER BY timestamp DESC
       LIMIT 10`,
    );
    recentTransfers = txRes?.data || [];
  } catch (e) {}

  return {
    contract: contractLower,
    tokenId: tokenIdString,
    owner,
    tokenUri,
    metadata,
    recentTransfers,
  };
};

GraphMCPService.prototype.getNFTTransferHistory = async function (
  this: GraphMCPService,
  contract: string,
  tokenId: string | number,
  chain: string = 'mainnet',
  limit: number = 10,
): Promise<any> {
  const contractLower = contract.toLowerCase();
  const tokenIdString = String(tokenId);
  const chainConfig = getChainConfig(chain);

  try {
    const transferHistory = await this.runQuery(
      `SELECT \`from\` AS from_address, \`to\` AS to_address, tx_hash, block_num, timestamp
       FROM \`${chainConfig.nftDatabase}\`.erc721_transfers
       WHERE contract = '${contractLower}' AND token_id = ${tokenIdString}
       ORDER BY timestamp DESC
       LIMIT ${limit}`,
    );
    return transferHistory;
  } catch (error) {
    console.error(
      `Error getting NFT transfer history for ${contract}:${tokenId}:`,
      error,
    );
    return { data: [], error: 'Failed to fetch transfer history' };
  }
};

GraphMCPService.prototype.getEthBalance = async function (
  this: GraphMCPService,
  address: string,
  chain: string = 'mainnet',
): Promise<EthBalanceResult> {
  const chainConfig = getChainConfig(chain);
  const addressLower = address.toLowerCase();
  const res = await this.runQuery(
    `SELECT 
       balance AS eth_balance,
       timestamp AS last_updated
     FROM \`${chainConfig.tokenDatabase}\`.mv_native_balances
     WHERE address = '${addressLower}'
       AND contract = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
     ORDER BY timestamp DESC
     LIMIT 1`,
  );
  const row = res?.data?.[0] || { eth_balance: 0, last_updated: null };
  return {
    address,
    balanceEth: Number(row.eth_balance || 0),
    lastUpdated: row.last_updated || undefined,
  };
};

GraphMCPService.prototype.getERC20Balances = async function (
  this: GraphMCPService,
  address: string,
  chain: string = 'mainnet',
): Promise<Erc20BalanceRow[]> {
  const addressLower = address.toLowerCase();
  const chainConfig = getChainConfig(chain);
  const res = await this.runQuery(
    `SELECT 
       contract,
       argMax(balance, timestamp) AS balance_raw,
       CAST(argMax(balance, timestamp) AS Float64) / 1e18 AS balance_18dec,
       argMax(timestamp, timestamp) AS last_updated
     FROM \`${chainConfig.tokenDatabase}\`.balances
     WHERE lower(address) = '${addressLower}'
       AND contract != '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
     GROUP BY contract
     HAVING balance_raw > 0
     ORDER BY balance_18dec DESC
     LIMIT 500`,
  );
  return (res?.data || []).map((r: any) => ({
    contract: r.contract,
    balance_raw: String(r.balance_raw),
    balance_18dec: Number(r.balance_18dec || 0),
    last_updated: r.last_updated,
  }));
};

GraphMCPService.prototype.getNFTsOwned = async function (
  this: GraphMCPService,
  address: string,
  chain: string = 'mainnet',
): Promise<AddressNftsOwnedResult> {
  const addressLower = address.toLowerCase();
  const chainConfig = getChainConfig(chain);
  const [erc721Res, erc1155Res] = await Promise.all([
    this.runQuery(
      `SELECT contract, token_id
       FROM \`${chainConfig.nftDatabase}\`.erc721_owners
       WHERE lower(owner) = '${addressLower}'
       LIMIT 1000`,
    ),
    this.runQuery(
      `SELECT contract, token_id, balance
       FROM \`${chainConfig.nftDatabase}\`.erc1155_balances
       WHERE lower(owner) = '${addressLower}' AND balance > 0
       LIMIT 1000`,
    ),
  ]);

  return {
    erc721: (erc721Res?.data || []).map((r: any) => ({
      contract: r.contract,
      token_id: String(r.token_id),
    })),
    erc1155: (erc1155Res?.data || []).map((r: any) => ({
      contract: r.contract,
      token_id: String(r.token_id),
      balance: String(r.balance),
    })),
  };
};

GraphMCPService.prototype.getUserSummary = async function (
  this: GraphMCPService,
  address: string,
  chain: string = 'mainnet',
): Promise<{
  address: string;
  ethBalance?: EthBalanceResult;
  erc20Balances?: Erc20BalanceRow[];
  nftCounts?: { erc721: number; erc1155: number };
}> {
  const [ethBalance, erc20Balances, nftsOwned] = await Promise.all([
    this.getEthBalance(address, chain).catch(
      () => ({ address, balanceEth: 0 }) as EthBalanceResult,
    ),
    this.getERC20Balances(address, chain).catch(() => [] as Erc20BalanceRow[]),
    this.getNFTsOwned(address, chain).catch(() => ({
      erc721: [],
      erc1155: [],
    })),
  ]);

  return {
    address,
    ethBalance,
    erc20Balances,
    nftCounts: {
      erc721: nftsOwned.erc721.length,
      erc1155: nftsOwned.erc1155.length,
    },
  };
};
