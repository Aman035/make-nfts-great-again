import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { GraphTokenApiProvider } from './providers/graph-tokenapi.provider';

@Module({
  controllers: [NftController],
  providers: [NftService, GraphTokenApiProvider],
  exports: [NftService, GraphTokenApiProvider],
})
export class NftModule {}
