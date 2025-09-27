'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

const nftCollections = [
  {
    id: 'milady',
    name: 'Milady',
    tagline: "Let's vibe!",
    image: '/milady.jpeg',
    gradient: 'from-cyan-400/20 to-cyan-600/20',
    contract: '0x5Af0D9827E0c53E4799BB226655A1de152A425a5',
    network: 'mainnet',
    lastTokenId: 10000,
  },
  {
    id: 'azuki',
    name: 'Azuki',
    tagline: 'Ready to explore!',
    image: '/azuki.png',
    gradient: 'from-cyan-400/20 to-cyan-600/20',
    contract: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
    network: 'mainnet',
    lastTokenId: 10000,
  },
  {
    id: 'pudgy',
    name: 'Pudgy Penguin',
    tagline: 'Waddle into fun!',
    image: '/pudgy.jpeg',
    gradient: 'from-cyan-400/20 to-cyan-600/20',
    contract: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
    network: 'mainnet',
    lastTokenId: 8888,
  },
]

export function NFTCardsSection() {
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean
  }>({})
  const router = useRouter()

  const handleBringToLife = async (nft: (typeof nftCollections)[0]) => {
    setLoadingStates((prev) => ({ ...prev, [nft.id]: true }))

    // Simulate loading time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate random token ID
    const randomTokenId = Math.floor(Math.random() * nft.lastTokenId)

    // Navigate to chat
    router.push(`/talk/${nft.network}:${nft.contract}:${randomTokenId}`)
  }

  return (
    <section
      id="nft-cards-section"
      className="py-20 px-4 md:px-6 cyberpunk-grid"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h3 mb-4 text-balance text-primary">
            Choose Your NFT Companion
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto">
            Select from popular NFT collections or bring your own. Each NFT
            knows about its onchain data and has its unique personality waiting
            to chat with you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {nftCollections.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group w-full max-w-sm"
            >
              <Card className="overflow-hidden neon-border hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/80 backdrop-blur-sm aspect-[2/3]">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Image Section - Takes up most of the card */}
                  <div className="relative flex-1 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={nft.image || '/placeholder.svg'}
                        alt={nft.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Subtle overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                      {/* Floating elements for visual interest */}
                      <div className="absolute top-4 right-4 w-3 h-3 bg-primary/60 rounded-full animate-pulse" />
                      <div
                        className="absolute bottom-4 left-4 w-2 h-2 bg-accent/60 rounded-full animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 space-y-3 bg-gradient-to-t from-card/95 to-card/80 backdrop-blur-sm">
                    <div className="text-center">
                      <h3 className="text-h6 text-balance text-primary font-semibold mb-1">
                        {nft.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {nft.tagline}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleBringToLife(nft)}
                      disabled={loadingStates[nft.id]}
                      className="w-full h-10 bg-primary/20 border border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 neon-border"
                    >
                      {loadingStates[nft.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Bringing to Life...
                        </>
                      ) : (
                        'Bring to Life'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
