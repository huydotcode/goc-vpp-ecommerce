import React from "react";
import { motion } from "framer-motion";
import { Typography } from "antd";

const { Title } = Typography;

const brands = [
  "/images/brands/brand_01.webp",
  "/images/brands/brand_02.webp",
  "/images/brands/brand_03.webp",
  "/images/brands/brand_04.webp",
  "/images/brands/brand_05.webp",
  "/images/brands/brand_06.webp",
  "/images/brands/brand_07.webp",
  "/images/brands/brand_08.webp",
  "/images/brands/brand_09.webp",
];

const BrandCarousel: React.FC = () => {
  return (
    <motion.section
      className="mb-10 rounded-xl bg-white/80 p-4 shadow-sm md:p-5"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-4 flex flex-col items-center justify-between gap-3 md:flex-row">
        <Title level={3} className="m-0 text-base! md:text-2xl!">
          Thương hiệu đồng hành cùng Góc VPP
        </Title>
      </div>

      <div className="relative overflow-hidden">
        <div className="brand-marquee no-scrollbar">
          {[...brands, ...brands].map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="flex items-center justify-center px-6 py-2"
            >
              <img
                src={src}
                alt="Thương hiệu đối tác"
                className="h-12 w-auto opacity-80 transition-transform duration-300 hover:scale-105 hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default BrandCarousel;
