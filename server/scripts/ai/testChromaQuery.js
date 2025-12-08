// Test query ChromaDB bằng REST API để tìm format đúng
const CHROMA_URL = process.env.CHROMA_URL || "http://127.0.0.1:8000";
const COLLECTION = process.env.CHROMA_COLLECTION || "products";

// Test embedding mẫu (768 dimensions từ Gemini)
const testEmbedding = Array(768).fill(0.01);

async function testQuery() {
  const baseUrl = CHROMA_URL.endsWith("/") ? CHROMA_URL : CHROMA_URL + "/";
  
  const body = {
    query_embeddings: [testEmbedding],
    n_results: 3,
    where: {},
  };

  console.log("=== Test ChromaDB Query ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Collection: ${COLLECTION}\n`);

  // Test 1: Với tên đơn giản
  console.log("1. Test với tên đơn giản:");
  try {
    const url1 = `${baseUrl}api/v2/collections/${COLLECTION}/query`;
    console.log(`   URL: ${url1}`);
    const res1 = await fetch(url1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`   Status: ${res1.status}`);
    if (res1.ok) {
      const data = await res1.json();
      console.log(`   ✅ Success! Found ${data.ids?.[0]?.length || 0} results`);
      return;
    } else {
      const text = await res1.text();
      console.log(`   ❌ Failed: ${text.substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 2: Với CRN format
  console.log("\n2. Test với CRN format:");
  try {
    const crn = `default:default:${COLLECTION}`;
    const url2 = `${baseUrl}api/v2/collections/${crn}/query`;
    console.log(`   URL: ${url2}`);
    const res2 = await fetch(url2, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`   Status: ${res2.status}`);
    if (res2.ok) {
      const data = await res2.json();
      console.log(`   ✅ Success! Found ${data.ids?.[0]?.length || 0} results`);
      return;
    } else {
      const text = await res2.text();
      console.log(`   ❌ Failed: ${text.substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 3: Lấy collection ID trước
  console.log("\n3. Lấy collection ID và test với ID:");
  try {
    const listUrl = `${baseUrl}api/v1/collections`;
    console.log(`   List collections: ${listUrl}`);
    const listRes = await fetch(listUrl);
    if (listRes.ok) {
      const collections = await listRes.json();
      console.log(`   Found ${collections.length} collections`);
      const target = collections.find(c => c.name === COLLECTION || c.id === COLLECTION);
      if (target) {
        console.log(`   Collection ID: ${target.id}`);
        console.log(`   Collection name: ${target.name}`);
        
        // Test với ID
        const url3 = `${baseUrl}api/v2/collections/${target.id}/query`;
        console.log(`   Query URL: ${url3}`);
        const res3 = await fetch(url3, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        console.log(`   Status: ${res3.status}`);
        if (res3.ok) {
          const data = await res3.json();
          console.log(`   ✅ Success! Found ${data.ids?.[0]?.length || 0} results`);
          return;
        } else {
          const text = await res3.text();
          console.log(`   ❌ Failed: ${text.substring(0, 200)}`);
        }
      }
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Test 4: V1 API
  console.log("\n4. Test với V1 API:");
  try {
    const url4 = `${baseUrl}api/v1/collections/${COLLECTION}/query`;
    console.log(`   URL: ${url4}`);
    const res4 = await fetch(url4, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`   Status: ${res4.status}`);
    if (res4.ok) {
      const data = await res4.json();
      console.log(`   ✅ Success! Found ${data.ids?.[0]?.length || 0} results`);
      return;
    } else {
      const text = await res4.text();
      console.log(`   ❌ Failed: ${text.substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log("\n=== Không tìm thấy format đúng ===");
}

testQuery().catch(console.error);

