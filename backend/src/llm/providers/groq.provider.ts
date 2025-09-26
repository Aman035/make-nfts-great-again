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

        // Check if the response contains raw function call XML instead of proper tool calls
        const content = msg?.content ?? '';
        if (!toolCalls.length && content.includes('</function>')) {
          this.logger.warn(
            'Detected raw function call XML in response, attempting to parse',
          );
          const parsedCalls = this.parseRawFunctionCalls(content);
          if (parsedCalls.length > 0) {
            // Process the parsed function calls
            for (const call of parsedCalls) {
              let result: any;
              try {
                result = await toolHandler({
                  id: `parsed_${Date.now()}_${Math.random()}`,
                  name: call.name,
                  arguments: call.arguments,
                });
              } catch (e: any) {
                result = { error: e?.message ?? 'tool error' };
              }

              messages.push({
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: `parsed_${Date.now()}_${Math.random()}`,
                    type: 'function',
                    function: {
                      name: call.name,
                      arguments: JSON.stringify(call.arguments),
                    },
                  },
                ],
              } as any);

              messages.push({
                role: 'tool',
                tool_call_id: `parsed_${Date.now()}_${Math.random()}`,
                content:
                  typeof result === 'string' ? result : JSON.stringify(result),
              } as any);
            }
            // Continue the loop to get the final response
            resp = await runTurn();
            continue;
          }
        }

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

  /**
   * Parse raw function call XML from LLM response
   */
  private parseRawFunctionCalls(
    content: string,
  ): Array<{ name: string; arguments: any }> {
    const calls: Array<{ name: string; arguments: any }> = [];

    // Match patterns like: </function>function_name>{arguments}</function>
    const functionCallRegex = /<\/function>([^<]+)>\{([^}]*)\}<\/function>/g;
    let match;

    while ((match = functionCallRegex.exec(content)) !== null) {
      const functionName = match[1].trim();
      const argsString = match[2].trim();

      let parsedArgs: any = {};
      if (argsString) {
        try {
          // Try to parse as JSON first
          parsedArgs = JSON.parse(`{${argsString}}`);
        } catch {
          // If JSON parsing fails, try to parse key-value pairs
          const pairs = argsString.split(',');
          for (const pair of pairs) {
            const [key, value] = pair
              .split(':')
              .map((s) => s.trim().replace(/['"]/g, ''));
            if (key && value) {
              parsedArgs[key] = value;
            }
          }
        }
      }

      calls.push({ name: functionName, arguments: parsedArgs });
    }

    return calls;
  }

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}
