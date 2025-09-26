import { Body, Controller, Param, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { TalkDto } from './dto/talk.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  /**
   * Public, stateless chat with blockchain data analysis capabilities.
   * MCP database tools are always enabled for comprehensive blockchain data querying.
   *
   * POST /agent/:chain/:contract/:tokenId/talk
   * Body: { message, userAddress?, defaultNetwork? }
   */
  @Post(':chain/:contract/:tokenId/talk')
  async talk(
    @Param('chain') chain: string,
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
    @Body() body: TalkDto,
  ) {
    const { message, userAddress, defaultNetwork } = body;
    return this.agent.talk(chain, contract, tokenId, message, {
      userAddress,
      defaultNetwork,
    });
  }
}
