import { Module } from '@nestjs/common';
import { NFTAgentService } from './nft-agent.service';
import { NFTAgentController } from './nft-agent.controller';
import { NFTToolsService, NFTPersonaService } from './services';
import { LLMModule } from '../llm/llm.module';
import { GraphMCPModule } from '../graph-mcp/graph-mcp.module';
import { IPFSModule } from '../ipfs/ipfs.module';

@Module({
  imports: [LLMModule, GraphMCPModule, IPFSModule],
  providers: [NFTAgentService, NFTToolsService, NFTPersonaService],
  controllers: [NFTAgentController],
  exports: [NFTAgentService],
})
export class NFTAgentModule {}
