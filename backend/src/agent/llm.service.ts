import { Injectable } from '@nestjs/common';
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

@Injectable()
export class LLMService {
  private broker!: ZGComputeNetworkBroker;
  private pickedProvider?: string;
  private pickedEndpoint?: string;
  private pickedModel?: string;

  constructor() {}

  private async ensureReady() {
    if (this.broker) return;

    const rpc = process.env.OG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
    const pk = process.env.OG_PRIVATE_KEY;
    if (!pk) throw new Error('OG_PRIVATE_KEY is required');

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    this.broker = await createZGComputeNetworkBroker(wallet);

    // await this.broker.ledger.depositFund(0.1);

    await this.pickProviderAndModel();
  }

  private async pickProviderAndModel() {
    const services = await this.broker.inference.listService();
    if (!services?.length) throw new Error('No 0G services available');

    const preferred = ['phala/gpt-oss-120b', 'phala/deepseek-chat-v3-0324']; // fallback order
    let pick = services.find((s) =>
      preferred.some((p) => (s.model ?? '').toLowerCase().includes(p)),
    );

    if (!pick) pick = services[0];

    this.pickedProvider = pick.provider;
    await this.broker.inference.acknowledgeProviderSigner(this.pickedProvider);

    console.log('here');

    const { model, endpoint } = await this.broker.inference.getServiceMetadata(
      this.pickedProvider,
    );

    console.log(model, endpoint);

    if (!endpoint || !model)
      throw new Error('0G service metadata missing endpoint/model');
    this.pickedEndpoint = endpoint.replace(/\/+$/, '');
    this.pickedModel = model;
  }

  private async buildClientAndHeaders(promptForAuth: string) {
    await this.ensureReady();

    const headers = (await this.broker.inference.getRequestHeaders(
      this.pickedProvider!,
      promptForAuth,
    )) as any;

    const client = new OpenAI({
      apiKey: '', // any non-empty string is fine
      baseURL: this.pickedEndpoint, // provider’s OpenAI-compatible base
    });

    return { client, headers, model: this.pickedModel! };
  }

  async respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<string> {
    const { system, user, temperature = 0.7 } = args;
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
  }

  /** Function-calling loop (Chat Completions). */
  async respondWithTools(args: {
    system: string;
    user: string;
    tools?: ToolDef[]; // <— allow undefined (tools off)
    toolHandler: (call: {
      id: string;
      name: string;
      arguments: any;
    }) => Promise<any>;
    temperature?: number;
  }): Promise<string> {
    const { system, user, tools, toolHandler, temperature = 0.7 } = args;

    const authMsg = `${system}\n\nUSER: ${user}`.slice(0, 2000);
    const { client, headers, model } =
      await this.buildClientAndHeaders(authMsg);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    const runTurn = async () =>
      client.chat.completions.create(
        {
          model,
          messages,
          temperature,
          tools,
          tool_choice: tools ? 'auto' : undefined,
        },
        { headers },
      );

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
          content: typeof result === 'string' ? result : JSON.stringify(result),
        } as any);
      }

      resp = await runTurn();
    }
  }
}
