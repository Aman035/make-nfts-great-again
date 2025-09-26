import { Controller, Get, Param, Query } from '@nestjs/common';
import { NftService } from './nft.service';
import { GetNftsByAddressDto } from './dto/get-nfts-by-address.dto';
import { GetNftMetadataDto } from './dto/get-nft-metadata.dto';

@Controller('nft')
export class NftController {
  constructor(private readonly nft: NftService) {}

  // GET /nft/address/0xabc..
  @Get('address/:address/:chain')
  async getByAddress(@Param() params: GetNftsByAddressDto) {
    return this.nft.getNftsByAddress(params.address, params.chain);
  }

  // GET /nft/metadata/:chain/:contract/:tokenId
  @Get('metadata/:chain/:contract/:tokenId')
  async getMetadata(@Param() p: GetNftMetadataDto) {
    return this.nft.getNftMetadata(p.chain, p.contract, p.tokenId);
  }
}
