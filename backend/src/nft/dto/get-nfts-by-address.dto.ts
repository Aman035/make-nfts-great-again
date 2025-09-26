import { IsString } from 'class-validator';

export class GetNftsByAddressDto {
  @IsString()
  address!: string;

  @IsString()
  chain!: string; // e.g., 'ethereum' | 'base' | 'polygon'
}
