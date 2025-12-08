// Seed 200 products (5 chủ đề x 40) bằng REST API hiện có.
// Yêu cầu:
// - Node 18+ (có fetch sẵn)
// - Env: API_BASE_URL (vd http://localhost:8080/api), API_TOKEN_ADMIN (Bearer)
// - Ảnh minh họa dùng chung (Cloudinary)
//
// Chạy:
//   API_BASE_URL=http://localhost:8080 API_TOKEN_ADMIN=... node seedProducts.js

const IMAGE =
  "https://res.cloudinary.com/dlgqtldwk/image/upload/v1764836647/app/dev/products/thumbnailurl_1764836643442_3c947cdd.jpg";

const THEMES = [
  { name: "Văn phòng", brand: "GVP Office", categories: [1], tags: ["bút", "sổ", "kẹp", "ghim", "bàn"] },
  { name: "Học tập", brand: "GVP Study", categories: [2], tags: ["vở", "balo", "bút chì", "tẩy", "thước"] },
  { name: "Sáng tạo", brand: "GVP Creative", categories: [3], tags: ["màu", "cọ", "giấy", "sáp", "canvas"] },
  { name: "Công nghệ", brand: "GVP Tech", categories: [4], tags: ["chuột", "bàn phím", "tai nghe", "hub", "cáp"] },
  { name: "Đời sống", brand: "GVP Life", categories: [5], tags: ["cốc", "bình", "đèn", "hộp", "kệ"] },
];

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USERNAME || "root_admin@system.local";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "123123";
let TOKEN = process.env.API_TOKEN_ADMIN || "";

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function buildProduct(theme, idx) {
  const tag = theme.tags[idx % theme.tags.length];
  const name = `${theme.name} - ${tag} ${idx + 1}`;
  const sku = `${theme.name.slice(0, 3).toUpperCase()}-${idx + 1}-${rand(1000, 9999)}`;
  const price = rand(50_000, 350_000);
  const discountPrice = Math.random() > 0.65 ? price - rand(5_000, 40_000) : null;
  const stockQuantity = rand(10, 120);
  
  // Tự động tạo default variant
  const defaultVariant = {
    variantType: "OTHER",
    variantValue: "Default",
    price: discountPrice || price,
    stockQuantity: stockQuantity,
    sku: sku,
    imageUrl: IMAGE,
    isActive: true,
    isDefault: true,
  };
  
  return {
    name,
    description: `Sản phẩm chủ đề ${theme.name}, phù hợp nhu cầu ${tag}.`,
    price,
    discountPrice,
    stockQuantity,
    sku,
    brand: theme.brand,
    color: null,
    size: null,
    weight: null,
    dimensions: null,
    specifications: `Chủ đề: ${theme.name}; Tag: ${tag}`,
    thumbnailUrl: IMAGE,
    categoryIds: theme.categories,
    isActive: true,
    isFeatured: Math.random() > 0.7,
    variants: [defaultVariant], // Bắt buộc có ít nhất 1 variant
  };
}

async function createProduct(p) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(p),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function loginAndGetToken() {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed ${res.status}: ${text}`);
  }
  const data = await res.json();
  const token = data?.data?.accessToken;
  if (!token) {
    throw new Error("Login response missing accessToken");
  }
  return token;
}

async function main() {
  if (!TOKEN) {
    TOKEN = await loginAndGetToken();
    console.log("Đã login admin và lấy token");
  }

  const products = [];
  THEMES.forEach((t) => {
    for (let i = 0; i < 40; i++) {
      products.push(buildProduct(t, i));
    }
  });

  console.log(`Sẽ tạo ${products.length} sản phẩm...`);

  const chunk = 10;
  for (let i = 0; i < products.length; i += chunk) {
    const batch = products.slice(i, i + chunk);
    await Promise.all(
      batch.map((p) =>
        createProduct(p)
          .then(() => console.log("OK", p.sku))
          .catch((e) => console.error("FAIL", p.sku, e.message)),
      ),
    );
  }

  console.log("Hoàn tất.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

