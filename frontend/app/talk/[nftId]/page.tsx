'use client'

import { Suspense, useState, useEffect } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { WalletConnectModal } from '@/components/wallet-connect-modal'
import { Card, CardContent } from '@/components/ui/card'
import { useAccount } from 'wagmi'

interface TalkPageProps {
  params: {
    nftId: string
  }
}

interface NFTInfo {
  contract: string
  tokenId: string
  name?: string
  collection?: string
  image?: string
}

interface UserInfo {
  address: string
  friendshipLevel: number
  happinessLevel: number
  totalInteractions: number
  lastInteraction: string
}

interface TalkResponse {
  response: string
  nftInfo?: NFTInfo
  userInfo?: UserInfo
  timestamp: string
  error?: string
}

function TalkPageContent({ params }: TalkPageProps) {
  const { isConnected, address } = useAccount()
  const [nftData, setNftData] = useState<{
    network: string
    contract: string
    tokenId: string
    name?: string
    collection?: string
    image?: string
    friendshipLevel?: number
    happinessLevel?: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      }
    }

    // Fallback for collection names
    const collections: Record<string, any> = {
      milady: {
        network: 'mainnet',
        contract: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
        tokenId: '1234',
      },
      azuki: {
        network: 'mainnet',
        contract: '0xed5af388653567af2f388e6224dc7c4b3241c544',
        tokenId: '5678',
      },
      pudgy: {
        network: 'mainnet',
        contract: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
        tokenId: '9012',
      },
      'bored-ape': {
        network: 'mainnet',
        contract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        tokenId: '3456',
      },
    }

    return (
      collections[decodedNftId] || {
        network: 'mainnet',
        contract: 'unknown',
        tokenId: decodedNftId,
      }
    )
  }

  // Fetch NFT data from backend using talk API
  const fetchNFTData = async (
    network: string,
    contract: string,
    tokenId: string,
    userAddress: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching NFT data from talk API:', {
        network,
        contract,
        tokenId,
        userAddress,
      })

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          'https://backend.make-nfts-great-again.xyz'
        }/api/nft-agent/${network}/${contract}/${tokenId}/${userAddress}/talk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello! Nice to meet you!',
            context: {
              includeHistory: false,
              maxTokens: 1000,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: TalkResponse = await response.json()
      console.log('Talk API response:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      // Extract NFT info and user info from response
      const nftInfo = data.nftInfo
      const userInfo = data.userInfo

      setNftData({
        network,
        contract: nftInfo?.contract || contract,
        tokenId: nftInfo?.tokenId || tokenId,
        name: nftInfo?.name,
        collection: nftInfo?.collection,
        image: nftInfo?.image || '/companion.png',
        friendshipLevel: userInfo?.friendshipLevel || 0,
        happinessLevel: userInfo?.happinessLevel || 0,
      })
    } catch (err) {
      console.error('Error fetching NFT data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT data')

      // Set fallback data
      const parsedData = parseNFTId(params.nftId)
      setNftData({
        ...parsedData,
        name: `NFT #${parsedData.tokenId}`,
        collection: 'Unknown Collection',
        image: '/companion.png',
        friendshipLevel: 0,
        happinessLevel: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      const parsedData = parseNFTId(params.nftId)
      fetchNFTData(
        parsedData.network,
        parsedData.contract,
        parsedData.tokenId,
        address
      )
    }
  }, [params.nftId, isConnected, address])

  if (!isConnected) {
    return <WalletConnectModal />
  }

  if (loading) {
    return (
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
    )
  }

  if (error || !nftData) {
    return (
      <div className="py-8 px-4 md:px-6">
        <div className="w-full max-w-6xl mx-auto">
          <Card className="neon-border bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <h2 className="text-xl font-bold mb-2">Error Loading NFT</h2>
                <p className="text-sm">{error || 'Failed to load NFT data'}</p>
              </div>
              <button
                onClick={() => {
                  if (address) {
                    const parsedData = parseNFTId(params.nftId)
                    fetchNFTData(
                      parsedData.network,
                      parsedData.contract,
                      parsedData.tokenId,
                      address
                    )
                  }
                }}
                className="px-4 py-2 bg-primary/20 border border-primary rounded-lg hover:bg-primary/30 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="w-full max-w-6xl mx-auto">
        <ChatInterface
          nftImage={nftData.image || '/companion.png'}
          nftName={nftData.name || `NFT #${nftData.tokenId}`}
          network={nftData.network}
          contract={nftData.contract}
          tokenId={nftData.tokenId}
          initialFriendshipLevel={nftData.friendshipLevel || 0}
          initialHappinessLevel={nftData.happinessLevel || 0}
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
