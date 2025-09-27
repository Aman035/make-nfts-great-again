'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Heart, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useAccount } from 'wagmi'

interface Message {
  id: string
  content: string
  sender: 'user' | 'nft'
  timestamp: Date
}

interface ChatInterfaceProps {
  nftImage: string
  nftName: string
  nftCollection: string
  network?: string
  contract?: string
  tokenId?: string
}

interface TalkResponse {
  response: string
  nftInfo?: {
    contract: string
    tokenId: string
    name?: string
    collection?: string
    image?: string
  }
  userInfo?: {
    address: string
    friendshipLevel: number
    happinessLevel: number
    totalInteractions: number
    lastInteraction: string
  }
  error?: string
}

const friendshipLevels = [
  { level: 0, name: 'Stranger', color: 'bg-gray-500' },
  { level: 25, name: 'Acquaintance', color: 'bg-blue-500' },
  { level: 50, name: 'Friend', color: 'bg-green-500' },
  { level: 75, name: 'Best Friend', color: 'bg-purple-500' },
  { level: 100, name: 'Soulmate', color: 'bg-pink-500' },
]

export function ChatInterface({
  nftImage,
  nftName,
  nftCollection,
  network = 'mainnet',
  contract,
  tokenId,
}: ChatInterfaceProps) {
  const { address } = useAccount()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey there! Ready to chat?',
      sender: 'nft',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [friendshipLevel, setFriendshipLevel] = useState(0)
  const [happinessLevel, setHappinessLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [nftInfo, setNftInfo] = useState<{
    name?: string
    collection?: string
    image?: string
  }>({
    name: nftName,
    collection: nftCollection,
    image: nftImage,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentFriendshipLevel = () => {
    return friendshipLevels.reduce((prev, current) =>
      friendshipLevel >= current.level ? current : prev
    )
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isClient || !address || !contract || !tokenId) {
      console.log('Missing required data:', {
        inputValue: inputValue.trim(),
        isClient,
        address,
        contract,
        tokenId,
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    setError(null)

    const apiUrl = `http://localhost:3001/api/nft-agent/${network}/${contract}/${tokenId}/${address}/talk`
    console.log('Making API call to:', apiUrl)
    console.log('Request body:', {
      message: inputValue,
    })

    try {
      const response = await fetch(
        `http://localhost:3001/api/nft-agent/${network}/${contract}/${tokenId}/${address}/talk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputValue,
            context: {
              includeHistory: true,
              maxTokens: 1000,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: TalkResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const nftResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'nft',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, nftResponse])

      // Update NFT info from backend response
      if (data.nftInfo) {
        setNftInfo((prev) => ({
          name: data.nftInfo?.name || prev.name,
          collection: data.nftInfo?.collection || prev.collection,
          image: data.nftInfo?.image || prev.image,
        }))
      }

      // Update friendship and happiness levels from userInfo
      if (data.userInfo) {
        setFriendshipLevel(data.userInfo.friendshipLevel)
        setHappinessLevel(data.userInfo.happinessLevel)
      } else {
        // Fallback to random increments if userInfo is not available
        setFriendshipLevel((prev) => Math.min(100, prev + Math.random() * 5))
        setHappinessLevel((prev) => Math.min(100, prev + Math.random() * 3))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        apiUrl,
        address,
        contract,
        tokenId,
        network,
      })
      setError(
        error instanceof Error ? error.message : 'Failed to send message'
      )

      // Fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm having trouble connecting right now, but I'm still here! Try again in a moment.",
        sender: 'nft',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const currentFriendship = getCurrentFriendshipLevel()

  return (
    <div className="max-w-6xl mx-auto cyberpunk-grid">
      <Card className="mb-6 neon-border bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="relative flex-shrink-0">
              <div className="relative">
                <Image
                  src={nftInfo.image || '/placeholder.svg'}
                  alt={nftInfo.name || 'NFT'}
                  width={300}
                  height={300}
                  className="rounded-lg neon-border animate-pulse-glow"
                />
                <div className="absolute -top-3 -right-3">
                  <Badge
                    variant="secondary"
                    className="animate-pulse bg-primary/20 text-primary border-primary"
                  >
                    Online
                  </Badge>
                </div>
                <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-pulse pointer-events-none"></div>
              </div>
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left min-w-0">
              <div>
                <h2 className="text-h2 text-balance text-primary animate-neon-flicker text-digital">
                  {nftInfo.name ||
                    `${network}:${contract?.slice(0, 8)}...:${tokenId}`}
                </h2>
                {nftInfo.collection && (
                  <p className="text-body-large text-muted-foreground mb-2">
                    {nftInfo.collection}
                  </p>
                )}
                {network && contract && tokenId && (
                  <p className="text-body-small text-muted-foreground font-mono">
                    {network}:{contract.slice(0, 8)}...:{tokenId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-primary">
                      Friendship Level
                    </span>
                    <Badge
                      className={`${currentFriendship.color} border border-primary/50`}
                    >
                      {currentFriendship.name}
                    </Badge>
                  </div>
                  <Progress
                    value={friendshipLevel}
                    className="h-3 bg-muted border border-primary/30"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-primary">Happiness</span>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-body-small text-primary">
                        {Math.round(happinessLevel)}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={happinessLevel}
                    className="h-3 bg-muted border border-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="neon-border bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${
                      message.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-xl border ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-primary/30 to-accent/30 text-primary border-primary/40 backdrop-blur-sm'
                          : 'bg-muted/80 border-primary/20 text-foreground'
                      }`}
                    >
                      <p className="text-body-small">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted/80 p-4 rounded-lg border border-primary/20">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3 border-t border-primary/20 pt-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
                className="bg-muted/50 border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() || isTyping || !isClient || !address
                }
                size="icon"
                className="bg-primary/20 border border-primary hover:bg-primary hover:text-primary-foreground neon-border"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
