import { Body, Controller, Param, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { TalkDto } from './dto/talk.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  /**
   * Public, stateless chat with an NFT.
   * Tools (Token API) are enabled by default; can be disabled per request with allowTools=false.
   *
   * POST /agent/:chain/:contract/:tokenId/talk
   * Body: { message, allowTools?, userAddress?, defaultNetwork? }
   */
  @Post(':chain/:contract/:tokenId/talk')
  async talk(
    @Param('chain') chain: string,
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
    @Body() body: TalkDto,
  ) {
    const { message, allowTools, userAddress, defaultNetwork } = body;
    return this.agent.talk(chain, contract, tokenId, message, {
      allowTools,
      userAddress,
      defaultNetwork,
    });
  }
}
