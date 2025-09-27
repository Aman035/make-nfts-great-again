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
- getNFTDetails: Get comprehensive NFT information including metadata, owner, and recent transfers
- getNFTTransferHistory: Get the complete transfer history for any NFT
- getUserSummary: Get user's ETH balance, ERC20 tokens, and NFT holdings
- getUserNFTs: Get all NFTs owned by a user
- getUserETHBalance: Get user's ETH balance
- getUserERC20Balances: Get user's ERC20 token balances
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
   * Create high-level NFT and user tools for the agent
   */
  private createGraphMCPTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'getNFTDetails',
          description:
            'Get comprehensive details about a specific NFT including metadata, owner, and recent transfers',
          parameters: {
            type: 'object',
            properties: {
              contract: {
                type: 'string',
                description: 'NFT contract address',
              },
              tokenId: {
                type: 'string',
                description: 'NFT token ID',
              },
            },
            required: ['contract', 'tokenId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getNFTTransferHistory',
          description: 'Get the transfer history for a specific NFT',
          parameters: {
            type: 'object',
            properties: {
              contract: {
                type: 'string',
                description: 'NFT contract address',
              },
              tokenId: {
                type: 'string',
                description: 'NFT token ID',
              },
              limit: {
                type: 'number',
                description:
                  'Maximum number of transfers to return (default: 10)',
              },
            },
            required: ['contract', 'tokenId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getUserSummary',
          description:
            'Get comprehensive summary of a user including ETH balance, ERC20 tokens, and NFT holdings',
          parameters: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'User wallet address',
              },
            },
            required: ['address'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getUserNFTs',
          description: 'Get all NFTs owned by a user',
          parameters: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'User wallet address',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of NFTs to return (default: 100)',
              },
            },
            required: ['address'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getUserETHBalance',
          description: 'Get the ETH balance of a user',
          parameters: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'User wallet address',
              },
            },
            required: ['address'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getUserERC20Balances',
          description: 'Get all ERC20 token balances for a user',
          parameters: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'User wallet address',
              },
              limit: {
                type: 'number',
                description:
                  'Maximum number of tokens to return (default: 100)',
              },
            },
            required: ['address'],
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
        case 'getNFTDetails':
          return await this.graphMCPService.getNFTDetails(
            args.contract,
            args.tokenId,
          );

        case 'getNFTTransferHistory':
          const limit = args.limit || 10;
          const transferHistory = await this.graphMCPService.runQuery(
            `SELECT \`from\` AS from_address, \`to\` AS to_address, tx_hash, block_num, timestamp
             FROM \`mainnet:evm-nft-tokens@v0.6.2\`.erc721_transfers
             WHERE contract = '${args.contract.toLowerCase()}' AND token_id = ${args.tokenId}
             ORDER BY timestamp DESC
             LIMIT ${limit}`,
          );
          return transferHistory;

        case 'getUserSummary':
          return await this.graphMCPService.getUserSummary(args.address);

        case 'getUserNFTs':
          const nftLimit = args.limit || 100;
          return await this.graphMCPService.getNFTsOwned(args.address);

        case 'getUserETHBalance':
          return await this.graphMCPService.getEthBalance(args.address);

        case 'getUserERC20Balances':
          return await this.graphMCPService.getERC20Balances(args.address);

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
      let llmResponse;
      try {
        llmResponse = await this.llmService.respondWithTools({
          system: systemPrompt,
          user: talkRequest.message,
          tools,
          toolHandler: (toolCall) => this.handleToolCall(toolCall),
          temperature: 0.7,
        });
      } catch (error) {
        this.logger.error('LLM service failed, attempting fallback:', error);
        // Fallback to simple text response without tools
        try {
          llmResponse = await this.llmService.respondText({
            system: systemPrompt,
            user: talkRequest.message,
            temperature: 0.7,
          });
        } catch (fallbackError) {
          this.logger.error(
            'Fallback LLM response also failed:',
            fallbackError,
          );
          throw new Error(
            'LLM service is currently unavailable. Please try again later.',
          );
        }
      }

      // Update user memory
      this.updateUserMemory(
        userAddress,
        contract,
        tokenId,
        talkRequest.message,
        llmResponse.content,
      );

      // Calculate friendship and happiness levels
      const userMemoryData = this.getUserMemory(userAddress);
      const friendshipLevel = this.calculateFriendshipLevel(
        userMemoryData,
        contract,
        tokenId,
      );
      const happinessLevel = this.calculateHappinessLevel(
        userMemoryData,
        contract,
        tokenId,
      );
      const totalInteractions = this.getTotalInteractionsWithNFT(
        userMemoryData,
        contract,
        tokenId,
      );
      const lastInteraction = this.getLastInteractionWithNFT(
        userMemoryData,
        contract,
        tokenId,
      );

      return {
        response: llmResponse.content,
        nftInfo: {
          contract: nftMetadata.contract,
          tokenId: nftMetadata.tokenId,
          name: nftMetadata.name,
          collection: nftMetadata.collection,
        },
        userInfo: {
          address: userAddress,
          friendshipLevel,
          happinessLevel,
          totalInteractions,
          lastInteraction,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error in talk method:', error);
      throw error;
    }
  }

  /**
   * Calculate friendship level based on interactions
   */
  private calculateFriendshipLevel(
    userMemory: UserMemory,
    contract: string,
    tokenId: string,
  ): number {
    const interactionsWithNFT = userMemory.nftInteractions.filter(
      (interaction) =>
        interaction.contract === contract && interaction.tokenId === tokenId,
    );

    // Base friendship level starts at 10
    let friendshipLevel = 10;

    // Increase based on number of interactions (max 50 points)
    const interactionCount = interactionsWithNFT.length;
    friendshipLevel += Math.min(interactionCount * 2, 50);

    // Increase based on recent activity (max 20 points)
    const recentInteractions = interactionsWithNFT.filter((interaction) => {
      const interactionTime = new Date(interaction.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return interactionTime > oneDayAgo;
    });
    friendshipLevel += Math.min(recentInteractions.length * 5, 20);

    // Increase based on total user activity (max 20 points)
    const totalInteractions = userMemory.stats.totalInteractions;
    friendshipLevel += Math.min(Math.floor(totalInteractions / 5), 20);

    return Math.min(Math.max(friendshipLevel, 0), 100);
  }

  /**
   * Calculate happiness level based on interaction patterns
   */
  private calculateHappinessLevel(
    userMemory: UserMemory,
    contract: string,
    tokenId: string,
  ): number {
    const interactionsWithNFT = userMemory.nftInteractions.filter(
      (interaction) =>
        interaction.contract === contract && interaction.tokenId === tokenId,
    );

    // Base happiness level starts at 50
    let happinessLevel = 50;

    // Increase based on positive interaction patterns
    const positiveKeywords = [
      'love',
      'like',
      'amazing',
      'beautiful',
      'awesome',
      'great',
      'wonderful',
      'fantastic',
    ];
    const negativeKeywords = [
      'hate',
      'dislike',
      'ugly',
      'bad',
      'terrible',
      'awful',
      'horrible',
    ];

    for (const interaction of interactionsWithNFT) {
      const message = interaction.message.toLowerCase();
      const response = interaction.response.toLowerCase();

      // Check for positive sentiment
      const positiveCount = positiveKeywords.filter(
        (keyword) => message.includes(keyword) || response.includes(keyword),
      ).length;

      // Check for negative sentiment
      const negativeCount = negativeKeywords.filter(
        (keyword) => message.includes(keyword) || response.includes(keyword),
      ).length;

      happinessLevel += (positiveCount - negativeCount) * 3;
    }

    // Increase based on conversation length (longer conversations = happier)
    const avgMessageLength =
      interactionsWithNFT.reduce(
        (sum, interaction) =>
          sum + interaction.message.length + interaction.response.length,
        0,
      ) / Math.max(interactionsWithNFT.length, 1);

    happinessLevel += Math.min(avgMessageLength / 20, 15);

    return Math.min(Math.max(happinessLevel, 0), 100);
  }

  /**
   * Get total interactions with specific NFT
   */
  private getTotalInteractionsWithNFT(
    userMemory: UserMemory,
    contract: string,
    tokenId: string,
  ): number {
    return userMemory.nftInteractions.filter(
      (interaction) =>
        interaction.contract === contract && interaction.tokenId === tokenId,
    ).length;
  }

  /**
   * Get last interaction timestamp with specific NFT
   */
  private getLastInteractionWithNFT(
    userMemory: UserMemory,
    contract: string,
    tokenId: string,
  ): string {
    const interactionsWithNFT = userMemory.nftInteractions.filter(
      (interaction) =>
        interaction.contract === contract && interaction.tokenId === tokenId,
    );

    if (interactionsWithNFT.length === 0) {
      return new Date().toISOString();
    }

    // Sort by timestamp and get the most recent
    const sortedInteractions = interactionsWithNFT.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return sortedInteractions[0].timestamp;
  }

  /**
   * Get user memory for debugging
   */
  getUserMemoryData(address: string): UserMemory | null {
    return this.userMemories.get(address) || null;
  }
}
