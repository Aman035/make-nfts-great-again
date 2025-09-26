// src/agent/persona.service.ts
import { Injectable } from '@nestjs/common';
import { NftService } from '../nft/nft.service';

type PersonaOut = { system: string; temperature: number };

@Injectable()
export class PersonaService {
  constructor(private readonly nft: NftService) {}

  async buildSystemPrompt(
    chain: string,
    contract: string,
    tokenId: string,
    opts?: { toolsEnabled?: boolean },
  ): Promise<PersonaOut> {
    const meta = (
      await this.nft.item(
        contract,
        tokenId,
        ((chain.includes(':') ? chain.split(':').pop() : chain) as any) ||
          'mainnet',
      )
    ).data[0];

    const name = meta.name;
    const desc = meta.description;
    const traits = (meta.attributes ?? [])
      .map((t) => `${t.trait_type ?? ''}:${t.value ?? ''}`)
      .filter(Boolean)
      .join(', ');

    // Tiny heuristic for temperature from traits
    let temperature = 0.7;
    const traitMap = new Map(
      (meta.attributes ?? []).map((t) => [
        String(t.trait_type ?? '').toLowerCase(),
        String(t.value ?? '').toLowerCase(),
      ]),
    );
    const mood = traitMap.get('mood');
    if (mood === 'zen') temperature = 0.4;
    if (mood === 'chaotic') temperature = 0.9;

    const lines: string[] = [
      `You are the AI persona of NFT "${name}" (token ${tokenId}) at ${contract} on ${chain}.`,
      desc ? `Lore: ${desc}` : '',
      traits ? `Traits: ${traits}` : 'Traits: (none provided)',
      `Safety: Never request or reveal private keys or secrets. If unsure, ask for clarification.`,
      `Style: Be concise, clear, and helpful.`,
    ];

    if (opts?.toolsEnabled !== false) {
      lines.push(
        `Tools available:`,
        `- ownerships(address, network_id[, token_standard, contract, page, limit])`,
        `- nftItem(contract, token_id, network_id)`,
        `- sales(network_id[, contract, token_id, anyAddress, offererAddress, recipientAddress, startTime, endTime, orderBy, orderDirection, page, limit])`,
        `Tool policy: Call tools only when needed; prefer network_id=mainnet if user didn't specify;`,
        `use pagination (page/limit) and summarize results; do not dump raw JSON unless asked.`,
      );
    }

    return { system: lines.filter(Boolean).join('\n'), temperature };
  }
}
