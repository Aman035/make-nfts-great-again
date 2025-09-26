import { IsString } from 'class-validator';

export class GetNftMetadataDto {
  @IsString()
  chain!: string; // 'ethereum' | 'base' | 'polygon' | etc (Reservoir-supported)

  @IsString()
  contract!: string; // checksummed addr string

  @IsString()
  tokenId!: string; // token id as string
}
