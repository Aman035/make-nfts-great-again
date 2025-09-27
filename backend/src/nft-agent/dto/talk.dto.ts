import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TalkRequestDto {
  @ApiProperty({
    description: 'User message to the NFT agent',
    example: 'What can you tell me about this NFT?',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional context or parameters',
    example: { includeHistory: true, maxTokens: 1000 },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class UserInfoDto {
  @ApiProperty({
    description: 'User wallet address',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  address: string;

  @ApiProperty({
    description: 'Friendship level with the NFT (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  friendshipLevel: number;

  @ApiProperty({
    description: 'Happiness level of the NFT (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  happinessLevel: number;

  @ApiProperty({
    description: 'Total number of interactions with this NFT',
    example: 12,
  })
  @IsNumber()
  totalInteractions: number;

  @ApiProperty({
    description: 'Last interaction timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastInteraction: string;
}

export class TalkResponseDto {
  @ApiProperty({
    description: 'Agent response message',
    example: 'This NFT is part of the Bored Ape Yacht Club collection...',
  })
  response: string;

  @ApiProperty({
    description: 'NFT metadata information',
    example: {
      contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      tokenId: '1234',
      name: 'Bored Ape #1234',
      collection: 'Bored Ape Yacht Club',
    },
  })
  nftInfo: {
    contract: string;
    tokenId: string;
    name?: string;
    collection?: string;
  };

  @ApiProperty({
    description: 'User information including relationship metrics',
    type: UserInfoDto,
  })
  userInfo: UserInfoDto;

  @ApiProperty({
    description: 'Conversation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}

// SIWE authentication deferred for MVP
