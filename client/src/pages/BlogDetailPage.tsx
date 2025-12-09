import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Typography, Breadcrumb, Button, Result, Spin, Divider, Avatar, message } from "antd";
import { CalendarOutlined, HomeOutlined, ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { blogData } from "@/data/blogs"; // Import dữ liệu để tìm kiếm
import type { BlogPost } from "@/data/blogs"; // Import type BlogPost nếu có

const { Title, Paragraph, Text } = Typography;

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Tìm bài viết trong data chung dựa trên slug
  const post: BlogPost | undefined = blogData.find((p) => p.slug === slug);

  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (post && post.fileName) {
      setLoading(true);
      // Tải file HTML từ thư mục public/blogs
      fetch(`/blogs/${post.fileName}`)
        .then((res) => {
          if (!res.ok) throw new Error("Không tải được file nội dung.");
          return res.text();
        })
        .then((data) => {
          setHtmlContent(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi tải nội dung blog:", err);
          message.error("Không thể tải nội dung bài viết.");
          setHtmlContent("<p>Nội dung đang được cập nhật, vui lòng thử lại sau.</p>");
          setLoading(false);
        });
    } else {
        // Kết thúc loading ngay lập tức nếu không tìm thấy post hoặc thiếu fileName
        setLoading(false);
    }
  }, [post]); // Chạy lại khi post thay đổi (ví dụ: chuyển slug)

  // Xử lý trường hợp không tìm thấy bài viết trong dữ liệu
  if (!post) {
    return (
      <Result
        status="404"
        title="Không tìm thấy bài viết"
        subTitle="Bài viết bạn tìm kiếm không tồn tại hoặc đường dẫn bị sai."
        extra={<Button type="primary" onClick={() => navigate("/blogs")}>Quay lại danh sách</Button>}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: "20px 15px 60px" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: <Link to="/blogs">Bài viết</Link> },
          { title: post.title.substring(0, 20) + "..." },
        ]}
        style={{ marginBottom: 24 }}
      />

      <article style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Title level={1} style={{ fontSize: "2rem", marginBottom: 16, lineHeight: 1.2 }}>{post.title}</Title>

        {/* --- KHỐI META THÔNG TIN TÁC GIẢ & NGÀY ĐĂNG --- */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24, paddingBottom: 15, borderBottom: '1px solid #eee' }}>

            {/* Tác giả */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#555" }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} size="small" />
                <Text strong style={{ color: '#333' }}>
                    {post.author || "Tác giả VPP"} {/* Hiển thị Tác giả */}
                </Text>
            </div>

            <Divider type="vertical" />

            {/* Ngày đăng */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#888" }}>
                <CalendarOutlined />
                <Text type="secondary" style={{ fontSize: 14 }}>
                    {new Date(post.date).toLocaleDateString("vi-VN", {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </Text>
            </div>
        </div>
        {/* --- HẾT KHỐI META --- */}

        {/* Đoạn mô tả (Description) */}
        <Paragraph style={{ fontSize: 16, fontStyle: "italic", borderLeft: "4px solid #C92127", paddingLeft: 16, background: "#fff6f6", padding: "12px 16px", marginBottom: 32 }}>
          {post.description}
        </Paragraph>

        <div style={{ marginTop: 32, minHeight: 200 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 50 }}><Spin tip="Đang tải nội dung..." /></div>
          ) : (
            // Dùng class CSS '.blog-content-html' đã định nghĩa để style nội dung HTML thô
            <div
              className="blog-content-html"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </article>

      <div style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/blogs")}>
          Xem các bài viết khác
        </Button>
      </div>
    </div>
  );
};

export default BlogDetailPage;
