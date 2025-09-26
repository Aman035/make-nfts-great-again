import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  LLMResponse,
  ToolDef,
  LLMProviderInterface,
} from './interfaces/llm-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { ZeroGProvider } from './providers/zerog.provider';

// Re-export for external use
export { LLMProvider, LLMResponse, ToolDef };

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private currentProvider: LLMProvider = LLMProvider.GROQ; // Default to Groq
  private providers: Map<LLMProvider, LLMProviderInterface> = new Map();

  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly zeroGProvider: ZeroGProvider,
  ) {
    // Initialize providers map
    this.providers.set(LLMProvider.GROQ, this.groqProvider);
    this.providers.set(LLMProvider.ZERO_G, this.zeroGProvider);

    // Set provider from environment variable
    const providerEnv = process.env.LLM_PROVIDER?.toLowerCase();
    if (
      providerEnv &&
      Object.values(LLMProvider).includes(providerEnv as LLMProvider)
    ) {
      this.currentProvider = providerEnv as LLMProvider;
    }
    this.logger.log(`Using LLM provider: ${this.currentProvider}`);
  }

  private getCurrentProviderInstance(): LLMProviderInterface {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }
    return provider;
  }

  async respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<LLMResponse> {
    try {
      const provider = this.getCurrentProviderInstance();
      return await provider.respondText(args);
    } catch (error) {
      this.logger.error(
        `Error in respondText with ${this.currentProvider}:`,
        error,
      );
      throw error;
    }
  }

  /** Function-calling loop (Chat Completions). */
  async respondWithTools(args: {
    system: string;
    user: string;
    tools?: ToolDef[];
    toolHandler: (call: {
      id: string;
      name: string;
      arguments: any;
    }) => Promise<any>;
    temperature?: number;
  }): Promise<LLMResponse> {
    try {
      const provider = this.getCurrentProviderInstance();
      return await provider.respondWithTools(args);
    } catch (error) {
      this.logger.error(
        `Error in respondWithTools with ${this.currentProvider}:`,
        error,
      );
      throw error;
    }
  }

  // Get current provider
  getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }
}
