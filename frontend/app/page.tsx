import { HeroSection } from "@/components/hero-section"
import { NFTCardsSection } from "@/components/nft-cards-section"
import { CustomNFTForm } from "@/components/custom-nft-form"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <NFTCardsSection />
      <CustomNFTForm />
    </div>
  )
}
