import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { NFTAgentService } from './nft-agent.service';
import { TalkRequestDto, TalkResponseDto } from './dto/talk.dto';
import { getSupportedChains } from '../graph-mcp/chain-config';

@ApiTags('nft-agent')
@Controller('nft-agent')
export class NFTAgentController {
  constructor(private readonly nftAgentService: NFTAgentService) {}

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

  @Post(':chain/:contract/:tokenId/:address/talk')
  @ApiOperation({
    summary: 'Talk to NFT agent',
    description: 'Send a message to the NFT agent and get a response',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    example: 'mainnet',
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
  @ApiParam({
    name: 'contract',
    description: 'NFT contract address',
    example: '0x5Af0D9827E0c53E4799BB226655A1de152A425a5',
  })
  @ApiParam({
    name: 'tokenId',
    description: 'NFT token ID',
    example: '12',
  })
  @ApiParam({
    name: 'address',
    description: 'User wallet address',
    example: '0x9393ef54480e2bb46AC1EA5D0623cFf0badB99ac',
  })
  @ApiBody({
    type: TalkRequestDto,
    description: 'Talk request with message and optional context',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent response',
    type: TalkResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid user address',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid parameters',
  })
  async talk(
    @Param('chain') chain: string,
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
    @Param('address') address: string,
    @Body() talkRequest: TalkRequestDto,
  ): Promise<TalkResponseDto> {
    try {
      // Validate chain
      const supportedChains = getSupportedChains();
      if (!supportedChains.includes(chain.toLowerCase())) {
        throw new BadRequestException(
          `Unsupported chain: ${chain}. Supported chains: ${supportedChains.join(', ')}`,
        );
      }

      // Validate contract address
      if (!contract.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid contract address');
      }

      // Validate token ID
      if (!tokenId.match(/^\d+$/)) {
        throw new BadRequestException('Invalid token ID');
      }

      // Validate user address
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid user address');
      }

      return await this.nftAgentService.talk(
        contract,
        tokenId,
        address,
        talkRequest,
        chain,
      );
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to process talk request');
    }
  }
}
