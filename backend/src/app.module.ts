import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { NftModule } from './nft/nft.module';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    NftModule,
    AgentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
