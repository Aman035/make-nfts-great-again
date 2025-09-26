import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { GraphMCPService } from '../graph-mcp/graph-mcp.service';
import { TalkRequestDto, TalkResponseDto } from './dto/talk.dto';

export interface UserMemory {
  address: string;
  nftInteractions: Array<{
    contract: string;
    tokenId: string;
    timestamp: string;
    message: string;
    response: string;
  }>;
  preferences: Record<string, any>;
  stats: {
    totalInteractions: number;
    favoriteCollections: string[];
    lastActive: string;
  };
}

export interface NFTMetadata {
  contract: string;
  tokenId: string;
  name?: string;
  collection?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

@Injectable()
export class NFTAgentService {
  private readonly logger = new Logger(NFTAgentService.name);
  private userMemories = new Map<string, UserMemory>();

  constructor(
    private readonly llmService: LLMService,
    private readonly graphMCPService: GraphMCPService,
  ) {}

  /**
   * Get or create user memory
   */
  private getUserMemory(address: string): UserMemory {
    if (!this.userMemories.has(address)) {
      this.userMemories.set(address, {
        address,
        nftInteractions: [],
        preferences: {},
        stats: {
          totalInteractions: 0,
          favoriteCollections: [],
          lastActive: new Date().toISOString(),
        },
      });
    }
    return this.userMemories.get(address)!;
  }

  /**
   * Update user memory with interaction
   */
  private updateUserMemory(
    address: string,
    contract: string,
    tokenId: string,
    message: string,
    response: string,
  ): void {
    const memory = this.getUserMemory(address);
    memory.nftInteractions.push({
      contract,
      tokenId,
      timestamp: new Date().toISOString(),
      message,
      response,
    });
    memory.stats.totalInteractions++;
    memory.stats.lastActive = new Date().toISOString();

    // Keep only last 100 interactions
    if (memory.nftInteractions.length > 100) {
      memory.nftInteractions = memory.nftInteractions.slice(-100);
    }
  }

  /**
   * Get NFT metadata from Graph MCP
   */
  private async getNFTMetadata(
    contract: string,
    tokenId: string,
  ): Promise<NFTMetadata> {
    try {
      const details = await this.graphMCPService.getNFTDetails(
        contract,
        tokenId,
      );
      const meta = details?.metadata || {};

      // Try to parse attributes from metadata_json if present
      let attributes: Array<{ trait_type: string; value: string }> | undefined;
      if (meta?.metadata_json) {
        try {
          const parsed = JSON.parse(meta.metadata_json);
          if (Array.isArray(parsed?.attributes)) {
            attributes = parsed.attributes.map((a: any) => ({
              trait_type: String(a.trait_type ?? a.trait ?? 'attribute'),
              value: String(a.value ?? ''),
            }));
          }
        } catch {}
      }
      // Fallback: try to parse attributes string if provided
      if (!attributes && typeof meta?.attributes === 'string') {
        try {
          const parsed = JSON.parse(meta.attributes);
          if (Array.isArray(parsed)) {
            attributes = parsed.map((a: any) => ({
              trait_type: String(a.trait_type ?? a.trait ?? 'attribute'),
              value: String(a.value ?? ''),
            }));
          }
        } catch {}
      }

      return {
        contract: details.contract || contract,
        tokenId: details.tokenId || tokenId,
        name: meta?.name,
        collection: undefined,
        description: meta?.description,
        image: meta?.media_uri,
        attributes,
      };
    } catch (error) {
      this.logger.error(
        `Error getting NFT metadata for ${contract}:${tokenId}:`,
        error,
      );
      return {
        contract,
        tokenId,
        name: `NFT #${tokenId}`,
        collection: 'Unknown Collection',
      };
    }
  }

  /**
   * Build a lightweight persona string from NFT details
   */
  private buildNFTPersona(nft: NFTMetadata): string {
    const name = nft.name || `NFT #${nft.tokenId}`;
    const collection = nft.collection || 'this collection';
    const traits = (nft.attributes || [])
      .slice(0, 6)
      .map((t) => `${t.trait_type}: ${t.value}`)
      .join(', ');
    const toneHint = traits ? `Your style reflects traits (${traits}).` : '';
    return `You personify ${name} from ${collection}. ${toneHint}`.trim();
  }

