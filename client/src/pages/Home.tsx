import {
  BestSellers,
  BenefitsSection,
  BrandCarousel,
  CategoryGrid,
  FeaturedProducts,
  HeroBanner,
  NewArrivals,
  HistoryBasedSuggestions,
  PromotionsSection,
  BlogTipsSection,
} from "@/components/home";
import React, { useEffect, useState } from "react";
import { promotionService } from "@/services/promotion.service";
import type { PromotionResponse } from "@/types/promotion.types";

const Home: React.FC = () => {
  const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>([]);

  useEffect(() => {
    promotionService.getActivePromotions().then(setActivePromotions).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen pt-4">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Categories */}
      <CategoryGrid />

      {/* History-based Suggestions */}
      <HistoryBasedSuggestions limit={12} />

      {/* Promotions Section */}
      <PromotionsSection />

      {/* New Arrivals */}
      <NewArrivals activePromotions={activePromotions} />

      {/* Featured Products */}
      <FeaturedProducts activePromotions={activePromotions} />

      {/* Best Sellers / Top picks */}
      <BestSellers activePromotions={activePromotions} />

      {/* Lợi ích khi mua tại Góc VPP */}
      <BenefitsSection />

      {/* Thương hiệu đồng hành */}
      <BrandCarousel />

      {/* Blog / Tips Góc VPP */}
      <BlogTipsSection />
    </div>
  );
};

export default Home;
