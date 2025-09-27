import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-center text-body-small leading-loose text-muted-foreground md:text-left">
              Bringing NFTs to life, one chat at a time.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary hover:text-primary-foreground hover:bg-primary/20 border border-primary/20 hover:border-primary/50"
            >
              <Link
                href="https://x.com/m_AmanGupta"
                target="_blank"
                rel="noopener noreferrer"
              >
                X
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary hover:text-primary-foreground hover:bg-primary/20 border border-primary/20 hover:border-primary/50"
            >
              <Link
                href="https://github.com/Aman035"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
