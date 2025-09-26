import { Injectable } from '@nestjs/common';
import {
  GraphTokenApiProvider,
  NetworkId,
} from './providers/graph-tokenapi.provider';

@Injectable()
export class NftService {
  constructor(private readonly graph: GraphTokenApiProvider) {}

  // Ownerships
  ownerships(
    address: string,
    network_id: NetworkId,
    opts?: {
      token_standard?: 'ERC721' | 'ERC1155';
      contract?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.graph.ownerships({ address, network_id, ...opts });
  }

  // Single item metadata
  item(contract: string, tokenId: string, network_id: NetworkId) {
    return this.graph.item({ contract, token_id: tokenId, network_id });
  }

  // Sales
  sales(
    network_id: NetworkId,
    opts: Parameters<GraphTokenApiProvider['sales']>[0],
  ) {
    return this.graph.sales({ ...opts, network_id });
  }
}
