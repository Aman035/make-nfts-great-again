import { Injectable } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { LLMService } from './llm.service';
import { TokenApiToolsService } from './tokenapi-tools.service';
import { TokenApiChatToolDefs } from './tools.def';

@Injectable()
export class AgentService {
  constructor(
    private readonly persona: PersonaService,
    private readonly llm: LLMService,
    private readonly tokenTools: TokenApiToolsService,
  ) {}

  async talk(
    chain: string,
    contract: string,
    tokenId: string,
    message: string,
    opts?: {
      allowTools?: boolean;
      userAddress?: string;
      defaultNetwork?: string;
    },
  ) {
    const { system, temperature } = await this.persona.buildSystemPrompt(
      chain,
      contract,
      tokenId,
    );

    // Enable/disable tools
    const tools = opts?.allowTools === false ? undefined : TokenApiChatToolDefs;

    // NOTE: include 'id' to match LLMService's expected type (we ignore it here)
    const toolHandler = async (call: {
      id?: string;
      name: string;
      arguments: any;
    }) => {
      switch (call.name) {
        case 'ownerships':
          return this.tokenTools.ownerships(call.arguments);
        case 'nftItem':
          return this.tokenTools.nftItem(call.arguments);
        case 'sales':
          return this.tokenTools.sales(call.arguments);
        default:
          throw new Error(`Unknown tool: ${call.name}`);
      }
    };

    const reply = await this.llm.respondWithTools({
      system:
        system +
        `\n\nTool policy:\n- Prefer network_id=${opts?.defaultNetwork ?? 'mainnet'} if user didn't specify.\n- Summarize results; page/limit for long lists.`,
      user:
        (opts?.userAddress
          ? `UserAddress default: ${opts.userAddress}\n\n`
          : '') + message,
      tools,
      toolHandler,
      temperature,
    });

    return {
      agent: { chain, contract, tokenId },
      personaPreview: { temperature, toolsEnabled: !!tools },
      reply,
    };
  }
}
