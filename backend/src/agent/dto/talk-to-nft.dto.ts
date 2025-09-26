import { IsOptional, IsString, IsObject } from 'class-validator';

export class TalkToNftDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  userAddress?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
