import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TalkDto {
  @IsString()
  @MaxLength(8000)
  message!: string;

  @IsOptional()
  @IsString()
  userAddress?: string; // optional: helps tool decide "my NFTs"

  @IsOptional()
  @IsString()
  defaultNetwork?: string; // e.g. "mainnet", "base", etc.
}
