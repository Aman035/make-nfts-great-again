import { Injectable } from '@nestjs/common';
import {
  GraphTokenApiProvider,
  NetworkId,
} from '../nft/providers/graph-tokenapi.provider';

@Injectable()
export class TokenApiToolsService {
  constructor(private readonly graph: GraphTokenApiProvider) {}

  ownerships(args: { address: string; network_id: NetworkId }) {
    return this.graph.ownerships(args);
  }
  nftItem(args: { contract: string; token_id: string; network_id: NetworkId }) {
    return this.graph.item(args);
  }
  sales(args: { network_id: NetworkId; contract: string; token_id: string }) {
    return this.graph.sales(args);
  }
}
