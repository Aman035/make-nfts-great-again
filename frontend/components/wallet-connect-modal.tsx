'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Wallet, Shield, Zap } from 'lucide-react'

interface WalletConnectModalProps {
  onConnect: () => void
}

const walletOptions = [
  {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask wallet',
    popular: true,
  },
  {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect using WalletConnect protocol',
    popular: false,
  },
  {
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect using Coinbase Wallet',
    popular: false,
  },
]

export function WalletConnectModal({ onConnect }: WalletConnectModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const handleConnect = async (walletName: string) => {
    setSelectedWallet(walletName)
    setIsConnecting(true)

    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false)
      onConnect()
    }, 2000)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-h3 text-balance">
              Connect Your Wallet
            </CardTitle>
            <p className="text-body text-muted-foreground text-pretty">
              Connect your wallet to start chatting with your NFTs and unlock
              all features.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="w-full h-auto p-4 justify-start hover:border-primary/50 transition-colors duration-300 bg-transparent"
                  onClick={() => handleConnect(wallet.name)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-label">{wallet.name}</span>
                        {wallet.popular && (
                          <span className="text-caption bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-body-small text-muted-foreground">
                        {wallet.description}
                      </p>
                    </div>
                    {isConnecting && selectedWallet === wallet.name && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Shield className="h-6 w-6 mx-auto text-green-500" />
                  <p className="text-caption text-muted-foreground">Secure</p>
                </div>
                <div className="space-y-2">
                  <Zap className="h-6 w-6 mx-auto text-yellow-500" />
                  <p className="text-caption text-muted-foreground">Fast</p>
                </div>
                <div className="space-y-2">
                  <Wallet className="h-6 w-6 mx-auto text-blue-500" />
                  <p className="text-caption text-muted-foreground">Easy</p>
                </div>
              </div>

              <p className="text-caption text-center text-muted-foreground">
                By connecting your wallet, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
