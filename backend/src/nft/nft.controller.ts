import { Controller, Get, Param, Query } from '@nestjs/common';
import { NftService } from './nft.service';
import { NetworkId } from './providers/graph-tokenapi.provider';

@Controller('nft')
export class NftController {
  constructor(private readonly nft: NftService) {}

  // GET /nft/ownerships/evm/:address?network_id=mainnet&token_standard=ERC721&contract=0x...&page=1&limit=10
  @Get('ownerships/evm/:address')
  ownerships(
    @Param('address') address: string,
    @Query('network_id') network_id: NetworkId = 'mainnet',
    @Query('token_standard') token_standard?: 'ERC721' | 'ERC1155',
    @Query('contract') contract?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
  ) {
    return this.nft.ownerships(address, network_id, {
      token_standard,
      contract,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // GET /nft/items/evm/contract/:contract/token_id/:tokenId?network_id=mainnet
  @Get('items/evm/contract/:contract/token_id/:tokenId')
  item(
    @Param('contract') contract: string,
    @Param('tokenId') tokenId: string,
    @Query('network_id') network_id: NetworkId = 'mainnet',
  ) {
    return this.nft.item(contract, tokenId, network_id);
  }

  // GET /nft/sales/evm?network_id=mainnet&contract=0x...&token_id=...&startTime=...&endTime=...&orderDirection=desc&page=1&limit=10
  @Get('sales/evm')
  sales(
    @Query('network_id') network_id: NetworkId = 'mainnet',
    @Query() q: any,
  ) {
    // Pass through other optional filters: contract, token_id, anyAddress, offererAddress, recipientAddress, startTime, endTime, orderBy, orderDirection, page, limit
    return this.nft.sales(network_id, {
      network_id,
      contract: q.contract,
      token_id: q.token_id,
      anyAddress: q.anyAddress,
      offererAddress: q.offererAddress,
      recipientAddress: q.recipientAddress,
      startTime: q.startTime ? Number(q.startTime) : undefined,
      endTime: q.endTime ? Number(q.endTime) : undefined,
      orderBy: (q.orderBy ?? 'timestamp') as 'timestamp',
      orderDirection: (q.orderDirection ?? 'desc') as 'asc' | 'desc',
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
    });
  }
}
