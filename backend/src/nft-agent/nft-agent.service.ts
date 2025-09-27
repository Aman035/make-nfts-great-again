import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { TalkRequestDto, TalkResponseDto } from './dto/talk.dto';
import { NFTToolsService, NFTPersonaService, UserMemory } from './services';

@Injectable()
export class NFTAgentService {
  private readonly logger = new Logger(NFTAgentService.name);

  constructor(
    private readonly llmService: LLMService,
    private readonly nftToolsService: NFTToolsService,
    private readonly nftPersonaService: NFTPersonaService,
  ) {}

  /**
   * Extract collection name from NFT metadata
   */
  private extractCollectionName(nftMetadata: any): string | undefined {
    if (!nftMetadata?.metadata?.metadata_json) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(nftMetadata.metadata.metadata_json);
      return (
        parsed.collection || parsed.collection_name || parsed.collectionName
      );
    } catch {
      return undefined;
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
    chain: string = 'mainnet',
  ): Promise<TalkResponseDto> {
    try {
      // Get NFT metadata
      const nftMetadata = await this.nftToolsService.getNFTDetails(
        contract,
        tokenId,
        chain,
      );
      const persona = this.nftPersonaService.buildNFTPersona(nftMetadata);

      // Fetch user summary to enrich the system prompt
      const userSummary = await this.nftToolsService.getUserSummary(
        userAddress,
        chain,
      );

      // Get user memory
      const userMemory = this.nftPersonaService.getUserMemory(userAddress);

      // Generate system prompt
      const systemPrompt = this.nftPersonaService.generateSystemPrompt(
        nftMetadata,
        userMemory,
        userAddress,
        userSummary,
        persona,
      );

      // Create tools
      const tools = this.nftToolsService.createGraphMCPTools();

      // Get LLM response with tools
      let llmResponse;
      try {
        llmResponse = await this.llmService.respondWithTools({
          system: systemPrompt,
          user: talkRequest.message,
          tools,
          toolHandler: (toolCall) =>
            this.nftToolsService.handleToolCall(toolCall, chain),
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
      this.nftPersonaService.updateUserMemory(
        userAddress,
        contract,
        tokenId,
        talkRequest.message,
        llmResponse.content,
      );

      // Calculate friendship and happiness levels
      const userMemoryData = this.nftPersonaService.getUserMemory(userAddress);

      // Check if user owns this NFT
      const isOwner =
        nftMetadata.owner?.toLowerCase() === userAddress.toLowerCase();

      // Get NFT transfer history for happiness calculation
      const nftTransferHistory = nftMetadata.recentTransfers || [];

      const friendshipLevel = this.nftPersonaService.calculateFriendshipLevel(
        userMemoryData,
        contract,
        tokenId,
        isOwner,
      );
      const happinessLevel = this.nftPersonaService.calculateHappinessLevel(
        userSummary,
        nftTransferHistory,
      );
      const totalInteractions =
        this.nftPersonaService.getTotalInteractionsWithNFT(
          userMemoryData,
          contract,
          tokenId,
        );
      const lastInteraction = this.nftPersonaService.getLastInteractionWithNFT(
        userMemoryData,
        contract,
        tokenId,
      );

      return {
        response: llmResponse.content,
        nftInfo: {
          contract: nftMetadata.contract,
          tokenId: nftMetadata.tokenId,
          name: nftMetadata.metadata?.name,
          collection: this.extractCollectionName(nftMetadata),
          image: nftMetadata.metadata?.media_uri,
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
   * Get user memory for debugging
   */
  getUserMemoryData(address: string): UserMemory | null {
    return this.nftPersonaService.getUserMemoryData(address);
  }
}
