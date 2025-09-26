import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { NftModule } from 'src/nft/nft.module';

@Module({
  imports: [NftModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
