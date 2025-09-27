"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

const nftCollections = [
  {
    id: "milady",
    name: "Random Milady",
    tagline: "Let's vibe!",
    image: "/cute-anime-girl-nft-character-with-pink-hair.jpg",
    gradient: "from-cyan-400/20 to-cyan-600/20",
  },
  {
    id: "azuki",
    name: "Random Azuki",
    tagline: "Ready to explore!",
    image: "/anime-character-nft-with-red-hoodie-and-cool-style.jpg",
    gradient: "from-cyan-400/20 to-cyan-600/20",
  },
  {
    id: "pudgy",
    name: "Random Pudgy Penguin",
    tagline: "Waddle into fun!",
    image: "/cute-chubby-penguin-nft-character-with-colorful-ac.jpg",
    gradient: "from-cyan-400/20 to-cyan-600/20",
  },
  {
    id: "bored-ape",
    name: "Random Bored Ape",
    tagline: "Ape together strong!",
    image: "/cool-ape-nft-character-with-sunglasses-and-hat.jpg",
    gradient: "from-cyan-400/20 to-cyan-600/20",
  },
]

export function NFTCardsSection() {
  return (
    <section className="py-20 px-4 md:px-6 cyberpunk-grid">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 text-balance animate-neon-flicker">
            Choose Your NFT Companion
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Select from popular NFT collections or bring your own. Each NFT has its unique personality waiting to chat
            with you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
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
              <Card className="overflow-hidden neon-border hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div
                    className={`relative h-48 bg-gradient-to-br ${nft.gradient} flex items-center justify-center border-b border-primary/20`}
                  >
                    <Image
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      width={120}
                      height={120}
                      className="rounded-lg group-hover:scale-110 transition-transform duration-300 animate-pulse-glow"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-balance text-primary">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground">{nft.tagline}</p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-primary/20 border border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 neon-border"
                    >
                      <Link href={`/talk/${nft.id}`}>Start Chatting</Link>
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
