import React, { useEffect } from "react";
import { Typography, Breadcrumb, Row, Col, Card } from "antd";
import { CalendarOutlined, HomeOutlined, ReadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { blogData } from "@/data/blogs";

const { Title, Paragraph } = Typography;

const BlogListPage: React.FC = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      {/* Thanh điều hướng Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: "Góc chia sẻ" },
        ]}
        style={{ marginBottom: 24 }}
      />

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2}>Tất cả bài viết</Title>
        <Paragraph type="secondary">
          Chia sẻ kiến thức, mẹo học tập và thông tin hữu ích
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {blogData.map((post) => (
          <Col xs={24} sm={12} md={8} key={post.slug}>
            <Link to={`/blogs/${post.slug}`}>
              <Card
                hoverable
                bordered={false}
                style={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}
                bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}
              >
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8, display: "flex", alignItems: "center" }}>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  {new Date(post.date).toLocaleDateString("vi-VN")}
                </div>

                <Title level={5} style={{
                    marginBottom: 12,
                    minHeight: 48,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                }}>
                  {post.title}
                </Title>

                {/* Mô tả ngắn (giới hạn 3 dòng) */}
                <Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ marginBottom: 20, flex: 1 }}>
                  {post.description}
                </Paragraph>

                {/* Nút xem chi tiết giả */}
                <div style={{ marginTop: "auto", color: "#1890ff", fontWeight: 600, display: "flex", alignItems: "center" }}>
                  <ReadOutlined style={{ marginRight: 8 }} />
                  Đọc tiếp
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default BlogListPage;