  /**
   * Generate system prompt based on NFT and user context
   */
  private generateSystemPrompt(
    nftMetadata: NFTMetadata,
    userMemory: UserMemory,
    userAddress: string,
    userSummary: {
      address: string;
      ethBalance?: { balanceEth: number };
      erc20Balances?: Array<{ contract: string; balance_18dec: number }>;
      nftCounts?: { erc721: number; erc1155: number };
    } | null,
    persona: string,
  ): string {
    const { contract, tokenId, name, collection, description } = nftMetadata;

    let prompt = `You are an AI agent specialized in NFT analysis and conversation. You have access to blockchain data through The Graph's Token API.

Persona:
- ${persona}

NFT Context:
- Contract: ${contract}
- Token ID: ${tokenId}
- Name: ${name || 'Unknown'}
- Collection: ${collection || 'Unknown'}
${description ? `- Description: ${description}` : ''}

User Summary:
${
  userSummary
    ? `- ETH Balance: ${userSummary.ethBalance?.balanceEth ?? 0} ETH
- ERC20 tokens (non-zero): ${userSummary.erc20Balances?.length ?? 0}
- NFT counts: ERC721=${userSummary.nftCounts?.erc721 ?? 0}, ERC1155=${userSummary.nftCounts?.erc1155 ?? 0}`
    : '- Not available'
}

User Context:
- Address: ${userAddress}
- Total Interactions: ${userMemory.stats.totalInteractions}
- Last Active: ${userMemory.stats.lastActive}

Available Tools:
- Graph MCP: Query blockchain data, NFT metadata, transfer history, holder information
- User Memory: Access previous conversations and preferences

Instructions:
1. Be helpful and informative about NFTs and blockchain data
2. Use Graph MCP tools to provide accurate, real-time data
3. Reference user's interaction history when relevant
4. Provide insights about NFT rarity, market data, and blockchain activity
5. Be conversational and engaging

Recent User Interactions:`;

    // Add recent interactions context
    const recentInteractions = userMemory.nftInteractions.slice(-5);
    if (recentInteractions.length > 0) {
      prompt += '\n';
      recentInteractions.forEach((interaction) => {
        prompt += `\n- ${interaction.timestamp}: ${interaction.message} -> ${interaction.response.substring(0, 100)}...`;
      });
    } else {
      prompt += '\n- No previous interactions';
    }

    return prompt;
  }

  /**
   * Create Graph MCP tools for the agent
   */
  private createGraphMCPTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'list_databases',
          description: 'List available databases from The Graph Token API',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'list_tables',
          description: 'List tables for a specific database',
          parameters: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                description:
                  'Database name (e.g., mainnet:evm-nft-tokens@v0.6.2)',
              },
            },
            required: ['database'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'describe_table',
          description: 'Get table schema and column information',
          parameters: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                description: 'Database name',
              },
              table: {
                type: 'string',
                description: 'Table name',
              },
            },
            required: ['database', 'table'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'run_query',
          description: 'Execute SQL query on blockchain data',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query using ClickHouse syntax',
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  /**
   * Handle tool calls from the LLM
   */
  private async handleToolCall(toolCall: {
    id: string;
    name: string;
    arguments: any;
  }): Promise<any> {
    const { name, arguments: args } = toolCall;

    try {
      switch (name) {
        case 'list_databases':
          return await this.graphMCPService.listDatabases();

        case 'list_tables':
          return await this.graphMCPService.listTables(args.database);

        case 'describe_table':
          return await this.graphMCPService.describeTable(
            args.database,
            args.table,
          );

        case 'run_query':
          return await this.graphMCPService.runQuery(args.query);

        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      return { error: `Tool execution failed: ${error.message}` };
    }
  }

  /**
   * Main talk method
   */
  async talk(
    contract: string,
    tokenId: string,
    userAddress: string,
    talkRequest: TalkRequestDto,
  ): Promise<TalkResponseDto> {
    try {
      // Get NFT metadata
      const nftMetadata = await this.getNFTMetadata(contract, tokenId);
      const persona = this.buildNFTPersona(nftMetadata);

      // Fetch user summary to enrich the system prompt
      let userSummary: {
        address: string;
        ethBalance?: { balanceEth: number };
        erc20Balances?: Array<{ contract: string; balance_18dec: number }>;
        nftCounts?: { erc721: number; erc1155: number };
      } | null = null;
      try {
        userSummary = await this.graphMCPService.getUserSummary(userAddress);
      } catch (e) {
        this.logger.warn('Failed to fetch user summary, continuing without it');
      }

      // Get user memory
      const userMemory = this.getUserMemory(userAddress);

      // Generate system prompt
      const systemPrompt = this.generateSystemPrompt(
        nftMetadata,
        userMemory,
        userAddress,
        userSummary,
        persona,
      );

      // Create tools
      const tools = this.createGraphMCPTools();

      // Get LLM response with tools
      const llmResponse = await this.llmService.respondWithTools({
        system: systemPrompt,
        user: talkRequest.message,
        tools,
        toolHandler: (toolCall) => this.handleToolCall(toolCall),
        temperature: 0.7,
      });

      // Update user memory
      this.updateUserMemory(
        userAddress,
        contract,
        tokenId,
        talkRequest.message,
        llmResponse.content,
      );

      return {
        response: llmResponse.content,
        nftInfo: {
          contract: nftMetadata.contract,
          tokenId: nftMetadata.tokenId,
          name: nftMetadata.name,
          collection: nftMetadata.collection,
        },
        userAddress,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error in talk method:', error);
      throw error;
    }
  }

  /**
   * Get user memory for debugging
   */
  getUserMemoryData(address: string): UserMemory | null {
    return this.userMemories.get(address) || null;
  }
}
