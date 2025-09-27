"use client"

import { Suspense, useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import { Card, CardContent } from "@/components/ui/card"

interface TalkPageProps {
  params: {
    nftId: string
  }
}

function TalkPageContent({ params }: TalkPageProps) {
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  // Parse the nftId parameter (format: ethereum:contract:tokenid)
  const parseNFTId = (nftId: string) => {
    const parts = nftId.split(":")
    if (parts.length === 3) {
      return {
        network: parts[0],
        contract: parts[1],
        tokenId: parts[2],
      }
    }

    // Fallback for collection names
    const collections: Record<string, any> = {
      milady: {
        name: "Milady #1234",
        collection: "Milady Maker",
        image: "/cute-anime-girl-nft-character-with-pink-hair.jpg",
        network: "ethereum",
        contract: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
        tokenId: "1234",
      },
      azuki: {
        name: "Azuki #5678",
        collection: "Azuki",
        image: "/anime-character-nft-with-red-hoodie-and-cool-style.jpg",
        network: "ethereum",
        contract: "0xed5af388653567af2f388e6224dc7c4b3241c544",
        tokenId: "5678",
      },
      pudgy: {
        name: "Pudgy Penguin #9012",
        collection: "Pudgy Penguins",
        image: "/cute-chubby-penguin-nft-character-with-colorful-ac.jpg",
        network: "ethereum",
        contract: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
        tokenId: "9012",
      },
      "bored-ape": {
        name: "Bored Ape #3456",
        collection: "Bored Ape Yacht Club",
        image: "/cool-ape-nft-character-with-sunglasses-and-hat.jpg",
        network: "ethereum",
        contract: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
        tokenId: "3456",
      },
    }

    return (
      collections[nftId] || {
        name: `NFT #${nftId}`,
        collection: "Unknown Collection",
        image: "/random-nft.jpg",
        network: "ethereum",
        contract: "unknown",
        tokenId: nftId,
      }
    )
  }

  const nftData = parseNFTId(params.nftId)

  if (!isWalletConnected) {
    return <WalletConnectModal onConnect={() => setIsWalletConnected(true)} />
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4 text-balance text-primary animate-neon-flicker">
          Chat with Your NFT
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Start building a friendship with your digital companion. The more you chat, the stronger your bond becomes!
        </p>
      </div>

      <ChatInterface
        nftImage={nftData.image}
        nftName={nftData.name}
        nftCollection={nftData.collection}
        network={nftData.network}
        contract={nftData.contract}
        tokenId={nftData.tokenId}
      />
    </div>
  )
}

export default function TalkPage({ params }: TalkPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container py-8 px-4 md:px-6">
          <Card className="neon-border bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <p className="text-primary">Loading your NFT companion...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TalkPageContent params={params} />
    </Suspense>
  )
}
