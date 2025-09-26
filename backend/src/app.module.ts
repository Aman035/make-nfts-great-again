import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { NftModule } from './nft/nft.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, NftModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
