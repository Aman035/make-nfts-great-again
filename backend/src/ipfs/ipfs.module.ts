import { Module } from '@nestjs/common';
import { IPFSResolverService } from './ipfs-resolver.service';
import { IPFSController } from './ipfs.controller';

@Module({
  controllers: [IPFSController],
  providers: [IPFSResolverService],
  exports: [IPFSResolverService],
})
export class IPFSModule {}
