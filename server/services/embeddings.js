// Local keyword-based "vector" store.
// In dummy mode this provides simple TF-like keyword search.
// Replace with real embeddings (e.g. OpenAI/Anthropic) when going live.

const store = new Map(); // id -> { text, meta }

function addEmbedding(id, text, meta = {}) {
  store.set(id, { text: text.toLowerCase(), meta });
}

function removeEmbedding(id) {
  store.delete(id);
}

function search(query, limit = 10) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];

  const results = [];
  for (const [id, { text, meta }] of store.entries()) {
    const matches = terms.filter(t => text.includes(t)).length;
    if (matches > 0) {
      results.push({ id, score: matches / terms.length, meta });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

function hydrate(items) {
  // Populate store from DB items (call on startup or after bulk import)
  for (const item of items) {
    const text = [item.title, item.summary, item.content, ...(item.tags || [])].join(' ');
    addEmbedding(item.id, text, { title: item.title, cluster: item.cluster });
  }
}

function size() {
  return store.size;
}

module.exports = { addEmbedding, removeEmbedding, search, hydrate, size };
