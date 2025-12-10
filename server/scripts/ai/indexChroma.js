// Index sản phẩm vào ChromaDB bằng Gemini embedding + Chroma SDK (JS).
// Yêu cầu:
// - Node 18+
// - npm install chromadb
// - Env: API_BASE_URL (vd http://localhost:8080/api/v1), CHROMA_URL (vd http://localhost:8000),
//        CHROMA_COLLECTION=products, GEMINI_API_KEY
//
// Chạy:
//   API_BASE_URL=http://localhost:8080/api/v1 CHROMA_URL=http://localhost:8000 GEMINI_API_KEY=... node indexChroma.js

const { ChromaClient } = require("chromadb");

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080/api/v1";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION = process.env.CHROMA_COLLECTION || "products";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const ADMIN_USER = process.env.ADMIN_USERNAME || "root_admin@system.local";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "123123";
let TOKEN = process.env.API_TOKEN_ADMIN || "";

if (!GEMINI_KEY) {
  console.error("Thiếu GEMINI_API_KEY");
  process.exit(1);
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

async function fetchProducts(page = 1, size = 10) {
  if (!TOKEN) {
    TOKEN = await loginAndGetToken();
    console.log("Đã login admin và lấy token");
  }
  const url = `${API_BASE}/products/advanced?page=${page}&size=${size}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch products ${res.status}: ${text}`);
  }
  const response = await res.json();
  // API trả về {status, message, data, errorCode, timestamp}
  // data có thể là PaginatedResponseDTO {metadata, result}
  const data = response.data || response;
  return data;
}

async function embed(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embed fail ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data?.embedding?.values;
}

async function getCollection() {
  const client = new ChromaClient({ path: CHROMA_URL.replace(/\/$/, "") });
  const collection = await client.getOrCreateCollection({ name: COLLECTION });
  console.log(`Đã sẵn sàng collection '${COLLECTION}'`);
  return collection;
}

async function upsertToChroma(items, collection) {
  await collection.upsert({
    ids: items.map((i) => i.id),
    embeddings: items.map((i) => i.embedding),
    metadatas: items.map((i) => i.metadata),
    documents: items.map((i) => i.document),
  });
}

function buildDoc(p) {
  const desc = p.description || "";
  const specs = p.specifications || "";
  const name = p.name || "";
  return `${name}\nBrand: ${p.brand || "N/A"}\nSpecs: ${specs}\nDesc: ${desc}`.slice(0, 1200);
}

async function main() {
  console.log("=== Bắt đầu index sản phẩm vào ChromaDB ===");
  // Lấy collection (tự tạo nếu chưa có)
  console.log("Đang khởi tạo ChromaDB client/collection...");
  const collection = await getCollection();
  
  const pageSize = 10; // Xử lý 10 sản phẩm mỗi lần
  let page = 1;
  let total = 0;
  const startTime = Date.now();

  while (true) {
    console.log(`\n--- Trang ${page} ---`);
    const data = await fetchProducts(page, pageSize);
    const products = data.result || [];
    console.log(`Lấy được ${products.length} sản phẩm từ API`);
    
    if (products.length === 0) {
      console.log("Không còn sản phẩm nào, dừng lại");
      break;
    }

    const batch = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const productNum = (page - 1) * pageSize + i + 1;
      console.log(`[${productNum}/${data.metadata?.totalElements || '?'}] Đang xử lý: ${p.name} (ID: ${p.id})`);
      
      const doc = buildDoc(p);
      try {
        console.log(`  → Đang tạo embedding...`);
        const embedding = await embed(doc);
        if (!embedding) {
          console.log(`  ✗ Không tạo được embedding`);
          continue;
        }
        console.log(`  ✓ Embedding thành công (${embedding.length} dimensions)`);
        
        batch.push({
          id: String(p.id),
          embedding,
          metadata: {
            categoryId: p.categories?.[0]?.id || null,
            name: p.name,
            brand: p.brand,
            price: p.price,
            thumbnailUrl: p.thumbnailUrl,
          },
          document: doc,
        });
      } catch (e) {
        console.error(`  ✗ Lỗi embedding cho sản phẩm ${p.id}:`, e.message);
      }
    }

    if (batch.length > 0) {
      console.log(`\nĐang upsert ${batch.length} sản phẩm vào ChromaDB...`);
      await upsertToChroma(batch, collection);
      total += batch.length;
      console.log(`✓ Đã index batch trang ${page}: ${batch.length} sản phẩm | Tổng: ${total}/${data.metadata?.totalElements || '?'}`);
    }

    if ((data.metadata?.totalPages && page >= data.metadata.totalPages) || products.length < pageSize) {
      break;
    }
    page += 1;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n=== Hoàn tất ===`);
  console.log(`Tổng số sản phẩm đã index: ${total}`);
  console.log(`Thời gian: ${elapsed} giây`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


