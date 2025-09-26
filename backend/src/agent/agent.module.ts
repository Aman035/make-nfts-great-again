import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PersonaService } from './persona.service';
import { LLMService } from './llm.service';
import { TokenApiToolsService } from './tokenapi-tools.service';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [NftModule],
  controllers: [AgentController],
  providers: [AgentService, PersonaService, LLMService, TokenApiToolsService],
})
export class AgentModule {}
