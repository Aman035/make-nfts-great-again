import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';

@Module({
  imports: [HttpModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
