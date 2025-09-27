'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Wallet, Shield, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function WalletConnectModal() {
  const [ConnectButton, setConnectButton] = useState<any>(null)
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address, chainId: 1 })
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1,
  })

  useEffect(() => {
    const loadConnectButton = async () => {
      const { ConnectButton: CB } = await import('@rainbow-me/rainbowkit')
      setConnectButton(() => CB)
    }
    loadConnectButton()
  }, [])

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
            <div className="flex justify-center">
              {ConnectButton ? (
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }: any) => {
                    const ready = mounted && authenticationStatus !== 'loading'
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === 'authenticated')

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                              >
                                Connect Wallet
                              </button>
                            )
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                              >
                                Wrong network
                              </button>
                            )
                          }

                          return (
                            <div className="space-y-4">
                              {/* ENS Information */}
                              {ensName && (
                                <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                                  <div className="flex items-center justify-center gap-3 mb-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage
                                        src={ensAvatar || undefined}
                                        alt={ensName}
                                      />
                                      <AvatarFallback>
                                        {ensName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                      <p className="font-semibold text-primary">
                                        {ensName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {ensAvatar
                                          ? 'ENS Avatar'
                                          : 'No avatar set'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={openChainModal}
                                  type="button"
                                  className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                                >
                                  {chain.hasIcon && (
                                    <div
                                      style={{
                                        background: chain.iconBackground,
                                        width: 20,
                                        height: 20,
                                        borderRadius: 999,
                                        overflow: 'hidden',
                                        marginRight: 4,
                                      }}
                                    >
                                      {chain.iconUrl && (
                                        <img
                                          alt={chain.name ?? 'Chain icon'}
                                          src={chain.iconUrl}
                                          style={{ width: 20, height: 20 }}
                                        />
                                      )}
                                    </div>
                                  )}
                                  {chain.name}
                                </button>

                                <button
                                  onClick={openAccountModal}
                                  type="button"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2"
                                >
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage
                                      src={ensAvatar || undefined}
                                      alt={ensName || account.displayName}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {ensName
                                        ? ensName.charAt(0).toUpperCase()
                                        : account.displayName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{ensName || account.displayName}</span>
                                  {account.displayBalance
                                    ? ` (${account.displayBalance})`
                                    : ''}
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              ) : (
                <div className="w-full bg-muted text-muted-foreground font-medium py-3 px-6 rounded-lg text-center">
                  Loading wallet connection...
                </div>
              )}
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
