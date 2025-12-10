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
import React from "react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen pt-4">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Categories */}
      <CategoryGrid />

      {/* History-based Suggestions */}
      <HistoryBasedSuggestions limit={8} />

      {/* Promotions Section */}
      <PromotionsSection />

      {/* New Arrivals */}
      <NewArrivals />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Best Sellers / Top picks */}
      <BestSellers />

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
