import { Injectable } from '@nestjs/common';

export type NetworkId =
  | 'mainnet'
  | 'arbitrum-one'
  | 'avalanche'
  | 'base'
  | 'bsc'
  | 'matic'
  | 'optimism'
  | 'unichain';

export type TokenDetails = {
  token_id: string;
  token_standard: string;
  contract: string;
  owner: string;
  symbol: string;
  name: string;
  network_id: string;
};

export type Metadata = {
  token_standard: string;
  contract: string;
  token_id: string;
  owner: string;
  uri: string;
  name: string;
  description: string;
  image: string;
  attributes: any[];
  network_id: string;
};

export type Sale = {
  timestamp: string;
  block_num: number;
  tx_hash: string;
  token: string;
  token_id: string;
  symbol: string;
  name: string;
  offerer: string;
  recipient: string;
  sale_amount: number;
  sale_currency: string;
};

@Injectable()
export class GraphTokenApiProvider {
  private base = process.env.GRAPH_TOKENAPI_BASE_URL!;
  private apiKey = process.env.GRAPH_TOKENAPI_KEY;

  private headers() {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (this.apiKey) h.authorization = `Bearer ${this.apiKey}`;
    return h;
  }

  // GET /nft/ownerships/evm/{address}?network_id=...&token_standard=...&contract=...&page=&limit=
  async ownerships(params: {
    address: string;
    network_id: NetworkId;
    token_standard?: 'ERC721' | 'ERC1155';
    contract?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: TokenDetails[] }> {
    const {
      address,
      network_id,
      token_standard,
      contract,
      page = 1,
      limit = 10,
    } = params;
    const url = new URL(`${this.base}/nft/ownerships/evm/${address}`);

    url.searchParams.set('network_id', network_id);
    if (token_standard) url.searchParams.set('token_standard', token_standard);
    if (contract) url.searchParams.set('contract', contract);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const r = await fetch(url.toString(), { headers: this.headers() });
    if (!r.ok) throw new Error(`GraphTokenAPI.ownerships ${r.status}`);
    return await r.json();
  }

  // GET /nft/items/evm/contract/{contract}/token_id/{token_id}?network_id=...
  async item(params: {
    contract: string;
    token_id: string;
    network_id: NetworkId;
  }): Promise<{ data: Metadata[] }> {
    const { contract, token_id, network_id } = params;
    const url = new URL(
      `${this.base}/nft/items/evm/contract/${contract}/token_id/${token_id}`,
    );
    url.searchParams.set('network_id', network_id);

    const r = await fetch(url.toString(), { headers: this.headers() });
    if (!r.ok) throw new Error(`GraphTokenAPI.item ${r.status}`);
    return await r.json();
  }

  // GET /nft/sales/evm?network_id=...&contract=...&token_id=...&anyAddress=...&offererAddress=...&recipientAddress=...&startTime=...&endTime=...&orderBy=timestamp&orderDirection=desc&limit=&page=
  async sales(params: {
    network_id: NetworkId;
    contract?: string;
    token_id?: string;
    anyAddress?: string;
    offererAddress?: string;
    recipientAddress?: string;
    startTime?: number;
    endTime?: number;
    orderBy?: 'timestamp';
    orderDirection?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ data: Sale[] }> {
    const {
      network_id,
      contract,
      token_id,
      anyAddress,
      offererAddress,
      recipientAddress,
      startTime,
      endTime,
      orderBy = 'timestamp',
      orderDirection = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const url = new URL(`${this.base}/nft/sales/evm`);
    url.searchParams.set('network_id', network_id);
    if (contract) url.searchParams.set('contract', contract);
    if (token_id) url.searchParams.set('token_id', token_id);
    if (anyAddress) url.searchParams.set('anyAddress', anyAddress);
    if (offererAddress) url.searchParams.set('offererAddress', offererAddress);
    if (recipientAddress)
      url.searchParams.set('recipientAddress', recipientAddress);
    if (startTime != null) url.searchParams.set('startTime', String(startTime));
    if (endTime != null) url.searchParams.set('endTime', String(endTime));
    url.searchParams.set('orderBy', orderBy);
    url.searchParams.set('orderDirection', orderDirection);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const r = await fetch(url.toString(), { headers: this.headers() });
    if (!r.ok) throw new Error(`GraphTokenAPI.sales ${r.status}`);
    const response = await r.json();
    return response;
  }
}
