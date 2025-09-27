import { Injectable, Logger } from '@nestjs/common';

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

@Injectable()
export class NFTPersonaService {
  private readonly logger = new Logger(NFTPersonaService.name);
  private userMemories = new Map<string, UserMemory>();

  /**
   * Get or create user memory
   */
  getUserMemory(address: string): UserMemory {
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
  updateUserMemory(
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
   * Build a lightweight persona string from NFT details
   */
  buildNFTPersona(nft: any): string {
    const name = nft.metadata?.name || `NFT #${nft.tokenId}`;
    const collection = this.extractCollectionName(nft) || 'this collection';
    const traits = this.extractTraits(nft.metadata);
    const toneHint = traits ? `Your style reflects traits (${traits}).` : '';
    return `You personify ${name} from ${collection}. ${toneHint}`.trim();
  }

  /**
   * Extract collection name from NFT metadata
   */
  private extractCollectionName(nft: any): string | undefined {
    if (!nft?.metadata?.metadata_json) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(nft.metadata.metadata_json);
      return (
        parsed.collection || parsed.collection_name || parsed.collectionName
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Extract traits from NFT metadata
   */
  private extractTraits(metadata: any): string {
    if (!metadata) return '';

    // Try to parse attributes from metadata_json if present
    let attributes: Array<{ trait_type: string; value: string }> = [];
    if (metadata.metadata_json) {
      try {
        const parsed = JSON.parse(metadata.metadata_json);
        if (Array.isArray(parsed?.attributes)) {
          attributes = parsed.attributes.map((a: any) => ({
            trait_type: String(a.trait_type ?? a.trait ?? 'attribute'),
            value: String(a.value ?? ''),
          }));
        }
      } catch {}
    }

    // Fallback: try to parse attributes string if provided
    if (attributes.length === 0 && typeof metadata.attributes === 'string') {
      try {
        const parsed = JSON.parse(metadata.attributes);
        if (Array.isArray(parsed)) {
          attributes = parsed.map((a: any) => ({
            trait_type: String(a.trait_type ?? a.trait ?? 'attribute'),
            value: String(a.value ?? ''),
          }));
        }
      } catch {}
    }

    return attributes
      .slice(0, 6)
      .map((t) => `${t.trait_type}: ${t.value}`)
      .join(', ');
  }

  /**
   * Generate system prompt based on NFT and user context
   */
  generateSystemPrompt(
    nftDetails: any,
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
    const { contract, tokenId } = nftDetails;
    const name = nftDetails.metadata?.name || 'Unknown';
    const collection = this.extractCollectionName(nftDetails) || 'Unknown';
    const description = nftDetails.metadata?.description;

    let prompt = `You are an AI agent specialized in NFT analysis and conversation. You have access to blockchain data through The Graph's Token API.

Persona:
- ${persona}

NFT Context:
- Contract: ${contract}
- Token ID: ${tokenId}
- Name: ${name}
- Collection: ${collection}
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
   * Calculate friendship level based on interactions
   */
  calculateFriendshipLevel(
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
  calculateHappinessLevel(
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
  getTotalInteractionsWithNFT(
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
  getLastInteractionWithNFT(
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
