import { IsOptional, IsObject } from 'class-validator';

export class UpsertAgentStateDto {
  @IsOptional()
  @IsObject()
  memory?: Record<string, any>;

  @IsOptional()
  @IsObject()
  config?: {
    systemPrompt?: string;
    temperature?: number;
    tools?: Array<{ name: string; description?: string }>;
  };
}
