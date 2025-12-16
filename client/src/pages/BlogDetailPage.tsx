import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Breadcrumb,
  Button,
  Result,
  Spin,
  Divider,
  Anchor,
  Row,
  Col,
  FloatButton,
  Card,
  theme
} from "antd";
import {
  CalendarOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  MenuOutlined
} from "@ant-design/icons";
import { blogData } from "@/data/blogs";
import type { BlogPost } from "@/data/blogs";

const { Title, Paragraph } = Typography;

// Interface cho mục lục
interface TocItem {
  key: string;
  href: string;
  title: React.ReactNode; // Đổi thành ReactNode để chỉnh bold/normal
  children?: TocItem[];
}

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const post: BlogPost | undefined = blogData.find((p) => p.slug === slug);

  const [htmlContent, setHtmlContent] = useState<string>("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (post && post.fileName) {
      setLoading(true);
      fetch(`/blogs/${post.fileName}`)
        .then((res) => {
          if (!res.ok) throw new Error("Không tải được file nội dung.");
          return res.text();
        })
        .then((rawHtml) => {
          // --- LOGIC PHÂN TÍCH HTML & TẠO MỤC LỤC ---
          const parser = new DOMParser();
          const doc = parser.parseFromString(rawHtml, "text/html");

          // Lấy tất cả các thẻ có khả năng là tiêu đề
          const potentialHeadings = doc.querySelectorAll("p, h1, h2, h3, h4, strong, span");

          const items: TocItem[] = [];
          let currentParent: TocItem | null = null;

          // Dùng Set để kiểm tra trùng lặp nội dung
          const processedTexts = new Set<string>();

          potentialHeadings.forEach((el, index) => {
            const text = el.textContent?.trim() || "";

            // Nếu text rỗng hoặc ĐÃ ĐƯỢC XỬ LÝ rồi thì bỏ qua ngay
            if (!text || processedTexts.has(text)) {
                return;
            }

            // Regex nhận diện cấp độ
            // Cấp 2 hoặc 3 (1.1, 1.2.1...): Số + chấm + số
            const level2Regex = /^\d+\.\d+/;
            // Cấp 1 (1., 2....): Số + chấm + dấu cách
            const level1Regex = /^\d+\.\s/;

            let level = 0;
            if (level2Regex.test(text)) {
              level = 2;
            } else if (level1Regex.test(text)) {
              level = 1;
            }

            if (level > 0) {
              // Đánh dấu là text này đã xử lý để không bị lặp lại ở thẻ con/cha
              processedTexts.add(text);

              const id = `heading-${index}`;

              // 1. Gán ID vào thẻ HTML để neo hoạt động
              // Ưu tiên gán ID vào thẻ cha cao nhất (thường là P) để scroll không bị che
              const anchorEl = el.closest('p') || el;
              anchorEl.id = id;

              // 2. Style lại thẻ trong bài viết cho nổi bật
              if (anchorEl instanceof HTMLElement) {
                  if (level === 1) {
                      anchorEl.style.fontSize = '22px';
                      anchorEl.style.fontWeight = '700';
                      anchorEl.style.color = '#C92127';
                      anchorEl.style.marginTop = '24px';
                      anchorEl.style.borderBottom = '1px solid #eee';
                      anchorEl.style.paddingBottom = '8px';
                  } else {
                      anchorEl.style.fontSize = '18px';
                      anchorEl.style.fontWeight = '600';
                      anchorEl.style.color = '#333';
                      anchorEl.style.marginTop = '16px';
                  }
              }

              // 3. Tạo item cho mục lục
              const anchorItem: TocItem = {
                key: id,
                href: `#${id}`,
                title: (
                    <span style={{
                        fontWeight: level === 1 ? 600 : 400,
                        fontSize: level === 1 ? '15px' : '14px',
                        color: level === 1 ? '#000' : '#555'
                    }}>
                        {text}
                    </span>
                ),
              };

              // 4. Logic phân cấp cha con
              if (level === 1) {
                items.push(anchorItem);
                currentParent = items[items.length - 1];
                currentParent.children = [];
              } else if (level === 2 && currentParent) {
                 if (!currentParent.children) currentParent.children = [];
                 currentParent.children.push(anchorItem);
              } else {
                 items.push(anchorItem);
              }
            }
          });

          setHtmlContent(doc.body.innerHTML);
          setTocItems(items);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [post]);

  if (!post) return <Result status="404" title="Không tìm thấy bài viết" />;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 15px 60px" }}>
      {/* CSS Tùy chỉnh riêng cho trang này để Mục lục thụt đầu dòng đẹp hơn */}
      <style>{`
        /* Thụt đầu dòng cho cấp con trong Anchor */
        .custom-toc .ant-anchor-link-title {
            white-space: normal; /* Cho phép xuống dòng nếu tiêu đề dài */
        }
        /* Cấp 2 thụt sâu vào */
        .custom-toc .ant-anchor-link .ant-anchor-link {
            padding-left: 20px !important;
            margin-top: 4px;
        }
        /* Chỉnh thanh line bên trái */
        .custom-toc .ant-anchor-ink {
            left: 0;
        }
        .custom-toc .ant-anchor {
            padding-left: 10px;
        }
      `}</style>

      <Breadcrumb
        items={[
          { title: <Link to="/">Trang chủ</Link> },
          { title: <Link to="/blogs">Bài viết</Link> },
          { title: post.title.substring(0, 40) + "..." },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={32}>
        {/* --- CỘT TRÁI: MỤC LỤC --- */}
        <Col xs={0} lg={6}>
          <div style={{ position: "sticky", top: 20 }}>
            <Card
              title={<><MenuOutlined /> Mục lục</>}
              size="small"
              bordered={false}
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 8 }}
              headStyle={{ background: '#fafafa', fontSize: 16, color: '#C92127' }}
            >
              {tocItems.length > 0 ? (
                <Anchor
                  className="custom-toc" // Class style tùy chỉnh
                  affix={false}
                  targetOffset={100}
                  items={tocItems}
                  getContainer={() => window}
                  style={{ maxHeight: '70vh', overflowY: 'auto' }}
                />
              ) : (
                <div style={{ padding: 15, color: '#999', textAlign: 'center', fontStyle: 'italic' }}>
                  Đang cập nhật mục lục...
                </div>
              )}
            </Card>
          </div>
        </Col>

        {/* --- CỘT PHẢI: NỘI DUNG --- */}
        <Col xs={24} lg={18}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Title level={1} style={{ fontSize: "2rem", marginBottom: 15, lineHeight: 1.3 }}>{post.title}</Title>

            <div style={{ display: "flex", alignItems: "center", gap: 15, color: "#888", marginBottom: 30, fontSize: 13, borderBottom: '1px solid #f0f0f0', paddingBottom: 15 }}>
               <span><UserOutlined /> {post.author || "Thiên Long"}</span>
               <Divider type="vertical" />
               <span><CalendarOutlined /> {new Date(post.date).toLocaleDateString("vi-VN")}</span>
            </div>

            <Paragraph style={{
                fontStyle: "italic",
                background: "#fff1f0",
                padding: "15px 20px",
                borderRadius: 6,
                borderLeft: "4px solid #C92127",
                color: "#555",
                fontSize: 16
            }}>
              {post.description}
            </Paragraph>

            {loading ? (
              <Spin style={{ display: 'block', margin: '50px auto' }} tip="Đang tải nội dung..." />
            ) : (
              <div
                className="blog-content-html"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{ lineHeight: 1.8, fontSize: 16, color: '#333' }}
              />
            )}

            <div style={{ marginTop: 50, paddingTop: 20, borderTop: '1px solid #eee' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/blogs")}>
                Xem tin tức khác
                </Button>
            </div>
          </div>
        </Col>
      </Row>

      <FloatButton.BackTop tooltip="Lên đầu trang" type="primary" style={{ right: 24, bottom: 24 }} />
    </div>
  );
};

export default BlogDetailPage;
