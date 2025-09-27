'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
  ]

  const handleWalletConnect = () => {
    // Simulate wallet connection
    setIsWalletConnected(true)
  }

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
          {isWalletConnected ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-label text-primary">Connected</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWalletConnect}
              className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
