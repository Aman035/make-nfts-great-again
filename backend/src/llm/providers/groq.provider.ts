import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LLMProviderInterface,
  LLMProvider,
  LLMResponse,
  ToolDef,
  ToolCall,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements LLMProviderInterface {
  private readonly logger = new Logger(GroqProvider.name);
  readonly provider = LLMProvider.GROQ;

  private buildClient(): OpenAI {
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

  async respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<LLMResponse> {
    const { system, user, temperature = 0.7 } = args;

    try {
      const client = this.buildClient();
      const model = 'llama-3.1-8b-instant'; // Default Groq model

      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
      });

      return {
        content: res.choices?.[0]?.message?.content ?? '',
        provider: this.provider,
        model,
        usage: res.usage,
      };
    } catch (error) {
      this.logger.error(`Error in Groq respondText:`, error);
      throw error;
    }
  }

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
    const { system, user, tools, toolHandler, temperature = 0.7 } = args;

    try {
      const client = this.buildClient();
      const model = 'llama-3.1-8b-instant'; // Default Groq model

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

        if (tools && tools.length > 0) {
          requestConfig.tools = tools;
          requestConfig.tool_choice = 'auto';
        }

        return client.chat.completions.create(requestConfig);
      };

      let resp = await runTurn();

      while (true) {
        const msg = resp.choices?.[0]?.message;
        const toolCalls = (msg?.tool_calls ?? []) as ToolCall[];

        if (!toolCalls.length) {
          return {
            content: msg?.content ?? '',
            provider: this.provider,
            model,
            usage: resp.usage,
          };
        }

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
      this.logger.error(`Error in Groq respondWithTools:`, error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}
