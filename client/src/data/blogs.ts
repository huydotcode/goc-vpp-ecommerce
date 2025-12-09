export interface BlogPost {
  title: string;
  date: string;
  description: string;
  slug: string;
  author: string;
  fileName: string;
}

export const blogData: BlogPost[] = [
  {
    title: "5 mẹo ghi chép thông minh giúp bạn nhớ lâu hơn trong mùa thi",
    date: "2024-11-20",
    description:
      "Khám phá 5 mẹo ghi chép thông minh giúp bạn học nhanh nhớ lâu trong mùa thi cùng bút và tập Thiên Long.",
    slug: "5-meo-ghi-chep-thong-minh-giup-ban-nho-lau-hon-trong-mua-thi",
    author: "Góc VPP",
    fileName:
      "5-meo-ghi-chep-thong-minh-giup-ban-nho-lau-hon-trong-mua-thi.html",
  },
  {
    title:
      "Phương pháp ghi chép hiệu quả: Bí quyết học tập và làm việc thông minh",
    date: "2024-10-15",
    description:
      "Khám phá các phương pháp ghi chép hiệu quả như Cornell, sơ đồ tư duy, Bullet Journal… giúp bạn học tập và làm việc thông minh hơn.",
    slug: "phuong-phap-ghi-chep-hieu-qua-bi-quyet-hoc-tap-va-lam-viec-thong-minh",
    author: "Góc VPP",
    fileName:
      "phuong-phap-ghi-chep-hieu-qua-bi-quyet-hoc-tap-va-lam-viec-thong-minh.html",
  },
  {
    title: "Khám phá điểm đặc biệt thường bị ngó lơ của bút",
    date: "2024-09-10",
    description:
      "Trong vô vàn lựa chọn bút viết trên thị trường, bạn chắc hẳn đã chú ý đến màu mực, hình dáng hay kích thước ngòi bút. Nhưng có một chi tiết rất quan trọng mà ít người để ý đó chính là đầu bút.",
    slug: "kham-pha-diem-dac-biet-thuong-bi-ngo-lo-cua-but",
    author: "Góc VPP",
    fileName: "kham-pha-diem-dac-biet-thuong-bi-ngo-lo-cua-but.html",
  },
  {
    title:
      "Chọn dụng cụ học tập an toàn cho trẻ: Những tiêu chuẩn an toàn quốc tế",
    date: "2024-08-25",
    description:
      "Ở lứa tuổi cấp 1 - cấp 2, trẻ em rất thích được vừa học vừa chơi. Đồ dùng học tập như bút màu, bút viết, giấy, tập… không chỉ giúp kích thích tư duy, phát triển trí tuệ, mà còn góp phần tạo niềm vui cho việc học.",
    slug: "chon-dung-cu-hoc-tap-an-toan-cho-tre-nhung-tieu-chuan-an-toan-quoc-te",
    author: "Góc VPP",
    fileName:
      "chon-dung-cu-hoc-tap-an-toan-cho-tre-nhung-tieu-chuan-an-toan-quoc-te.html",
  },
  {
    title: "Top 5 màu sắc dành cho học sinh cấp 2",
    date: "2024-08-05",
    description:
      "Tuổi cấp 2 là giai đoạn các bạn nhỏ bắt đầu bước vào thế giới hội họa một cách nghiêm túc hơn. Để đồng hành cùng con trong hành trình đó, việc chọn đúng loại màu nước là vô cùng quan trọng.",
    slug: "top-5-mau-sac-danh-cho-hoc-sinh-cap-2",
    author: "Góc VPP",
    fileName: "top-5-mau-sac-danh-cho-hoc-sinh-cap-2.html",
  },
];
