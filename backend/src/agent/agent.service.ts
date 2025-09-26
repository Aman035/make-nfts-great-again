import { Injectable } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { LLMService } from './llm.service';
import { MCPToolsService } from './mcp-tools.service';
import { MCPChatToolDefs } from './tools.def';

@Injectable()
export class AgentService {
  constructor(
    private readonly persona: PersonaService,
    private readonly llm: LLMService,
    private readonly mcpTools: MCPToolsService,
  ) {}

  async talk(
    chain: string,
    contract: string,
    tokenId: string,
    message: string,
    opts?: {
      userAddress?: string;
      defaultNetwork?: string;
    },
  ) {
    const { system, temperature } = await this.persona.buildSystemPrompt(
      chain,
      contract,
      tokenId,
    );

    // Always enable MCP tools
    const tools = MCPChatToolDefs;

    // NOTE: include 'id' to match LLMService's expected type (we ignore it here)
    const toolHandler = async (call: {
      id?: string;
      name: string;
      arguments: any;
    }) => {
      // MCP Database tools
      switch (call.name) {
        case 'list_databases':
          return this.mcpTools.listDatabases();
        case 'list_tables':
          return this.mcpTools.listTables(call.arguments);
        case 'describe_table':
          return this.mcpTools.describeTable(call.arguments);
        case 'query_blockchain_data':
          return this.mcpTools.queryBlockchainData(call.arguments);
        case 'get_token_transfers':
          return this.mcpTools.getTokenTransfers(call.arguments);
        case 'get_token_balances':
          return this.mcpTools.getTokenBalances(call.arguments);
        case 'analyze_token_activity':
          return this.mcpTools.analyzeTokenActivity(call.arguments);

        default:
          throw new Error(`Unknown tool: ${call.name}`);
      }
    };

    const reply = await this.llm.respondWithTools({
      system:
        system +
        `\n\nTool policy:\n- Prefer network_id=${opts?.defaultNetwork ?? 'mainnet'} if user didn't specify.\n- Summarize results; page/limit for long lists.\n- MCP tools available: Use list_databases to explore available blockchain data, then query_blockchain_data for custom SQL queries.\n- Popular databases: mainnet:evm-tokens@v1.16.0, mainnet:evm-nft-tokens@v0.6.2, arbitrum-one:evm-tokens@v1.16.0`,
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
      personaPreview: {
        temperature,
        toolsEnabled: true,
        mcpEnabled: true,
        availableTools: tools.map((t) =>
          t.type === 'function' ? t.function.name : 'unknown',
        ),
      },
      reply,
    };
  }
}
