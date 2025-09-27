'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isNFTHovered, setIsNFTHovered] = useState(false)
  const [isNFTClicked, setIsNFTClicked] = useState(false)
  const [nftMood, setNftMood] = useState('excited')
  const [nftName] = useState('')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleScrollToNext = () => {
    const nextSection = document.querySelector('#nft-cards-section')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNFTClick = () => {
    setIsNFTClicked(true)
    setNftMood('happy')

    // Reset after animation
    setTimeout(() => {
      setIsNFTClicked(false)
      setNftMood('excited')
    }, 1000)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" />
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-secondary/20 rounded-full blur-xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-primary/20 rounded-full blur-xl animate-float"
          style={{ animationDelay: '0.5s' }}
        />

        {/* Additional floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
        <div
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent/60 rounded-full animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-secondary/50 rounded-full animate-pulse"
          style={{ animationDelay: '2.5s' }}
        />
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-display text-balance">
                <span className="text-neon-title">Make NFTs Great Again</span>
              </h1>
              <p className="mx-auto lg:mx-0 max-w-[600px] text-body-large text-muted-foreground text-pretty">
                Talk to your NFTs or discover random ones. Build relationships
                from both onchain and offchain data. Transform your digital
                collectibles into AI companions with unique personalities.
              </p>
            </div>

            {/* Interactive scroll hint */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col items-center lg:items-start space-y-4"
            >
              <motion.button
                onClick={handleScrollToNext}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="group flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-body-small font-medium">
                  Start Talking
                </span>
                <motion.div
                  animate={{ y: isHovering ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-6 w-6 group-hover:text-primary transition-colors duration-300" />
                </motion.div>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right side - Interactive 3D NFT Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Interactive 3D NFT Card */}
              <motion.div
                className="relative w-80 h-80 perspective-1000 cursor-pointer"
                style={{
                  transform: `perspective(1000px) rotateX(${
                    typeof window !== 'undefined'
                      ? (mousePosition.y - window.innerHeight / 2) * 0.08
                      : 0
                  }deg) rotateY(${
                    typeof window !== 'undefined'
                      ? (mousePosition.x - window.innerWidth / 2) * 0.08
                      : 0
                  }deg) ${isNFTClicked ? 'scale(1.1)' : ''}`,
                }}
                whileHover={{
                  scale: 1.08,
                  rotateZ: 2,
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setIsNFTHovered(true)}
                onMouseLeave={() => setIsNFTHovered(false)}
                onClick={handleNFTClick}
                transition={{ duration: 0.3 }}
              >
                {/* Main NFT Card with enhanced effects */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-2xl border border-primary/30 backdrop-blur-sm transform-gpu transition-all duration-500 ${
                    isNFTHovered
                      ? 'border-primary/60 shadow-2xl shadow-primary/20'
                      : ''
                  }`}
                >
                  {/* NFT Avatar Section */}
                  <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="text-center space-y-4 relative">
                      {/* Animated Avatar */}
                      <motion.div
                        className="relative w-28 h-28 mx-auto"
                        animate={{
                          rotate: isNFTHovered ? 360 : 0,
                          scale: isNFTClicked ? 1.2 : 1,
                        }}
                        transition={{
                          rotate: { duration: 2, ease: 'easeInOut' },
                          scale: { duration: 0.3 },
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center relative overflow-hidden">
                          {/* Companion Image */}
                          <motion.div
                            className="relative w-28 h-28"
                            animate={{
                              scale: isNFTClicked ? 1.2 : 1,
                              rotate: isNFTClicked ? [0, -5, 5, 0] : 0,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Image
                              src="/companion.png"
                              alt="NFT Companion"
                              fill
                              className="object-contain"
                              sizes="112px"
                            />
                          </motion.div>

                          {/* Pulsing rings */}
                          <motion.div
                            className="absolute inset-0 border-2 border-primary/30 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 0, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-0 border border-accent/40 rounded-full"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.3, 0, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.5,
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* Clean minimal design - just the name */}
                      <div className="space-y-2">
                        <motion.h3
                          className="text-h6 text-primary font-bold"
                          animate={{
                            color: isNFTClicked
                              ? 'oklch(0.9 0.3 180)'
                              : 'oklch(0.75 0.25 180)',
                          }}
                        >
                          {nftName}
                        </motion.h3>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced glowing border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"
                    animate={{
                      opacity: isNFTHovered ? 0.8 : 0.5,
                      scale: isNFTClicked ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Click ripple effect */}
                  {isNFTClicked && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-4 border-primary/60"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </div>

                {/* Enhanced floating elements */}
                <motion.div
                  className="absolute -top-6 -right-6 w-10 h-10 bg-primary/40 rounded-full flex items-center justify-center backdrop-blur-sm"
                  animate={{
                    y: [-8, 8, -8],
                    rotate: isNFTHovered ? 360 : 0,
                    scale: isNFTClicked ? 1.3 : 1,
                  }}
                  transition={{
                    y: { duration: 2, repeat: Infinity },
                    rotate: { duration: 3, ease: 'easeInOut' },
                    scale: { duration: 0.3 },
                  }}
                >
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -left-6 w-8 h-8 bg-accent/40 rounded-full flex items-center justify-center backdrop-blur-sm"
                  animate={{
                    y: [8, -8, 8],
                    rotate: isNFTHovered ? -360 : 0,
                    scale: isNFTClicked ? 1.3 : 1,
                  }}
                  transition={{
                    y: { duration: 2.5, repeat: Infinity },
                    rotate: { duration: 4, ease: 'easeInOut' },
                    scale: { duration: 0.3 },
                  }}
                >
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                </motion.div>

                {/* Additional corner elements */}
                <motion.div
                  className="absolute -top-2 -left-2 w-4 h-4 bg-secondary/30 rounded-full"
                  animate={{
                    scale: isNFTHovered ? [1, 1.5, 1] : 1,
                    opacity: isNFTHovered ? [0.5, 1, 0.5] : 0.3,
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-2 -right-2 w-3 h-3 bg-primary/30 rounded-full"
                  animate={{
                    scale: isNFTHovered ? [1, 1.3, 1] : 1,
                    opacity: isNFTHovered ? [0.3, 0.8, 0.3] : 0.2,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />

                {/* Enhanced connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.line
                    x1="50%"
                    y1="20%"
                    x2="80%"
                    y2="30%"
                    stroke="url(#gradient)"
                    strokeWidth={isNFTHovered ? '3' : '2'}
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: isNFTHovered ? 1 : 0.7,
                      opacity: isNFTHovered ? 1 : 0.6,
                    }}
                    transition={{ duration: 2, delay: 1 }}
                  />
                  <motion.line
                    x1="20%"
                    y1="80%"
                    x2="50%"
                    y2="70%"
                    stroke="url(#gradient)"
                    strokeWidth={isNFTHovered ? '3' : '2'}
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: isNFTHovered ? 1 : 0.7,
                      opacity: isNFTHovered ? 1 : 0.6,
                    }}
                    transition={{ duration: 2, delay: 1.5 }}
                  />
                  <motion.line
                    x1="80%"
                    y1="70%"
                    x2="70%"
                    y2="50%"
                    stroke="url(#gradient)"
                    strokeWidth={isNFTHovered ? '2' : '1'}
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: isNFTHovered ? 0.8 : 0.4,
                      opacity: isNFTHovered ? 0.8 : 0.4,
                    }}
                    transition={{ duration: 2, delay: 2 }}
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="oklch(0.75 0.25 180)" />
                      <stop offset="50%" stopColor="oklch(0.8 0.3 200)" />
                      <stop offset="100%" stopColor="oklch(0.85 0.25 160)" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Enhanced background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl blur-3xl -z-10"
                animate={{
                  scale: isNFTHovered ? 1.2 : 1.1,
                  opacity: isNFTHovered ? 0.8 : 0.6,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
