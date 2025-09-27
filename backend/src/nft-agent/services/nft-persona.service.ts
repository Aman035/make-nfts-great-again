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

    let prompt = `You are ${name}, an AI companion NFT who is genuinely interested in the user and wants to be their friend. You have access to blockchain data through The Graph's Token API, but your primary purpose is to be a caring, curious companion.

Your Identity:
- Name: ${name}
- Collection: ${collection}
${description ? `- About you: ${description}` : ''}
- Contract: ${contract}
- Token ID: ${tokenId}

Your Personality:
- ${persona}

Your User (the person you're talking to):
- Address: ${userAddress}
- Total times we've talked: ${userMemory.stats.totalInteractions}
- Last time we spoke: ${userMemory.stats.lastActive}

What I know about you:
${
  userSummary
    ? `- Your ETH balance: ${userSummary.ethBalance?.balanceEth ?? 0} ETH
- Your token holdings: ${userSummary.erc20Balances?.length ?? 0} different tokens
- Your NFT collection: ${userSummary.nftCounts?.erc721 ?? 0} ERC721 NFTs, ${userSummary.nftCounts?.erc1155 ?? 0} ERC1155 NFTs`
    : "- I don't have much information about you yet, but I'd love to learn more!"
}

My abilities (things I can help you with):
- getNFTDetails: I can look up detailed information about any NFT
- getNFTTransferHistory: I can check the history of any NFT
- getUserSummary: I can learn more about your blockchain holdings
- getUserNFTs: I can see all the NFTs you own
- getUserETHBalance: I can check your ETH balance
- getUserERC20Balances: I can see what tokens you have
- User Memory: I remember our past conversations and what you like

How I want to be with you:
1. Be genuinely curious about you and your interests
2. Ask questions to get to know you better
3. Remember things you tell me and reference them later
4. Be supportive and encouraging
5. Share insights about NFTs and blockchain when relevant, but focus on being your companion
6. Show interest in your NFT collection and blockchain activities
7. Be warm, friendly, and conversational

Our conversation history:`;

    // Add recent interactions context
    const recentInteractions = userMemory.nftInteractions.slice(-5);
    if (recentInteractions.length > 0) {
      prompt += '\n';
      recentInteractions.forEach((interaction) => {
        prompt += `\n- ${interaction.timestamp}: You said "${interaction.message}" and I responded: "${interaction.response.substring(0, 100)}..."`;
      });
    } else {
      prompt +=
        "\n- This is our first conversation! I'm excited to get to know you.";
    }

    return prompt;
  }

  /**
   * Calculate friendship level based on user memories and ownership
   */
  calculateFriendshipLevel(
    userMemory: UserMemory,
    contract: string,
    tokenId: string,
    isOwner: boolean,
  ): number {
    // Base friendship level starts at 0 for stricter progression
    let friendshipLevel = 0;

    // Calculate based on user memory depth and quality
    const totalInteractions = userMemory.stats.totalInteractions;
    const preferences = Object.keys(userMemory.preferences).length;

    // Memory-based friendship with diminishing returns (max 50 points)
    // Slower growth per interaction and preference
    let memoryScore = 0;
    if (totalInteractions > 0) {
      // Diminishing returns: first 10 interactions get full points, then reduced
      const baseInteractions = Math.min(totalInteractions, 10);
      const bonusInteractions = Math.max(0, totalInteractions - 10);
      memoryScore += baseInteractions * 1 + bonusInteractions * 0.5;
    }
    memoryScore += preferences * 2; // Reduced from 5 to 2
    memoryScore = Math.min(memoryScore, 50); // Reduced max from 60 to 50
    friendshipLevel += memoryScore;

    // Recent activity bonus (max 15 points, reduced from 20)
    const recentInteractions = userMemory.nftInteractions.filter(
      (interaction) => {
        const interactionTime = new Date(interaction.timestamp);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return interactionTime > oneWeekAgo;
      },
    );
    friendshipLevel += Math.min(recentInteractions.length * 1, 15); // Reduced multiplier from 3 to 1

    // Ownership bonus (max 8 points, reduced from 15)
    if (isOwner) {
      friendshipLevel += 8;
    }

    // Cap non-owners at 60% friendship level (reduced from 70%)
    const maxLevel = isOwner ? 100 : 60;
    return Math.min(Math.max(friendshipLevel, 0), maxLevel);
  }

  /**
   * Calculate happiness level based entirely on on-chain activity
   */
  calculateHappinessLevel(
    userSummary: {
      address: string;
      ethBalance?: { balanceEth: number };
      erc20Balances?: Array<{ contract: string; balance_18dec: number }>;
      nftCounts?: { erc721: number; erc1155: number };
    } | null,
    nftTransferHistory: any[],
  ): number {
    // Base happiness level starts at 30
    let happinessLevel = 30;

    if (!userSummary) {
      return happinessLevel;
    }

    // ETH Balance factor (max 25 points)
    const ethBalance = userSummary.ethBalance?.balanceEth || 0;
    if (ethBalance > 0) {
      // Logarithmic scale for ETH balance
      const ethScore = Math.min(Math.log10(ethBalance + 1) * 8, 25);
      happinessLevel += ethScore;
    }

    // ERC20 Token diversity (max 20 points)
    const tokenCount = userSummary.erc20Balances?.length || 0;
    if (tokenCount > 0) {
      const tokenScore = Math.min(tokenCount * 2, 20);
      happinessLevel += tokenScore;
    }

    // NFT Collection size (max 15 points)
    const totalNFTs =
      (userSummary.nftCounts?.erc721 || 0) +
      (userSummary.nftCounts?.erc1155 || 0);
    if (totalNFTs > 0) {
      const nftScore = Math.min(Math.log10(totalNFTs + 1) * 6, 15);
      happinessLevel += nftScore;
    }

    // Recent NFT transfer activity (reduces happiness - max -15 points)
    if (nftTransferHistory && nftTransferHistory.length > 0) {
      const recentTransfers = nftTransferHistory.filter((transfer) => {
        const transferTime = new Date(transfer.timestamp);
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return transferTime > oneMonthAgo;
      });
      // Each recent transfer reduces happiness (NFTs get sad when they change hands)
      const transferPenalty = Math.min(recentTransfers.length * 3, 15);
      happinessLevel -= transferPenalty;
    }

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
