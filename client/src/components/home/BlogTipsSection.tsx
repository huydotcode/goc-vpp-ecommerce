import React from "react";
import { Typography } from "antd";
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const { Title } = Typography;

const posts = [
  {
    title: "5 mẹo ghi chép thông minh giúp bạn nhớ lâu hơn trong mùa thi",
    date: "2024-11-20",
    description:
      "Khám phá 5 mẹo ghi chép thông minh giúp bạn học nhanh nhớ lâu trong mùa thi cùng bút và tập Thiên Long.",
    slug: "5-meo-ghi-chep-thong-minh-giup-ban-nho-lau-hon-trong-mua-thi",
    fileName: "5-meo-ghi-chep-thong-minh-giup-ban-nho-lau-hon-trong-mua-thi.html"
  },
  {
    title:
      "Phương pháp ghi chép hiệu quả: Bí quyết học tập và làm việc thông minh",
    date: "2024-10-15",
    description:
      "Khám phá các phương pháp ghi chép hiệu quả như Cornell, sơ đồ tư duy, Bullet Journal… giúp bạn học tập và làm việc thông minh hơn.",
    slug: "phuong-phap-ghi-chep-hieu-qua-bi-quyet-hoc-tap-va-lam-viec-thong-minh",
    fileName: "phuong-phap-ghi-chep-hieu-qua-bi-quyet-hoc-tap-va-lam-viec-thong-minh.html"
  },
  {
    title: "Khám phá điểm đặc biệt thường bị ngó lơ của bút",
    date: "2024-09-10",
    description:
      "Trong vô vàn lựa chọn bút viết trên thị trường, bạn chắc hẳn đã chú ý đến màu mực, hình dáng hay kích thước ngòi bút. Nhưng có một chi tiết rất quan trọng mà ít người để ý đó chính là đầu bút.",
    slug: "kham-pha-diem-dac-biet-thuong-bi-ngo-lo-cua-but",
    fileName: "kham-pha-diem-dac-biet-thuong-bi-ngo-lo-cua-but"
  },
  {
    title:
      "Chọn dụng cụ học tập an toàn cho trẻ: Những tiêu chuẩn an toàn quốc tế",
    date: "2024-08-25",
    description:
      "Ở lứa tuổi cấp 1 - cấp 2, trẻ em rất thích được vừa học vừa chơi. Đồ dùng học tập như bút màu, bút viết, giấy, tập… không chỉ giúp kích thích tư duy, phát triển trí tuệ, mà còn góp phần tạo niềm vui cho việc học.",
    slug: "chon-dung-cu-hoc-tap-an-toan-cho-tre-nhung-tieu-chuan-an-toan-quoc-te",
    fileName: "chon-dung-cu-hoc-tap-an-toan-cho-tre-nhung-tieu-chuan-an-toan-quoc-te"
  },
  {
    title: "Top 5 màu sắc dành cho học sinh cấp 2",
    date: "2024-08-05",
    description:
      "Tuổi cấp 2 là giai đoạn các bạn nhỏ bắt đầu bước vào thế giới hội họa một cách nghiêm túc hơn. Để đồng hành cùng con trong hành trình đó, việc chọn đúng loại màu nước là vô cùng quan trọng.",
    slug: "top-5-mau-sac-danh-cho-hoc-sinh-cap-2",
    fileName: "top-5-mau-sac-danh-cho-hoc-sinh-cap-2"
  },
];

const BlogTipsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.section
      className="mb-12 rounded-xl bg-white/90 p-4 shadow-sm md:p-6"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <Title level={3} className="m-0 text-lg! md:text-2xl!">
            Bài viết
          </Title>
        </div>
        <button
          onClick={() => navigate("/blogs")}
          type="button"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:text-sm"
        >
          Xem tất cả bài viết{" "}
          <ArrowRightOutlined className="ml-1 text-[10px]" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <article
            key={post.title}
            className="flex h-full flex-col justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarOutlined />
                <span>
                  {new Date(post.date).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              <Link to={`/blogs/${post.slug}`} state={{ postData: post }}>
                <h3 className="text-sm font-semibold md:text-base hover:text-primary transition-colors cursor-pointer">
                  {post.title}
                </h3>
              </Link>

              <p className="text-xs text-gray-600 md:text-sm">
                {post.description}
              </p>
            </div>

            <Link
              to={`/blogs/${post.slug}`}
              state={{ postData: post }}
              className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline md:text-sm"
            >
              Đọc thêm <ArrowRightOutlined className="ml-1 text-[10px]" />
            </Link>
          </article>
        ))}
      </div>
    </motion.section>
  );
};

export default BlogTipsSection;
