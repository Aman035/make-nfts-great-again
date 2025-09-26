import {
  Controller,
  Post,
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

@ApiTags('nft-agent')
@Controller('nft-agent')
export class NFTAgentController {
  constructor(private readonly nftAgentService: NFTAgentService) {}

  @Post(':chain/:contract/:tokenId/talk')
  @ApiOperation({
    summary: 'Talk to NFT agent',
    description: 'Send a message to the NFT agent and get a response',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    example: 'mainnet',
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
    description: 'User address',
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
    @Headers('address') address: string,
    @Body() talkRequest: TalkRequestDto,
  ): Promise<TalkResponseDto> {
    try {
      // Validate contract address
      if (!contract.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid contract address');
      }

      // Validate token ID
      if (!tokenId.match(/^\d+$/)) {
        throw new BadRequestException('Invalid token ID');
      }

      return await this.nftAgentService.talk(
        contract,
        tokenId,
        address,
        talkRequest,
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
