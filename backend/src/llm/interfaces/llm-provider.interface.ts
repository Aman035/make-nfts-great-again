import OpenAI from 'openai';

export enum LLMProvider {
  GROQ = 'groq',
  ZERO_G = 'zero_g',
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage?: any;
}

export type ToolDef = OpenAI.Chat.Completions.ChatCompletionTool;

export type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export interface LLMProviderInterface {
  readonly provider: LLMProvider;

  respondText(args: {
    system: string;
    user: string;
    temperature?: number;
  }): Promise<LLMResponse>;

  respondWithTools(args: {
    system: string;
    user: string;
    tools?: ToolDef[];
    toolHandler: (call: {
      id: string;
      name: string;
      arguments: any;
    }) => Promise<any>;
    temperature?: number;
  }): Promise<LLMResponse>;

  isConfigured(): boolean;
}
