import { Carousel } from "antd";
import React from "react";

interface HeroSlide {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
}

interface BannerImage {
  id: number;
  imageUrl: string;
  alt: string;
}

interface HeroBannerProps {
  slides?: HeroSlide[];
}

const mainSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Khám phá bộ sưu tập mới",
    subtitle: "Ưu đãi đặc biệt lên đến 50%",
    imageUrl: "/images/banner/banner_01.jpg",
  },
  {
    id: 2,
    title: "Sản phẩm chất lượng cao",
    subtitle: "Cam kết 100% chính hãng",
    imageUrl: "/images/banner/banner_02.jpg",
  },
  {
    id: 3,
    title: "Sản phẩm nổi bật trong tuần",
    subtitle: "Giảm giá sốc cho khách hàng mới",
    imageUrl: "/images/banner/banner_03.webp",
  },
];

const sideBanners: BannerImage[] = [
  {
    id: 1,
    imageUrl: "/images/banner/banner_04.webp",
    alt: "Khuyến mãi phụ kiện",
  },
  {
    id: 2,
    imageUrl: "/images/banner/banner_05.webp",
    alt: "Ưu đãi đặc biệt hôm nay",
  },
];

const bottomBanners: BannerImage[] = [
  {
    id: 1,
    imageUrl: "/images/banner/banner_02.jpg",
    alt: "Miễn phí vận chuyển",
  },
  {
    id: 2,
    imageUrl: "/images/banner/banner_03.webp",
    alt: "Ưu đãi thành viên",
  },
  {
    id: 3,
    imageUrl: "/images/banner/banner_06.webp",
    alt: "Sản phẩm mới về",
  },
  {
    id: 4,
    imageUrl: "/images/banner/banner_07.webp",
    alt: "Giảm giá cuối tuần",
  },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ slides = mainSlides }) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg">
          <Carousel
            autoplay
            arrows
            infinite
            autoplaySpeed={5000}
            dots={{ className: "custom-dots" }}
            effect="scrollx"
          >
            {slides.map((slide) => (
              <div key={slide.id}>
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="h-[220px] w-full object-cover md:h-[320px] lg:h-[360px]"
                />
              </div>
            ))}
          </Carousel>
        </div>

        <div className="hidden flex-col gap-4 lg:flex justify-between">
          {sideBanners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-lg">
              <img
                src={banner.imageUrl}
                alt={banner.alt}
                className="h-[100px] w-full object-cover lg:h-[168px]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
        {bottomBanners.map((banner) => (
          <div key={banner.id} className="overflow-hidden rounded-lg">
            <img
              src={banner.imageUrl}
              alt={banner.alt}
              className="h-[120px] w-full object-cover md:h-[140px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
