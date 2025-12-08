// Script test nhanh các chức năng AI
// Yêu cầu: Node 18+, đã chạy seedProducts.js và indexChroma.js
//
// Chạy:
//   API_BASE_URL=http://localhost:8080/api/v1 ADMIN_USERNAME=... ADMIN_PASSWORD=... node testAI.js

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080/api/v1";
const ADMIN_USER = process.env.ADMIN_USERNAME || "root_admin@system.local";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "123123";
let TOKEN = "";

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

async function testAPI(endpoint, description) {
  console.log(`\n📌 Test: ${description}`);
  console.log(`   GET ${endpoint}`);
  
  try {
    const startTime = Date.now();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    const elapsed = Date.now() - startTime;
    
    if (!res.ok) {
      const text = await res.text();
      console.log(`   ❌ Failed: ${res.status} - ${text.substring(0, 100)}`);
      return null;
    }
    
    const data = await res.json();
    const products = Array.isArray(data) ? data : (data.data || data.result || []);
    
    console.log(`   ✅ Success (${elapsed}ms)`);
    console.log(`   📦 Số sản phẩm: ${products.length}`);
    if (products.length > 0) {
      console.log(`   🔍 Ví dụ: ${products[0].name} (ID: ${products[0].id})`);
    }
    
    return products;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function trackProductView(productId) {
  console.log(`\n📌 Track view: Product ID ${productId}`);
  
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    
    if (res.ok) {
      console.log(`   ✅ Tracked successfully`);
      return true;
    } else {
      console.log(`   ⚠️  Status: ${res.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("=== TEST CHỨC NĂNG AI GỢI Ý SẢN PHẨM ===\n");
  
  // Login
  console.log("🔐 Đang đăng nhập...");
  try {
    TOKEN = await loginAndGetToken();
    console.log("✅ Đăng nhập thành công\n");
  } catch (error) {
    console.error("❌ Đăng nhập thất bại:", error.message);
    process.exit(1);
  }
  
  // Test 1: General Suggestions
  await testAPI("/products/suggestions?limit=5", "General Suggestions");
  
  // Test 2: Vector Suggestions với query đơn giản
  await testAPI("/products/vector-suggest?q=bút&limit=5", "Vector Suggestions - Query: 'bút'");
  
  // Test 3: Vector Suggestions với query phức tạp
  await testAPI("/products/vector-suggest?q=màu+vẽ+sáng+tạo&limit=5", "Vector Suggestions - Query: 'màu vẽ sáng tạo'");
  
  // Test 4: Vector Suggestions với category filter
  await testAPI("/products/vector-suggest?q=công+nghệ&categoryId=4&limit=5", "Vector Suggestions - Query: 'công nghệ' + Category 4");
  
  // Test 5: Track một số sản phẩm
  console.log("\n📝 Đang track views...");
  await trackProductView(1);
  await trackProductView(2);
  await trackProductView(3);
  await trackProductView(10);
  await trackProductView(20);
  
  // Test 6: History-based Suggestions
  await testAPI("/products/history-suggest?limit=8", "History-based Suggestions");
  
  // Test 7: History-based với category filter
  await testAPI("/products/history-suggest?categoryId=1&limit=5", "History-based Suggestions - Category 1");
  
  // Test 8: Best Sellers
  await testAPI("/products/best-sellers?size=5", "Best Sellers");
  
  console.log("\n=== KẾT QUẢ TEST ===");
  console.log("✅ Đã hoàn tất tất cả các test");
  console.log("\n💡 Tips:");
  console.log("   - Nếu Vector Suggestions trả về ít kết quả, kiểm tra ChromaDB đã được index chưa");
  console.log("   - Nếu History Suggestions trả về best sellers, đảm bảo đã track đủ views");
  console.log("   - Kiểm tra server logs nếu có lỗi");
}

main().catch((e) => {
  console.error("\n❌ Lỗi:", e);
  process.exit(1);
});

