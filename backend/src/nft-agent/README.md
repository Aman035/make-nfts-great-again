# NFT Agent Module

A specialized AI agent module for NFT interactions with SIWE authentication and Graph MCP integration.

## Features

- **SIWE Authentication**: Secure authentication using Sign-In with Ethereum
- **NFT-Specific Context**: Dynamic system prompts based on NFT metadata and user history
- **User Memory**: Persistent user interaction history and preferences
- **Graph MCP Integration**: Access to real-time blockchain data through The Graph's Token API
- **Tool-Based Responses**: LLM can use Graph MCP tools to provide accurate data

## Architecture

```
NFT Agent Module
├── NFTAgentService - Core agent logic
├── NFTAgentController - REST API endpoints
├── DTOs - Request/response validation
└── Dependencies
    ├── LLMService - AI responses
    └── GraphMCPService - Blockchain data access
```

## API Endpoints

### Authentication

#### Verify SIWE Signature

```http
POST /nft-agent/auth/verify
Content-Type: application/json

{
  "signature": "0x1234567890abcdef...",
  "message": "localhost:3000 wants you to sign in...",
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

### Main Interaction

#### Talk to NFT Agent

```http
POST /nft-agent/{chain}/{contract}/{tokenId}/talk
Authorization: Bearer {userAddress}
Content-Type: application/json

{
  "message": "What can you tell me about this NFT?",
  "context": {
    "includeHistory": true,
    "maxTokens": 1000
  }
}
```

**Response:**

```json
{
  "response": "This NFT is part of the Bored Ape Yacht Club collection...",
  "nftInfo": {
    "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    "tokenId": "1234",
    "name": "Bored Ape #1234",
    "collection": "Bored Ape Yacht Club"
  },
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### User Management

#### Get User Memory

```http
GET /nft-agent/user/{address}/memory
```

**Response:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nftInteractions": [
    {
      "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "tokenId": "1234",
      "timestamp": "2024-01-15T10:30:00Z",
      "message": "What can you tell me about this NFT?",
      "response": "This NFT is part of the Bored Ape Yacht Club collection..."
    }
  ],
  "preferences": {},
  "stats": {
    "totalInteractions": 1,
    "favoriteCollections": [],
    "lastActive": "2024-01-15T10:30:00Z"
  }
}
```

### Health Check

#### Service Status

```http
GET /nft-agent/health
```

## System Prompt Generation

The agent generates dynamic system prompts based on:

1. **NFT Context**: Contract, token ID, name, collection, description
2. **User Context**: Address, interaction history, preferences
3. **Available Tools**: Graph MCP capabilities
4. **Recent Interactions**: Last 5 conversations for context

### Example System Prompt

```
You are an AI agent specialized in NFT analysis and conversation. You have access to blockchain data through The Graph's Token API.

NFT Context:
- Contract: 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D
- Token ID: 1234
- Name: Bored Ape #1234
- Collection: Bored Ape Yacht Club

User Context:
- Address: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
- Total Interactions: 5
- Last Active: 2024-01-15T10:30:00Z

Available Tools:
- Graph MCP: Query blockchain data, NFT metadata, transfer history, holder information
- User Memory: Access previous conversations and preferences

Instructions:
1. Be helpful and informative about NFTs and blockchain data
2. Use Graph MCP tools to provide accurate, real-time data
3. Reference user's interaction history when relevant
4. Provide insights about NFT rarity, market data, and blockchain activity
5. Be conversational and engaging

Recent User Interactions:
- 2024-01-15T10:30:00Z: What can you tell me about this NFT? -> This NFT is part of the Bored Ape Yacht Club collection...
```

## Graph MCP Tools

The agent has access to these Graph MCP tools:

### 1. List Databases

```typescript
{
  name: 'list_databases',
  description: 'List available databases from The Graph Token API'
}
```

### 2. List Tables

```typescript
{
  name: 'list_tables',
  description: 'List tables for a specific database',
  parameters: {
    database: 'string' // e.g., 'mainnet:evm-nft-tokens@v0.6.2'
  }
}
```

### 3. Describe Table

```typescript
{
  name: 'describe_table',
  description: 'Get table schema and column information',
  parameters: {
    database: 'string',
    table: 'string'
  }
}
```

### 4. Run Query

```typescript
{
  name: 'run_query',
  description: 'Execute SQL query on blockchain data',
  parameters: {
    query: 'string' // ClickHouse syntax
  }
}
```

## User Memory System

### Memory Structure

- **NFT Interactions**: History of conversations with specific NFTs
- **Preferences**: User preferences and settings
- **Stats**: Interaction statistics and analytics

### Memory Management

- **Automatic Updates**: Each interaction updates user memory
- **Size Limits**: Keeps only last 100 interactions per user
- **Persistence**: In-memory storage (TODO: Add database persistence)

## Usage Examples

### 1. Basic NFT Query

```bash
curl -X POST "http://localhost:3000/nft-agent/mainnet/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234/talk" \
  -H "Authorization: Bearer 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you tell me about this NFT?"}'
```

### 2. NFT Transfer History

```bash
curl -X POST "http://localhost:3000/nft-agent/mainnet/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234/talk" \
  -H "Authorization: Bearer 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me the transfer history for this NFT"}'
```

### 3. NFT Holder Analysis

```bash
curl -X POST "http://localhost:3000/nft-agent/mainnet/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234/talk" \
  -H "Authorization: Bearer 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are the current holders of this NFT collection?"}'
```

## Configuration

### Environment Variables

- `MCP_ACCESS_TOKEN`: The Graph Token API access token
- `LLM_PROVIDER`: LLM provider (groq, zerog)

### Dependencies

- `@nestjs/common`: NestJS framework
- `ethers`: Ethereum utilities for SIWE
- `class-validator`: DTO validation
- `@nestjs/swagger`: API documentation

## TODO

- [ ] Implement proper SIWE verification
- [ ] Add database persistence for user memory
- [ ] Implement NFT metadata fetching from Graph MCP
- [ ] Add query validation for security
- [ ] Implement popular tokens analysis
- [ ] Add rate limiting
- [ ] Add caching for frequently accessed data
- [ ] Implement user preferences management
- [ ] Add analytics and metrics collection

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Running

```bash
npm run start:dev
```

## Integration

The NFT Agent module integrates with:

- **LLM Service**: For AI responses and tool calling
- **Graph MCP Service**: For blockchain data access
- **SIWE**: For secure authentication
- **Swagger**: For API documentation

## Security

- **SIWE Authentication**: Secure wallet-based authentication
- **Input Validation**: DTO validation for all requests
- **Query Sanitization**: TODO: Add SQL injection protection
- **Rate Limiting**: TODO: Add request rate limiting
