import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ethers } from 'ethers';
import {
  createZGComputeNetworkBroker,
  type ZGComputeNetworkBroker,
} from '@0glabs/0g-serving-broker';
import {
  LLMProviderInterface,
  LLMProvider,
  LLMResponse,
  ToolDef,
  ToolCall,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class ZeroGProvider implements LLMProviderInterface {
  private readonly logger = new Logger(ZeroGProvider.name);
  readonly provider = LLMProvider.ZERO_G;

  private broker?: ZGComputeNetworkBroker;
  private pickedProvider?: string;
  private pickedEndpoint?: string;
  private pickedModel?: string;

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

  async respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<LLMResponse> {
    const { system, user, temperature = 0.7 } = args;

    try {
      const authMsg = `${system}\n\nUSER: ${user}`.slice(0, 2000);
      const { client, headers, model } =
        await this.buildZeroGClientAndHeaders(authMsg);

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

      return {
        content: res.choices?.[0]?.message?.content ?? '',
        provider: this.provider,
        model,
        usage: res.usage,
      };
    } catch (error) {
      this.logger.error(`Error in 0G respondText:`, error);
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
      const authMsg = `${system}\n\nUSER: ${user}`.slice(0, 2000);
      const { client, headers, model } =
        await this.buildZeroGClientAndHeaders(authMsg);

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

        if (tools) {
          requestConfig.tools = tools;
          requestConfig.tool_choice = 'auto';
        }

        return client.chat.completions.create(requestConfig, { headers });
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
      this.logger.error(`Error in 0G respondWithTools:`, error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(process.env.OG_PRIVATE_KEY && process.env.OG_EVM_RPC);
  }
}
