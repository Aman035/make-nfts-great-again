import { Module } from '@nestjs/common';
import { NFTAgentService } from './nft-agent.service';
import { NFTAgentController } from './nft-agent.controller';
import { LLMModule } from '../llm/llm.module';
import { GraphMCPModule } from '../graph-mcp/graph-mcp.module';

@Module({
  imports: [LLMModule, GraphMCPModule],
  providers: [NFTAgentService],
  controllers: [NFTAgentController],
  exports: [NFTAgentService],
})
export class NFTAgentModule {}
