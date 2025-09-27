'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Navigation() {
  const pathname = usePathname()
  const [ConnectButton, setConnectButton] = useState<any>(null)
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address, chainId: 1 })
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1,
  })

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
  ]

  useEffect(() => {
    const loadConnectButton = async () => {
      const { ConnectButton: CB } = await import('@rainbow-me/rainbowkit')
      setConnectButton(() => CB)
    }
    loadConnectButton()
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          {/* Empty space for left alignment */}
        </div>

        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-label transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openConnectModal}
                            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                          >
                            Connect Wallet
                          </Button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openChainModal}
                            className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
                          >
                            Wrong Network
                          </Button>
                        )
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openChainModal}
                            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 6,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openAccountModal}
                            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent flex items-center gap-2"
                          >
                            {/* ENS Avatar */}
                            <Avatar className="w-5 h-5">
                              <AvatarImage
                                src={ensAvatar || undefined}
                                alt={ensName || account.displayName}
                              />
                              <AvatarFallback className="text-xs">
                                {ensName
                                  ? ensName.charAt(0).toUpperCase()
                                  : account.displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* Display ENS name if available, otherwise wallet address */}
                            <span className="max-w-[120px] truncate">
                              {ensName || account.displayName}
                            </span>

                            {account.displayBalance && (
                              <span className="text-xs opacity-70">
                                ({account.displayBalance})
                              </span>
                            )}
                          </Button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-primary/30 text-primary/50 bg-transparent"
            >
              Loading...
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
