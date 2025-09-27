import type React from 'react'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Inter } from 'next/font/google'
import { Poppins } from 'next/font/google'
import { Orbitron } from 'next/font/google'
import { Space_Grotesk } from 'next/font/google'
import { Rajdhani } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Providers } from '@/components/providers'
import { Suspense } from 'react'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Make NFTs Great Again',
  description:
    'Talk to your NFTs, build friendships, and explore their personalities.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${poppins.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${rajdhani.variable}`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Suspense fallback={<div>Loading...</div>}>
              <Navigation />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Suspense fallback={<div>Loading...</div>}>
              <Footer />
            </Suspense>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
