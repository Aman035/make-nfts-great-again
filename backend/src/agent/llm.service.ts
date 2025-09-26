import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ethers } from 'ethers';
import {
  createZGComputeNetworkBroker,
  type ZGComputeNetworkBroker,
} from '@0glabs/0g-serving-broker';

type ToolDef = OpenAI.Chat.Completions.ChatCompletionTool;
type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export enum LLMProvider {
  GROQ = 'groq',
  ZERO_G = 'zero_g',
  OPENAI = 'openai',
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private broker?: ZGComputeNetworkBroker;
  private pickedProvider?: string;
  private pickedEndpoint?: string;
  private pickedModel?: string;
  private currentProvider: LLMProvider = LLMProvider.GROQ; // Default to Groq

  constructor() {
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

  // 0G Network implementation (kept for future use)
  private async ensureZeroGReady() {
    if (this.broker) return;

    const rpc = process.env.OG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
    const pk = process.env.OG_PRIVATE_KEY;
    if (!pk) throw new Error('OG_PRIVATE_KEY is required for 0G network');

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    this.broker = await createZGComputeNetworkBroker(wallet);

    await this.pickProviderAndModel();
  }

  private async pickProviderAndModel() {
    if (!this.broker) throw new Error('0G broker not initialized');

    const services = await this.broker.inference.listService();
    if (!services?.length) throw new Error('No 0G services available');

    const preferred = ['phala/gpt-oss-120b', 'phala/deepseek-chat-v3-0324'];
    let pick = services.find((s) =>
      preferred.some((p) => (s.model ?? '').toLowerCase().includes(p)),
    );

    if (!pick) pick = services[0];

    this.pickedProvider = pick.provider;
    await this.broker.inference.acknowledgeProviderSigner(this.pickedProvider);

    const { model, endpoint } = await this.broker.inference.getServiceMetadata(
      this.pickedProvider,
    );

    if (!endpoint || !model)
      throw new Error('0G service metadata missing endpoint/model');
    this.pickedEndpoint = endpoint.replace(/\/+$/, '');
    this.pickedModel = model;
  }

  private async buildZeroGClientAndHeaders(promptForAuth: string) {
    await this.ensureZeroGReady();

    const headers = (await this.broker!.inference.getRequestHeaders(
      this.pickedProvider!,
      promptForAuth,
    )) as any;

    const client = new OpenAI({
      apiKey: '', // any non-empty string is fine
      baseURL: this.pickedEndpoint, // provider's OpenAI-compatible base
    });

    return { client, headers, model: this.pickedModel! };
  }

  // Groq implementation (free alternative)
  private buildGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required for Groq provider');
    }

    return new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      defaultHeaders: {
        'User-Agent': 'MCP-Agent/1.0',
      },
    });
  }

  // Get available Groq models
  private async getAvailableGroqModels(): Promise<string[]> {
    try {
      const client = this.buildGroqClient();
      const response = await client.models.list();
      return response.data
        .map((model) => model.id)
        .filter(
          (id) =>
            id.includes('llama') ||
            id.includes('mixtral') ||
            id.includes('gemma'),
        );
    } catch (error) {
      this.logger.warn('Could not fetch Groq models, using fallback');
      return [
        'llama-3.1-8b-instant',
        'llama-3.1-70b-versatile',
        'mixtral-8x7b-32768',
      ];
    }
  }

  // OpenAI implementation
  private buildOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider');
    }

    return new OpenAI({
      apiKey,
    });
  }

  private async buildClientAndHeaders(promptForAuth: string) {
    switch (this.currentProvider) {
      case LLMProvider.ZERO_G:
        return this.buildZeroGClientAndHeaders(promptForAuth);
      case LLMProvider.GROQ:
        return {
          client: this.buildGroqClient(),
          headers: {},
          model: 'llama-3.1-8b-instant', // Current supported Groq model
        };
      case LLMProvider.OPENAI:
        return {
          client: this.buildOpenAIClient(),
          headers: {},
          model: 'gpt-4o-mini', // Cost-effective OpenAI model
        };
      default:
        throw new Error(`Unsupported LLM provider: ${this.currentProvider}`);
    }
  }

  async respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<string> {
    const { system, user, temperature = 0.7 } = args;

    try {
      const authMsg = `${system}\n\nUSER: ${user}`.slice(0, 2000);
      const { client, headers, model } =
        await this.buildClientAndHeaders(authMsg);

      const res = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature,
        },
        { headers },
      );

      return res.choices?.[0]?.message?.content ?? '';
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
  }): Promise<string> {
    const { system, user, tools, toolHandler, temperature = 0.7 } = args;

    try {
      const authMsg = `${system}\n\nUSER: ${user}`.slice(0, 2000);
      const { client, headers, model } =
        await this.buildClientAndHeaders(authMsg);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ];

      const runTurn = async () => {
        const requestConfig: any = {
          model,
          messages,
          temperature,
        };

        // Groq-specific configuration
        if (this.currentProvider === LLMProvider.GROQ) {
          if (tools && tools.length > 0) {
            requestConfig.tools = tools;
            requestConfig.tool_choice = 'auto';
          }
        } else {
          // Other providers
          if (tools) {
            requestConfig.tools = tools;
            requestConfig.tool_choice = 'auto';
          }
        }

        return client.chat.completions.create(requestConfig, { headers });
      };

      let resp = await runTurn();

      while (true) {
        const msg = resp.choices?.[0]?.message;
        const toolCalls = (msg?.tool_calls ?? []) as ToolCall[];

        if (!toolCalls.length) return msg?.content ?? '';

        for (const call of toolCalls) {
          const fn = call.function.name;
          const argsJson = call.function.arguments || '{}';
          let parsed: any;
          try {
            parsed = JSON.parse(argsJson);
          } catch {
            parsed = {};
          }

          let result: any;
          try {
            result = await toolHandler({
              id: call.id,
              name: fn,
              arguments: parsed,
            });
          } catch (e: any) {
            result = { error: e?.message ?? 'tool error' };
          }

          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: call.id,
                type: 'function',
                function: { name: fn, arguments: argsJson },
              },
            ],
          } as any);

          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content:
              typeof result === 'string' ? result : JSON.stringify(result),
          } as any);
        }

        resp = await runTurn();
      }
    } catch (error) {
      this.logger.error(
        `Error in respondWithTools with ${this.currentProvider}:`,
        error,
      );
      throw error;
    }
  }

  // Method to switch providers at runtime
  switchProvider(provider: LLMProvider) {
    this.currentProvider = provider;
    this.logger.log(`Switched to LLM provider: ${provider}`);
  }

  // Get current provider
  getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }

  // Get available models for current provider
  async getAvailableModels(): Promise<string[]> {
    switch (this.currentProvider) {
      case LLMProvider.GROQ:
        return this.getAvailableGroqModels();
      case LLMProvider.OPENAI:
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
      case LLMProvider.ZERO_G:
        return ['phala/gpt-oss-120b', 'phala/deepseek-chat-v3-0324'];
      default:
        return [];
    }
  }
}
