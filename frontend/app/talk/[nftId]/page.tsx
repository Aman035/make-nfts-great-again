'use client'

import { Suspense } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { WalletConnectModal } from '@/components/wallet-connect-modal'
import { Card, CardContent } from '@/components/ui/card'
import { useAccount } from 'wagmi'

interface TalkPageProps {
  params: {
    nftId: string
  }
}

function TalkPageContent({ params }: TalkPageProps) {
  const { isConnected } = useAccount()

  // Parse the nftId parameter (format: network:contract:tokenId)
  const parseNFTId = (nftId: string) => {
    console.log('Parsing NFT ID:', nftId)

    // URL decode the nftId in case it's encoded
    const decodedNftId = decodeURIComponent(nftId)
    console.log('Decoded NFT ID:', decodedNftId)

    const parts = decodedNftId.split(':')
    console.log('Split parts:', parts)

    if (parts.length === 3) {
      const [network, contract, tokenId] = parts
      console.log('Parsed NFT data:', { network, contract, tokenId })

      return {
        network,
        contract,
        tokenId,
        name: undefined, // Will be fetched from backend
        collection: undefined, // Will be fetched from backend
        image: '/placeholder.svg', // Default image
      }
    }

    // Fallback for collection names
    const collections: Record<string, any> = {
      milady: {
        name: 'Milady #1234',
        collection: 'Milady Maker',
        image: '/milady.jpeg',
        network: 'mainnet',
        contract: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
        tokenId: '1234',
      },
      azuki: {
        name: 'Azuki #5678',
        collection: 'Azuki',
        image: '/azuki.jpeg',
        network: 'mainnet',
        contract: '0xed5af388653567af2f388e6224dc7c4b3241c544',
        tokenId: '5678',
      },
      pudgy: {
        name: 'Pudgy Penguin #9012',
        collection: 'Pudgy Penguins',
        image: '/pudgy.png',
        network: 'mainnet',
        contract: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
        tokenId: '9012',
      },
      'bored-ape': {
        name: 'Bored Ape #3456',
        collection: 'Bored Ape Yacht Club',
        image: '/random-nft.jpg',
        network: 'mainnet',
        contract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        tokenId: '3456',
      },
    }

    return (
      collections[decodedNftId] || {
        name: `NFT #${decodedNftId}`,
        collection: 'Unknown Collection',
        image: '/placeholder.svg',
        network: 'mainnet',
        contract: 'unknown',
        tokenId: decodedNftId,
      }
    )
  }

  const nftData = parseNFTId(params.nftId)

  if (!isConnected) {
    return <WalletConnectModal />
  }

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="w-full max-w-6xl mx-auto">
        <ChatInterface
          nftImage={nftData.image}
          nftName={nftData.name}
          nftCollection={nftData.collection}
          network={nftData.network}
          contract={nftData.contract}
          tokenId={nftData.tokenId}
        />
      </div>
    </div>
  )
}

export default function TalkPage({ params }: TalkPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-8 px-4 md:px-6">
          <div className="w-full max-w-6xl mx-auto cyberpunk-grid">
            <Card className="neon-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-primary/20 rounded mb-4 mx-auto w-64"></div>
                  <div className="h-4 bg-muted rounded mb-2 mx-auto w-48"></div>
                  <div className="h-4 bg-muted rounded mx-auto w-32"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <TalkPageContent params={params} />
    </Suspense>
  )
}
