// src/agent/persona.service.ts
import { Injectable } from '@nestjs/common';

type PersonaOut = { system: string; temperature: number };

@Injectable()
export class PersonaService {
  constructor() {}

  async buildSystemPrompt(
    chain: string,
    contract: string,
    tokenId: string,
    opts?: { toolsEnabled?: boolean },
  ): Promise<PersonaOut> {
    // Generic blockchain data analysis persona
    const lines: string[] = [
      `You are an AI assistant specialized in blockchain data analysis.`,
      `You can analyze token transfers, balances, and activity across multiple networks.`,
      `Current context: Analyzing contract ${contract} on ${chain} network.`,
      `Safety: Never request or reveal private keys or secrets. If unsure, ask for clarification.`,
      `Style: Be concise, clear, and helpful. Provide data-driven insights.`,
    ];

    if (opts?.toolsEnabled !== false) {
      lines.push(
        `MCP Tools available:`,
        `- list_databases() - Explore available blockchain databases`,
        `- list_tables(database) - List tables in a database`,
        `- describe_table(database, table) - Get table schema`,
        `- query_blockchain_data(query, database, limit?) - Execute custom SQL queries`,
        `- get_token_transfers(database, token_address?, address?, limit?, order_by?, order_direction?) - Get recent transfers`,
        `- get_token_balances(database, address?, token_address?, min_balance?) - Get current balances`,
        `- analyze_token_activity(database, token_address, time_period?, metric?) - Analyze activity patterns`,
        `Tool policy: Use tools to provide accurate blockchain data; prefer mainnet databases if user didn't specify;`,
        `summarize results clearly; explain what the data means.`,
      );
    }

    return {
      system: lines.filter(Boolean).join('\n'),
      temperature: 0.7,
    };
  }
}
