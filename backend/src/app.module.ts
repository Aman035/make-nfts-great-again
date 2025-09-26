import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { LLMModule } from './llm/llm.module';
import { GraphMCPModule } from './graph-mcp/graph-mcp.module';
import { NFTAgentModule } from './nft-agent/nft-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    LLMModule,
    GraphMCPModule,
    NFTAgentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
