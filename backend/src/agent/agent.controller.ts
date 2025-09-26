import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AgentService } from './agent.service';
import { GetAgentParamsDto } from './dto/get-agent-params.dto';
import { TalkToNftDto } from './dto/talk-to-nft.dto';
import { UpsertAgentStateDto } from './dto/upsert-agent-state.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Post(':chain/:contract/:tokenId/talk')
  async talk(@Param() p: GetAgentParamsDto, @Body() body: TalkToNftDto) {
    return this.agent.talk({ ...p, ...body });
  }

  @Sse(':chain/:contract/:tokenId/stream')
  stream(
    @Param() p: GetAgentParamsDto,
    @Query('message') message?: string,
    @Query('sessionId') sessionId?: string,
    @Query('userAddress') userAddress?: string,
  ): Observable<MessageEvent> {
    if (!message) throw new BadRequestException('message is required');
    return this.agent
      .stream({ ...p, message, sessionId, userAddress })
      .pipe(map((token) => ({ data: token }) as MessageEvent));
  }

  @Get(':chain/:contract/:tokenId/state')
  async getState(@Param() p: GetAgentParamsDto) {
    return this.agent.getState(p);
  }

  @Put(':chain/:contract/:tokenId/state')
  async upsertState(
    @Param() p: GetAgentParamsDto,
    @Body() body: UpsertAgentStateDto,
  ) {
    return this.agent.upsertState(p, body);
  }
}
