import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { GraphMCPService } from './graph-mcp.service';
import { getSupportedChains } from './chain-config';

@ApiTags('graph-mcp')
@Controller('graph-mcp')
export class GraphMCPController {
  constructor(private readonly graphMCPService: GraphMCPService) {}

  @Get('chains')
  @ApiOperation({
    summary: 'Get supported chains',
    description: 'Get list of supported blockchain networks',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported chains',
    schema: {
      type: 'object',
      properties: {
        chains: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'mainnet',
            'matic',
            'arbitrum-one',
            'optimism',
            'base',
            'bsc',
            'avalanche',
            'unichain',
          ],
        },
      },
    },
  })
  getSupportedChains() {
    return {
      chains: getSupportedChains(),
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get Graph MCP connection status',
    description:
      'Returns the current connection status of the Graph MCP client',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status',
    schema: {
      type: 'object',
      properties: {
        connected: {
          type: 'boolean',
          example: true,
        },
        ready: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  getStatus() {
    return this.graphMCPService.getConnectionStatus();
  }

  @Get('databases')
  @ApiOperation({
    summary: 'List available databases',
    description: 'Returns list of available databases from The Graph Token API',
  })
  @ApiResponse({
    status: 200,
    description: 'Available databases',
    schema: {
      type: 'object',
      properties: {
        databases: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async getDatabases() {
    const databases = await this.graphMCPService.listDatabases();
    return { databases };
  }

  @Get('databases/:database/tables')
  @ApiOperation({
    summary: 'List tables for a database',
    description: 'Returns list of tables available in a specific database',
  })
  @ApiParam({
    name: 'database',
    description: 'Database name',
    example: 'mainnet:evm-tokens@v1.16.0',
  })
  @ApiResponse({
    status: 200,
    description: 'Available tables',
    schema: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async getTables(@Param('database') database: string) {
    const tables = await this.graphMCPService.listTables(database);
    return { tables };
  }

  @Get('databases/:database/tables/:table/schema')
  @ApiOperation({
    summary: 'Get table schema',
    description: 'Returns the schema of a specific table',
  })
  @ApiParam({
    name: 'database',
    description: 'Database name',
    example: 'mainnet:evm-tokens@v1.16.0',
  })
  @ApiParam({
    name: 'table',
    description: 'Table name',
    example: 'erc20_transfers',
  })
  @ApiResponse({
    status: 200,
    description: 'Table schema',
    schema: {
      type: 'object',
      properties: {
        schema: {
          type: 'object',
        },
      },
    },
  })
  async getTableSchema(
    @Param('database') database: string,
    @Param('table') table: string,
  ) {
    const schema = await this.graphMCPService.describeTable(database, table);
    return { schema };
  }

  @Post('query')
  @ApiOperation({
    summary: 'Execute SQL query',
    description: 'Execute a SQL query using ClickHouse syntax',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute (ClickHouse syntax)',
          example:
            'SELECT * FROM `mainnet:evm-tokens@v1.16.0`.erc20_transfers LIMIT 10',
        },
      },
      required: ['query'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Query results',
    schema: {
      type: 'object',
      properties: {
        result: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async executeQuery(@Body() body: { query: string }) {
    const result = await this.graphMCPService.runQuery(body.query);
    return { result };
  }

  @Get(':chain/nft/:contract/:tokenId')
  @ApiOperation({
    summary: 'Get NFT details',
    description:
      'Returns NFT metadata, token URI, owner and recent transfers for an ERC-721 token',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'contract', description: 'ERC-721 contract address' })
  @ApiParam({ name: 'tokenId', description: 'Token ID' })
  @ApiResponse({ status: 200, description: 'NFT details' })
  async getNftDetails(
    @Param('chain') chain: string,
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
  ) {
    const result = await this.graphMCPService.getNFTDetails(
      contract,
      tokenId,
      chain,
    );
    return { result };
  }

  @Get(':chain/address/:address/eth-balance')
  @ApiOperation({
    summary: 'Get ETH balance',
    description:
      'Returns native ETH balance for an address on the specified chain',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'ETH balance' })
  async getEthBalance(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ) {
    const result = await this.graphMCPService.getEthBalance(address, chain);
    return { result };
  }

  @Get(':chain/address/:address/erc20-balances')
  @ApiOperation({
    summary: 'Get ERC-20 balances',
    description:
      'Returns non-zero ERC-20 balances for an address (18-decimal scaled)',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'ERC-20 balances' })
  async getErc20Balances(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ) {
    const result = await this.graphMCPService.getERC20Balances(address, chain);
    return { result };
  }

  @Get(':chain/address/:address/nfts')
  @ApiOperation({
    summary: 'Get NFTs owned',
    description: 'Returns ERC-721 and ERC-1155 tokens owned by an address',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'NFTs owned' })
  async getNftsOwned(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ) {
    const result = await this.graphMCPService.getNFTsOwned(address, chain);
    return { result };
  }

  @Get(':chain/address/:address/summary')
  @ApiOperation({
    summary: 'Get user summary',
    description:
      'Aggregated summary: ETH balance, ERC-20 balances, NFT counts, and last transaction',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'User summary' })
  async getUserSummary(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ) {
    const result = await this.graphMCPService.getUserSummary(address, chain);
    return { result };
  }

  @Get(':chain/nft/:contract/:tokenId/transfers')
  @ApiOperation({
    summary: 'Get NFT transfer history',
    description:
      'Returns transfer history for an ERC-721 token including from/to addresses, transaction hashes, and timestamps',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: [
      'mainnet',
      'matic',
      'arbitrum-one',
      'optimism',
      'base',
      'bsc',
      'avalanche',
      'unichain',
    ],
  })
  @ApiParam({ name: 'contract', description: 'ERC-721 contract address' })
  @ApiParam({ name: 'tokenId', description: 'Token ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of transfers to return',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'NFT transfer history' })
  async getNftTransferHistory(
    @Param('chain') chain: string,
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.graphMCPService.getNFTTransferHistory(
      contract,
      tokenId,
      chain,
      limit || 10,
    );
    return { result };
  }
}
