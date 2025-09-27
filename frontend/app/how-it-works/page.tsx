'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Heart, Zap } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 md:px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-h1 mb-6 text-balance text-holographic">
            How It Works
          </h1>
          <p className="text-body-large text-muted-foreground max-w-3xl mx-auto text-pretty">
            Discover the magic behind bringing your NFTs to life as AI
            companions. Each conversation builds a unique relationship with your
            digital collectibles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: <Sparkles className="h-8 w-8" />,
              title: 'AI Personality',
              description:
                'Each NFT gets a unique AI personality based on its traits and collection history.',
              color: 'from-purple-500 to-pink-500',
            },
            {
              icon: <MessageCircle className="h-8 w-8" />,
              title: 'Natural Conversations',
              description:
                'Chat naturally with your NFTs using advanced language models and contextual understanding.',
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: <Heart className="h-8 w-8" />,
              title: 'Growing Relationships',
              description:
                'The more onchain history you have and the more you talk to NFTs, the deeper your relationship grows. Build lasting bonds through meaningful interactions.',
              color: 'from-red-500 to-pink-500',
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: 'Real-time Responses',
              description:
                'Get instant, personalized responses that evolve based on your conversation history.',
              color: 'from-yellow-500 to-orange-500',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-colors duration-300">
                <CardContent className="p-6 text-center space-y-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-h5 text-balance">{feature.title}</h3>
                  <p className="text-body-small text-muted-foreground text-pretty">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <h2 className="text-h3 text-balance">Coming Soon: Learn More!</h2>
              <p className="text-body-large text-muted-foreground text-pretty">
                We're working on detailed documentation about our AI technology,
                personality generation algorithms, and the science behind NFT
                companionship. Stay tuned for exciting updates!
              </p>
              <div className="flex items-center justify-center gap-2 text-body-small text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>More features in development</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
