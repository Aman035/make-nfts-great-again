"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

const networks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
]

export function CustomNFTForm() {
  const [network, setNetwork] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [tokenId, setTokenId] = useState("")
  const router = useRouter()

  const handleStartChat = () => {
    if (network && contractAddress && tokenId) {
      router.push(`/talk/${network}:${contractAddress}:${tokenId}`)
    }
  }

  return (
    <section className="py-20 px-4 md:px-6 bg-muted/30">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4 text-balance text-primary animate-neon-flicker">
            Bring Your Own NFT
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Have a specific NFT you want to chat with? Enter the details below and start your conversation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="neon-border hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-primary">Custom NFT Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="network" className="text-primary">
                    Network
                  </Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className="bg-muted/50 border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Choose network" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((net) => (
                        <SelectItem key={net.value} value={net.value}>
                          {net.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract" className="text-primary">
                    Contract Address
                  </Label>
                  <Input
                    id="contract"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="bg-muted/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenId" className="text-primary">
                    Token ID
                  </Label>
                  <Input
                    id="tokenId"
                    placeholder="1234"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="bg-muted/50 border-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleStartChat}
                  disabled={!network || !contractAddress || !tokenId}
                  className="px-8 py-6 text-lg bg-primary/20 border border-primary hover:bg-primary hover:text-primary-foreground neon-border"
                >
                  Start Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
