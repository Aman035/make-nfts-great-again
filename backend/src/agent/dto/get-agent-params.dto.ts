import { IsString, Matches } from 'class-validator';

export class GetAgentParamsDto {
  @IsString()
  chain!: string; // e.g. 'eip155:1', 'solana:mainnet'

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
  contract!: string; // EVM address or Solana pubkey (relax if needed)

  @IsString()
  tokenId!: string; // string for safety
}
