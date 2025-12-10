# ChromaDB Vector Search Configuration

## Overview
The AI vector search now supports advanced configuration for optimizing search accuracy and relevance.

## Configuration Properties

Add these to your `application.properties` or `application.yml`:

```properties
# Distance threshold for filtering results (0.0 to 1.0)
# Lower values = stricter matching, higher quality results
# Default: 0.7
ai.chroma.distance-threshold=0.7

# Distance metric for vector similarity
# Options: cosine, l2, ip
# Default: cosine (recommended for semantic search)
ai.chroma.distance-metric=cosine
```

## Distance Threshold Guide

| Threshold | Description | Use Case |
|-----------|-------------|----------|
| **0.3-0.5** | Very strict | Exact matches only, high precision |
| **0.6-0.7** | **Recommended** | Good balance of precision/recall |
| **0.8-0.9** | Relaxed | Broader results, more diversity |

## Distance Metrics

### Cosine (Default)
- Best for semantic text search
- Measures angle between vectors
- Range: 0 (identical) to 2 (opposite)

### L2 (Euclidean)
- Measures absolute distance
- Sensitive to magnitude
- Range: 0 (identical) to ∞

### IP (Inner Product)
- Fastest computation
- Good for normalized vectors
- Range: varies

## How It Works

1. **Query Expansion**: Vietnamese keywords are expanded with synonyms
   - "vở" → "vở tập vở viết vở học sinh"
   
2. **Vector Embedding**: Gemini creates semantic representation

3. **ChromaDB Query**: Finds similar product vectors

4. **Distance Filtering**: 
   - Only products with `distance <= threshold` are returned
   - Automatically filters out poor matches

5. **Reranking**: 
   - Results sorted by similarity (most relevant first)
   - Maintains ChromaDB's semantic ranking

## Example Usage

### Strict Matching (High Precision)
```properties
ai.chroma.distance-threshold=0.5
```
Result: Fewer but highly relevant products.

### Balanced (Default)
```properties
ai.chroma.distance-threshold=0.7
```
Result: Good mix of precision and recall.

### Broad Matching (High Recall)
```properties
ai.chroma.distance-threshold=0.9
```
Result: More diverse results, may include loosely related products.

## Testing

Test different thresholds:
```bash
# Strict
GET /api/v1/products/vector-suggest?q=bút&limit=10

# Adjust threshold in application.properties and restart
```

Monitor the number of results returned to tune the threshold for your needs.
