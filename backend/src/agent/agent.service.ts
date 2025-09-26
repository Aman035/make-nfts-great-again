// src/agent/agent.service.ts
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { NftService } from '../nft/nft.service';

/**
 * What we expect from NftService.getNftMetadata(...)
 * Adjust if your NftService returns a different shape.
 */
type NormalizedMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
  raw?: any;
};

type BaseId = { chain: string; contract: string; tokenId: string };

type Persona = {
  systemPrompt: string;
  temperature: number;
  styleHints: string[];
  tools: Array<{ name: string; description?: string }>;
  ttlAt: number; // epoch millis for cache expiry
};

type TalkArgs = BaseId & {
  message: string;
  forceRefreshPersona?: boolean;
  // Free-form context (optional): pass UI/user hints, etc.
  context?: Record<string, any>;
};

type StreamArgs = TalkArgs;

/**
 * Stateless agent service:
 * - Derives an agent persona from NFT metadata on demand.
 * - No conversation memory persists between calls.
 * - Optional short-lived persona cache to avoid refetching tokenURI on each call.
 */
@Injectable()
export class AgentService {
  constructor(private readonly nft: NftService) {}

  // --- persona caching (optional but useful) ---
  private personaCache = new Map<string, Persona>();
  private readonly personaTtlMs = 10 * 60 * 1000; // 10 minutes

  // --- public API ---

  /**
   * Generate a one-shot response for a message addressed to a specific NFT.
   * No memory updates; purely stateless.
   */
  async talk(args: TalkArgs) {
    const { chain, contract, tokenId, message, context, forceRefreshPersona } =
      args;

    const persona = await this.getPersona(
      { chain, contract, tokenId },
      { forceRefresh: !!forceRefreshPersona },
    );

    // Compose model input (system + single user message)
    const reply = await this.callLlm({
      system: persona.systemPrompt,
      user: this.truncate(message, 4000),
      temperature: persona.temperature,
      tools: persona.tools,
      context,
    });

    return {
      agent: { chain, contract, tokenId },
      personaPreview: {
        temperature: persona.temperature,
        styleHints: persona.styleHints,
        tools: persona.tools.map((t) => t.name),
      },
      reply,
    };
  }

  /**
   * Stream a response as tokens/chunks (SSE-friendly).
   * Still stateless: derives persona, generates, streams tokens.
   */
  stream(args: StreamArgs): Observable<string> {
    const subject = new Subject<string>();

    // We build the full reply once, then stream it as chunks.
    (async () => {
      try {
        const {
          chain,
          contract,
          tokenId,
          message,
          context,
          forceRefreshPersona,
        } = args;
        const persona = await this.getPersona(
          { chain, contract, tokenId },
          { forceRefresh: !!forceRefreshPersona },
        );

        const full = await this.callLlm({
          system: persona.systemPrompt,
          user: this.truncate(message, 4000),
          temperature: persona.temperature,
          tools: persona.tools,
          context,
          stream: false, // Replace with true if your LLM SDK supports streaming and call subject.next on each chunk
        });

        // Naive tokenization: split on spaces for demo; replace with real provider streaming.
        const tokens = full.split(/(\s+)/); // keep spaces
        for (const tok of tokens) {
          subject.next(tok);
          // small delay for effect; remove or tune as needed
          await this.sleep(20);
        }
        subject.complete();
      } catch (err: any) {
        subject.error(err);
      }
    })();

    return subject.asObservable();
  }

  // --- persona derivation ---

  private async getPersona(
    id: BaseId,
    opts?: { forceRefresh?: boolean },
  ): Promise<Persona> {
    const key = this.key(id);
    const now = Date.now();

    if (!opts?.forceRefresh) {
      const cached = this.personaCache.get(key);
      if (cached && cached.ttlAt > now) return cached;
    }

    const meta = (await this.nft.getNftMetadata(
      id.chain,
      id.contract,
      id.tokenId,
    )) as NormalizedMetadata;

    const persona = this.buildPersonaFromMetadata(id, meta);
    this.personaCache.set(key, persona);
    return persona;
  }

