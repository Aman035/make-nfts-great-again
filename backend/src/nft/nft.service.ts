import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NftService {
  constructor(private readonly http: HttpService) {}

  private headers() {
    const key = process.env.OPENSEA_API_KEY || '';
    return key ? { 'x-api-key': key } : {};
  }

  async getNftsByAddress(address: string, chain: string) {
    const url = `https://api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts?limit=100`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers() }),
    );
    return data;
  }

  async getNftMetadata(chain: string, contract: string, tokenId: string) {
    const url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${contract}/nfts/${tokenId}`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers() }),
    );
    return data;
  }
}
