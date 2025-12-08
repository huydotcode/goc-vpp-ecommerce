// Script kiểm tra ChromaDB collection
// Chạy: node checkChroma.js

const { ChromaClient } = require("chromadb");

const CHROMA_URL = process.env.CHROMA_URL || "http://127.0.0.1:8000";
const COLLECTION = process.env.CHROMA_COLLECTION || "products";

async function main() {
  console.log("=== Kiểm tra ChromaDB Collection ===\n");
  console.log(`ChromaDB URL: ${CHROMA_URL}`);
  console.log(`Collection name: ${COLLECTION}\n`);

  try {
    const client = new ChromaClient({ path: CHROMA_URL.replace(/\/$/, "") });
    
    // Lấy danh sách collections
    console.log("Đang lấy danh sách collections...");
    const collections = await client.listCollections();
    console.log(`Tìm thấy ${collections.length} collection(s):`);
    collections.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.name} (ID: ${col.id})`);
    });

    // Kiểm tra collection cụ thể
    console.log(`\nĐang kiểm tra collection '${COLLECTION}'...`);
    try {
      const collection = await client.getCollection({ name: COLLECTION });
      console.log(`✅ Collection '${COLLECTION}' tồn tại`);
      
      // Đếm số lượng items
      const count = await collection.count();
      console.log(`📊 Số lượng items trong collection: ${count}`);
      
      if (count > 0) {
        // Lấy một vài items mẫu
        const sample = await collection.get({ limit: 3 });
        console.log(`\n📝 Sample items (${Math.min(3, count)} items đầu tiên):`);
        if (sample.ids && sample.ids.length > 0) {
          sample.ids.forEach((id, idx) => {
            console.log(`  ${idx + 1}. ID: ${id}`);
            if (sample.metadatas && sample.metadatas[idx]) {
              console.log(`     Metadata: ${JSON.stringify(sample.metadatas[idx])}`);
            }
          });
        }
      } else {
        console.log("⚠️  Collection rỗng! Cần chạy indexChroma.js để index dữ liệu.");
      }
    } catch (error) {
      console.log(`❌ Collection '${COLLECTION}' không tồn tại!`);
      console.log(`   Lỗi: ${error.message}`);
      console.log(`\n💡 Giải pháp: Chạy script indexChroma.js để tạo và index collection.`);
    }

  } catch (error) {
    console.error("❌ Lỗi kết nối ChromaDB:", error.message);
    console.log("\n💡 Kiểm tra:");
    console.log("   1. ChromaDB đang chạy: docker ps | grep chroma");
    console.log("   2. ChromaDB URL đúng: http://127.0.0.1:8000");
    console.log("   3. Khởi động ChromaDB: docker start chromadb");
  }
}

main().catch((e) => {
  console.error("\n❌ Lỗi:", e);
  process.exit(1);
});

