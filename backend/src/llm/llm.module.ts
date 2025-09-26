import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { GroqProvider } from './providers/groq.provider';
import { ZeroGProvider } from './providers/zerog.provider';

@Module({
  providers: [LLMService, GroqProvider, ZeroGProvider],
  controllers: [LLMController],
  exports: [LLMService], // Export so other modules can use it
})
export class LLMModule {}
