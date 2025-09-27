'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const networks = [
  { value: 'arbitrum-one', label: 'Arbitrum One' },
  { value: 'avalanche', label: 'Avalanche' },
  { value: 'base', label: 'Base' },
  { value: 'bsc', label: 'BSC' },
  { value: 'mainnet', label: 'Ethereum' },
  { value: 'matic', label: 'Polygon' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'unichain', label: 'Unichain' },
]

export function CustomNFTForm() {
  const [network, setNetwork] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStartChat = async () => {
    if (network && contractAddress && tokenId) {
      setIsLoading(true)

      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      router.push(`/talk/${network}:${contractAddress}:${tokenId}`)
    }
  }

  return (
    <section className="py-16 px-4 md:px-6 cyberpunk-grid">
      <div className="container max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-h3 mb-4 text-balance text-primary">
            Bring Your Own NFT
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto">
            Have a specific NFT you want to chat with? Enter the details below
            and your NFT will know about its onchain data and personality.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="neon-border bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Network Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-primary">Network</Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className="h-10 bg-muted/50 border-primary/30 focus:border-primary">
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

                {/* Contract Address */}
                <div className="space-y-2">
                  <Label className="text-sm text-primary">
                    Contract Address
                  </Label>
                  <Input
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="h-10 bg-muted/50 border-primary/30 focus:border-primary font-mono text-sm"
                  />
                </div>

                {/* Token ID */}
                <div className="space-y-2">
                  <Label className="text-sm text-primary">Token ID</Label>
                  <Input
                    placeholder="1234"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="h-10 bg-muted/50 border-primary/30 focus:border-primary text-sm"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleStartChat}
                    disabled={
                      !network || !contractAddress || !tokenId || isLoading
                    }
                    className="w-full h-10 bg-primary/20 border border-primary hover:bg-primary hover:text-primary-foreground neon-border"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bringing to Life...
                      </>
                    ) : (
                      'Bring to Life'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
