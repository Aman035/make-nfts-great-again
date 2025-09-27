# NFT AI Companion Platform

A full-stack web3 application that creates AI companions for NFTs, enabling users to chat with their digital collectibles and explore blockchain data through intelligent conversations.

## 🌟 Features

### Core Functionality

- **AI NFT Companions**: Each NFT becomes a unique AI personality that users can chat with
- **Blockchain Data Integration**: Real-time access to NFT metadata, ownership, transfer history, and token balances
- **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche, and Unichain
- **Dynamic Personality System**: NFTs develop friendship levels and happiness based on user interactions and on-chain activity
- **IPFS Integration**: Automatic resolution of NFT metadata from IPFS
- **Web3 Wallet Integration**: Connect with RainbowKit and Wagmi

### AI Capabilities

- **Contextual Conversations**: NFTs remember past interactions and user preferences
- **Blockchain Analysis**: AI can analyze token transfers, balances, and NFT ownership
- **Tool-Based Responses**: Uses function calling to fetch real-time blockchain data
- **Anti-Hallucination**: Strict rules prevent AI from fabricating blockchain information

## 🏗️ Architecture

### Backend (NestJS)

- **NFT Agent Service**: Core AI companion logic with personality management
- **Graph MCP Integration**: Direct access to The Graph's Token API for blockchain data
- **LLM Provider System**: Support for multiple AI providers (Groq, ZeroG)
- **IPFS Resolver**: Handles IPFS metadata resolution
- **Health Monitoring**: System health and status endpoints

### Frontend (Next.js)

- **Modern UI**: Built with Tailwind CSS, Radix UI, and Framer Motion
- **Web3 Integration**: RainbowKit for wallet connection and Wagmi for blockchain interactions
- **Responsive Design**: Mobile-first approach with smooth animations
- **Chat Interface**: Real-time conversation with NFT companions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- Access to The Graph MCP server

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd project-x
```

2. **Install dependencies**

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

3. **Environment Setup**

```bash
# Backend environment variables
cd backend
cp .env.example .env
# Configure your environment variables
```

4. **Start the development servers**

```bash
# Terminal 1 - Backend
cd backend
pnpm run start:dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api

## 📡 API Endpoints

### NFT Agent

- `POST /api/nft-agent/{chain}/{contract}/{tokenId}/{address}/talk` - Chat with an NFT
- `GET /api/nft-agent/chains` - Get supported blockchain networks

### Graph MCP

- `GET /api/graph-mcp/chains` - List supported chains
- `GET /api/graph-mcp/status` - Check MCP connection status
- `POST /api/graph-mcp/query` - Execute custom SQL queries
- `GET /api/graph-mcp/{chain}/nft/{contract}/{tokenId}` - Get NFT details
- `GET /api/graph-mcp/{chain}/address/{address}/nfts` - Get user's NFTs
- `GET /api/graph-mcp/{chain}/address/{address}/eth-balance` - Get ETH balance

### Health & Monitoring

- `GET /api/health` - System health check

## 🔧 Configuration

### Supported Blockchains

- **Ethereum Mainnet**: `mainnet:evm-tokens@v1.17.2`, `mainnet:evm-nft-tokens@v0.6.2`
- **Polygon**: `matic:evm-tokens@v1.17.2`, `matic:evm-nft-tokens@v0.5.1`
- **Arbitrum**: `arbitrum-one:evm-tokens@v1.16.0`, `arbitrum-one:evm-nft-tokens@v0.5.1`
- **Optimism**: `optimism:evm-tokens@v1.17.2`, `optimism:evm-nft-tokens@v0.5.1`
- **Base**: `base:evm-tokens@v1.17.2`, `base:evm-nft-tokens@v0.5.1`
- **BSC**: `bsc:evm-tokens@v1.17.2`, `bsc:evm-nft-tokens@v0.5.1`
- **Avalanche**: `avalanche:evm-tokens@v1.17.2`, `avalanche:evm-nft-tokens@v0.5.1`
- **Unichain**: `unichain:evm-tokens@v1.17.2`, `unichain:evm-nft-tokens@v0.5.1`

### LLM Providers

- **Groq**: High-performance inference
- **ZeroG**: Alternative AI provider

## 🎮 Usage Examples

### Chat with an NFT

```bash
curl -X POST 'http://localhost:3001/api/nft-agent/mainnet/0x5Af0D9827E0c53E4799BB226655A1de152A425a5/12/0x9393ef54480e2bb46AC1EA5D0623cFf0badB99ac/talk' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Who is your owner?",
    "context": {
      "includeHistory": true,
      "maxTokens": 1000
    }
  }'
```

### Get NFT Details

```bash
curl -X GET 'http://localhost:3001/api/graph-mcp/mainnet/nft/0x5Af0D9827E0c53E4799BB226655A1de152A425a5/12'
```

### Check ETH Balance

```bash
curl -X GET 'http://localhost:3001/api/graph-mcp/mainnet/address/0x9393ef54480e2bb46AC1EA5D0623cFf0badB99ac/eth-balance'
```

## 🧠 AI Personality System

### Friendship Levels

- **Base Level**: 5 points
- **Memory-Based**: Up to 60 points based on interaction history and user preferences
- **Recent Activity**: Up to 20 points for interactions within the last week
- **Ownership Bonus**: +15 points if user owns the NFT
- **Non-Owner Cap**: Maximum 70 points for non-owners

### Happiness Levels

- **Base Level**: 30 points
- **ETH Balance**: Up to 25 points (logarithmic scale)
- **Token Diversity**: Up to 20 points based on ERC20 token variety
- **NFT Collection**: Up to 15 points based on total NFT holdings
- **Transfer Activity**: -15 points (recent transfers reduce happiness)

## 🛠️ Development

### Project Structure

```
project-x/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── nft-agent/      # NFT AI companion logic
│   │   ├── graph-mcp/      # Blockchain data integration
│   │   ├── llm/            # AI provider management
│   │   ├── ipfs/           # IPFS metadata resolution
│   │   └── health/         # System monitoring
│   └── package.json
├── frontend/               # Next.js web application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and configurations
│   └── package.json
└── README.md
```

### Key Technologies

- **Backend**: NestJS, TypeScript, The Graph MCP
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Radix UI
- **Web3**: Wagmi, RainbowKit, Viem
- **AI**: Groq, OpenAI-compatible APIs
- **Database**: The Graph's Token API
- **Storage**: IPFS for NFT metadata

### Available Scripts

```bash
# Backend
pnpm run start:dev    # Development server
pnpm run build        # Production build
pnpm run test         # Run tests
pnpm run lint         # Lint code

# Frontend
pnpm run dev          # Development server
pnpm run build        # Production build
pnpm run lint         # Lint code
```

## 🔒 Security Features

- **SQL Injection Prevention**: Parameterized queries and validation
- **Rate Limiting**: Built into MCP server
- **Read-Only Access**: Database queries are read-only
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Graceful error responses

## 📊 Performance Optimizations

- **Optimized Queries**: Reduced database calls from 4 to 2 for NFT details
- **Caching**: Built-in MCP caching for frequently accessed data
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: Frontend components load on demand

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
