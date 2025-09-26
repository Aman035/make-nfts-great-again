// src/agent/tools.def.ts
import OpenAI from 'openai';

export const TokenApiChatToolDefs: OpenAI.Chat.Completions.ChatCompletionTool[] =
  [
    {
      type: 'function',
      function: {
        name: 'ownerships',
        description: 'NFT ownerships for an EVM account (supports page/limit).',
        parameters: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            network_id: {
              type: 'string',
              enum: [
                'mainnet',
                'arbitrum-one',
                'avalanche',
                'base',
                'bsc',
                'matic',
                'optimism',
                'unichain',
              ],
            },
            token_standard: { type: 'string', enum: ['ERC721', 'ERC1155'] },
            contract: { type: 'string' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
          required: ['address', 'network_id'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    {
      type: 'function',
      function: {
        name: 'nftItem',
        description: 'Single NFT item: metadata, ownership & traits.',
        parameters: {
          type: 'object',
          properties: {
            contract: { type: 'string' },
            token_id: { type: 'string' },
            network_id: {
              type: 'string',
              enum: [
                'mainnet',
                'arbitrum-one',
                'avalanche',
                'base',
                'bsc',
                'matic',
                'optimism',
                'unichain',
              ],
            },
          },
          required: ['contract', 'token_id', 'network_id'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    {
      type: 'function',
      function: {
        name: 'sales',
        description:
          'Latest NFT marketplace sales with rich filters (supports page/limit).',
        parameters: {
          type: 'object',
          properties: {
            network_id: {
              type: 'string',
              enum: [
                'mainnet',
                'arbitrum-one',
                'avalanche',
                'base',
                'bsc',
                'matic',
                'optimism',
                'unichain',
              ],
            },
            contract: { type: 'string' },
            token_id: { type: 'string' },
            anyAddress: { type: 'string' },
            offererAddress: { type: 'string' },
            recipientAddress: { type: 'string' },
            startTime: { type: 'number' },
            endTime: { type: 'number' },
            orderBy: { type: 'string', enum: ['timestamp'] },
            orderDirection: { type: 'string', enum: ['asc', 'desc'] },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
          required: ['network_id'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  ];