  private buildPersonaFromMetadata(
    id: BaseId,
    meta: NormalizedMetadata,
  ): Persona {
    const name = this.clean(meta?.name ?? `Token ${id.tokenId}`);
    const desc = this.truncate(this.clean(meta?.description ?? ''), 2000);

    const attributes = Array.isArray(meta?.attributes) ? meta!.attributes! : [];
    const traitPairs = attributes
      .map(
        (t) =>
          `${this.clean(String(t.trait_type ?? ''))}:${this.clean(String(t.value ?? ''))}`,
      )
      .filter(Boolean);

    // Heuristic behavior knobs derived from traits
    const traitMap = new Map(
      attributes.map((t) => [
        String(t.trait_type ?? '').toLowerCase(),
        String(t.value ?? '').toLowerCase(),
      ]),
    );

    // Defaults
    let temperature = 0.7;
    const styleHints: string[] = [];
    const tools: Array<{ name: string; description?: string }> = [];

    // Examples: tweak as you wish
    const mood = traitMap.get('mood'); // e.g., "zen", "chaotic"
    if (mood === 'zen') {
      temperature = 0.4;
      styleHints.push('calm, minimal, succinct');
    } else if (mood === 'chaotic') {
      temperature = 0.9;
      styleHints.push('wild, exploratory, surprising');
    }

    const role = traitMap.get('role'); // e.g., "trader", "bard", "guide"
    if (role === 'trader') {
      tools.push({
        name: 'priceFeed',
        description: 'Fetch and summarize market prices',
      });
      styleHints.push('precise, data-driven, risk-aware');
    } else if (role === 'bard') {
      styleHints.push('storyteller voice, imaginative but concise');
    } else if (role === 'guide') {
      styleHints.push('instructive, friendly, step-by-step');
    }

    const lines: string[] = [
      `You are the AI persona of NFT "${name}" (token ${id.tokenId}) at ${id.contract} on ${id.chain}.`,
      desc ? `Lore/description: ${desc}` : '',
      traitPairs.length
        ? `Traits: ${traitPairs.join(', ')}`
        : 'Traits: (none provided)',
      styleHints.length
        ? `Style hints: ${styleHints.join('; ')}`
        : 'Style hints: neutral, helpful.',
      tools.length
        ? `Available tools: ${tools.map((t) => t.name).join(', ')}.`
        : 'Available tools: none.',
      `Safety: Never request or handle private keys or secrets. If unsure, say so and suggest what info is needed.`,
      `Be concise; favor clarity over verbosity.`,
    ].filter(Boolean);

    const systemPrompt = lines.join('\n');

    return {
      systemPrompt,
      temperature,
      styleHints,
      tools,
      ttlAt: Date.now() + this.personaTtlMs,
    };
  }

  // --- LLM adapter (replace with your provider) ---

  /**
   * Minimal LLM adapter. Swap this with OpenAI/Anthropic/your self-hosted endpoint.
   * If you add true streaming, call subject.next on each chunk in `stream()` above.
   */
  private async callLlm(args: {
    system: string;
    user: string;
    temperature: number;
    tools?: Array<{ name: string; description?: string }>;
    context?: Record<string, any>;
    stream?: boolean;
  }): Promise<string> {
    // --- Placeholder implementation ---
    // Replace this with real SDK calls (e.g., OpenAI Responses API with system+user messages).
    const { system, user, temperature } = args;

    // Tiny, obvious “LLM-ish” echo to show the wiring works:
    const response = [
      `(persona t=${temperature.toFixed(2)})`,
      `System says you're:`,
      this.truncate(system, 280),
      `\n\nUser: ${this.truncate(user, 1000)}`,
      `\n\nReply: Hello! I’m your NFT agent. Here’s a concise response based on my metadata and traits.`,
    ].join('\n');

    return response;
  }

  // --- utils ---

  private key(p: BaseId) {
    return `${p.chain}:${p.contract}:${p.tokenId}`;
  }

  private clean(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
  }

  private truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}
