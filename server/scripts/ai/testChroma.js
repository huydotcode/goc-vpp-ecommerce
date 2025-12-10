/**
 * Script kiểm tra ChromaDB - Query và xem kết quả
 * Usage: node scripts/ai/testChroma.js "từ khóa"
 */

const CHROMA_URL = process.env.CHROMA_URL || 'http://127.0.0.1:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY';
const COLLECTION_ID = 'c628af00-596c-4dd6-877d-67ca7aaca57f'; // products collection

async function getEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
        })
    });
    
    const data = await response.json();
    if (!data.embedding?.values) {
        throw new Error('Failed to get embedding: ' + JSON.stringify(data));
    }
    return data.embedding.values;
}

async function queryChroma(embedding, nResults = 10) {
    const url = `${CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${COLLECTION_ID}/query`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query_embeddings: [embedding],
            n_results: nResults,
            include: ['metadatas', 'documents', 'distances']
        })
    });
    
    return await response.json();
}

async function getCollectionInfo() {
    const url = `${CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${COLLECTION_ID}`;
    const response = await fetch(url);
    return await response.json();
}

async function main() {
    const query = process.argv[2] || 'bút';
    const limit = parseInt(process.argv[3]) || 10;
    
    console.log('=== ChromaDB Test Script ===\n');
    console.log(`🔍 Query: "${query}"`);
    console.log(`📊 Limit: ${limit}\n`);
    
    try {
        // 1. Get collection info
        console.log('1️⃣ Checking collection...');
        const collectionInfo = await getCollectionInfo();
        console.log(`   Collection: ${collectionInfo.name || 'products'}`);
        console.log(`   Total items: ${collectionInfo.count || 'unknown'}\n`);
        
        // 2. Create embedding
        console.log('2️⃣ Creating embedding for query...');
        const embedding = await getEmbedding(query);
        console.log(`   Embedding dimensions: ${embedding.length}\n`);
        
        // 3. Query ChromaDB
        console.log('3️⃣ Querying ChromaDB...\n');
        const results = await queryChroma(embedding, limit);
        
        if (!results.ids || !results.ids[0] || results.ids[0].length === 0) {
            console.log('❌ Không tìm thấy kết quả!');
            return;
        }
        
        const ids = results.ids[0];
        const distances = results.distances?.[0] || [];
        const metadatas = results.metadatas?.[0] || [];
        const documents = results.documents?.[0] || [];
        
        console.log(`✅ Tìm thấy ${ids.length} kết quả:\n`);
        console.log('─'.repeat(80));
        
        for (let i = 0; i < ids.length; i++) {
            const distance = distances[i]?.toFixed(4) || 'N/A';
            const metadata = metadatas[i] || {};
            const doc = documents[i] || '';
            
            // Distance threshold check
            const threshold = 0.7;
            const passThreshold = distances[i] <= threshold;
            const status = passThreshold ? '✓' : '✗';
            
            console.log(`${i + 1}. [${status}] ID: ${ids[i]} | Distance: ${distance}`);
            console.log(`   Name: ${metadata.name || doc.substring(0, 50) || 'N/A'}`);
            console.log(`   Category: ${metadata.categoryName || 'N/A'}`);
            console.log('');
        }
        
        console.log('─'.repeat(80));
        
        // Summary
        const passCount = distances.filter(d => d <= 0.7).length;
        const failCount = distances.filter(d => d > 0.7).length;
        
        console.log(`\n📈 Summary (threshold = 0.7):`);
        console.log(`   ✓ Pass: ${passCount} sản phẩm`);
        console.log(`   ✗ Fail: ${failCount} sản phẩm`);
        console.log(`   Min distance: ${Math.min(...distances).toFixed(4)}`);
        console.log(`   Max distance: ${Math.max(...distances).toFixed(4)}`);
        console.log(`   Avg distance: ${(distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(4)}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
