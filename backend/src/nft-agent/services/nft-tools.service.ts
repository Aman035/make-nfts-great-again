import { Injectable, Logger } from '@nestjs/common';
import { GraphMCPService } from '../../graph-mcp/graph-mcp.service';

@Injectable()
export class NFTToolsService {
  private readonly logger = new Logger(NFTToolsService.name);

  constructor(private readonly graphMCPService: GraphMCPService) {}

  /**
   * Get NFT details from Graph MCP
   */
  async getNFTDetails(
    contract: string,
    tokenId: string,
    chain: string = 'mainnet',
  ) {
    return await this.graphMCPService.getNFTDetails(contract, tokenId, chain);
  }

  /**
   * Create high-level NFT and user tools for the agent
   */
  createGraphMCPTools() {
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
  async handleToolCall(
    toolCall: {
      id: string;
      name: string;
      arguments: any;
    },
    chain: string = 'mainnet',
  ): Promise<any> {
    const { name, arguments: args } = toolCall;

    try {
      switch (name) {
        case 'getNFTDetails':
          return await this.graphMCPService.getNFTDetails(
            args.contract,
            args.tokenId,
            chain,
          );

        case 'getNFTTransferHistory':
          const limit = args.limit || 10;
          return await this.graphMCPService.getNFTTransferHistory(
            args.contract,
            args.tokenId,
            chain,
            limit,
          );

        case 'getUserSummary':
          return await this.graphMCPService.getUserSummary(args.address, chain);

        case 'getUserNFTs':
          const nftLimit = args.limit || 100;
          return await this.graphMCPService.getNFTsOwned(args.address, chain);

        case 'getUserETHBalance':
          return await this.graphMCPService.getEthBalance(args.address, chain);

        case 'getUserERC20Balances':
          return await this.graphMCPService.getERC20Balances(
            args.address,
            chain,
          );

        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      return { error: `Tool execution failed: ${error.message}` };
    }
  }

  /**
   * Get user summary data
   */
  async getUserSummary(address: string, chain: string = 'mainnet') {
    try {
      return await this.graphMCPService.getUserSummary(address, chain);
    } catch (error) {
      this.logger.warn(`Failed to fetch user summary for ${address}:`, error);
      return null;
    }
  }
}
