import {
  CarOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";

const { Title, Paragraph } = Typography;

const benefits = [
  {
    icon: CarOutlined,
    title: "Giao hàng nhanh chóng",
    description: "Đóng gói cẩn thận, giao nhanh trong 24–48h tại nội thành.",
  },
  {
    icon: ReloadOutlined,
    title: "Đổi trả linh hoạt",
    description: "Hỗ trợ đổi trả khi sản phẩm lỗi hoặc giao nhầm.",
  },
  {
    icon: SafetyCertificateOutlined,
    title: "Hàng chính hãng",
    description: "Sản phẩm rõ nguồn gốc, hóa đơn đầy đủ cho doanh nghiệp.",
  },
  {
    icon: TeamOutlined,
    title: "Hỗ trợ doanh nghiệp",
    description: "Tư vấn set up văn phòng, xuất hóa đơn và báo giá nhanh.",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <motion.section
      className="relative mb-10 overflow-hidden rounded-2xl px-1 md:px-0"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background image chìm */}
      <img
        src="/images/background-benefit.png"
        alt="Góc VPP - cửa hàng văn phòng phẩm"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-white/30" />

      {/* Nội dung nổi trên background */}
      <div className="relative z-10 space-y-4 p-4 md:p-6">
        <div className="mb-2 text-center md:mb-4">
          <Title level={3} className="m-0 text-lg! md:text-2xl!">
            Lợi ích khi mua tại Góc VPP
          </Title>
          <Paragraph className="mt-1 text-xs text-gray-600 md:text-sm">
            Dịch vụ được thiết kế dành cho văn phòng bận rộn và khách hàng doanh
            nghiệp.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex h-full flex-col gap-2 rounded-lg border border-gray-100 bg-white/90 p-3 text-left transition-all hover:-translate-y-1 hover:border-primary hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <Icon className="text-lg" />
                  </div>
                  <span className="text-sm font-semibold md:text-base">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-gray-600 md:text-sm">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default BenefitsSection;
