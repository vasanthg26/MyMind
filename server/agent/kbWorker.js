const { callLLM } = require('../llm/router');
const db = require('../db/queries');
const { fetchUrl } = require('../services/urlFetcher');
const embeddings = require('../services/embeddings');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectType(text) {
  if (/^https?:\/\//.test(text.trim())) return 'url';
  if (/```[\s\S]*```/.test(text) || /^\s*(function|const|let|var|def |class |import |#include)/m.test(text)) return 'snippet';
  return 'note';
}

function formatKBCard(item) {
  const tagLine = (item.tags || []).join(' ');
  const kpLines = (item.key_points || []).map((k, i) => `    ${i + 1}. ${k}`).join('\n');
  return [
    '────────────────────',
    `  title   : ${item.title}`,
    `  type    : ${item.type}`,
    `  cluster : ${item.cluster}`,
    `  tags    : ${tagLine || '—'}`,
    item.summary ? `  summary : ${item.summary.slice(0, 120)}...` : null,
    item.key_points?.length ? `  points  :\n${kpLines}` : null,
    item.source_url ? `  source  : ${item.source_url}` : null,
    '────────────────────'
  ].filter(Boolean).join('\n');
}

// ─── Operations ───────────────────────────────────────────────────────────────

async function addUrl(url, clusterHint) {
  // Fetch content
  const fetched = await fetchUrl(url);
  if (fetched.error) {
    return {
      type: 'kb_error',
      display: `  ✗ fetch failed: ${fetched.error}\n  url: ${url}`
    };
  }

  // Summarize via LLM
  const summary = await callLLM('summarize_url', {
    message: fetched.content.slice(0, 4000),
    title: fetched.title,
    cluster: clusterHint
  });

  // Auto-cluster
  const clusterResult = await callLLM('auto_cluster', {
    message: `${fetched.title} ${summary.summary || ''}`
  });

  const cluster = clusterHint || summary.cluster || clusterResult.cluster || 'General';
  db.upsertCluster(cluster);

  const item = db.createKBItem({
    type: 'url',
    title: summary.title || fetched.title,
    content: fetched.content,
    summary: summary.summary || '',
    key_points: summary.key_points || [],
    source_url: url,
    cluster,
    tags: summary.tags || []
  });

  embeddings.addEmbedding(item.id, `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`);

  return {
    type: 'kb_added',
    item,
    display: formatKBCard(item)
  };
}

async function addNote(text) {
  const type = detectType(text);
  const summary = await callLLM('summarize_note', { message: text });
  const clusterResult = await callLLM('auto_cluster', { message: text });

  const cluster = summary.cluster || clusterResult.cluster || 'General';
  db.upsertCluster(cluster);

  const item = db.createKBItem({
    type,
    title: summary.summary?.split('.')[0]?.trim()?.slice(0, 80) || 'Untitled Note',
    content: text,
    summary: summary.summary || '',
    key_points: summary.key_points || [],
    cluster,
    tags: summary.tags || []
  });

  embeddings.addEmbedding(item.id, `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`);

  return {
    type: 'kb_added',
    item,
    display: formatKBCard(item)
  };
}

async function searchKB(query) {
  const results = db.searchKBKeyword(query);
  const embResults = embeddings.search(query, 10);

  // Merge and deduplicate
  const seen = new Set();
  const merged = [];
  for (const r of [...results, ...embResults]) {
    if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
  }

  const items = merged.slice(0, 8).map(r => db.getKBById(r.id)).filter(Boolean);

  if (!items.length) {
    return {
      type: 'kb_search',
      results: [],
      display: `  no results for: "${query}"\n────────────────────`
    };
  }

  const lines = items.map((item, i) => {
    const highlight = (item.tags || []).join(' ');
    return `  ${i + 1}. [${item.cluster}] ${item.title}\n     ${highlight}`;
  }).join('\n');

  return {
    type: 'kb_search',
    results: items,
    query,
    display: `── search: "${query}" (${items.length} results) ──\n${lines}\n────────────────────`
  };
}

async function showCluster(clusterName) {
  const items = db.getKBByCluster(clusterName);
  const lines = items.length
    ? items.map((item, i) => `  ${i + 1}. [${item.type}] ${item.title}`)
    : ['  (empty cluster)'];

  return {
    type: 'kb_cluster',
    cluster: clusterName,
    items,
    display: `── cluster: ${clusterName} (${items.length}) ──\n${lines.join('\n')}\n────────────────────`
  };
}

async function summaryCluster(clusterName) {
  const items = db.getKBByCluster(clusterName);
  if (!items.length) {
    return { type: 'kb_summary', display: `  no items in cluster: ${clusterName}` };
  }

  const combined = items.map(i => `${i.title}: ${i.summary}`).join('\n');
  const result = await callLLM('summarize_note', { message: combined });

  const display = [
    `── summary: ${clusterName} ──`,
    '',
    result.summary,
    '',
    '  key points:',
    ...(result.key_points || []).map((k, i) => `    ${i + 1}. ${k}`),
    '────────────────────'
  ].join('\n');

  return { type: 'kb_summary', cluster: clusterName, result, display };
}

async function linkKBToTask(kbId, taskId) {
  const kb = db.getKBById(kbId);
  const task = db.getTaskById(taskId);
  if (!kb || !task) return { type: 'error', display: '  ✗ not found' };

  db.linkTaskKB(taskId, kbId);
  return {
    type: 'kb_linked',
    display: `  ✓ linked\n  ◈ "${kb.title}"\n  → "${task.title}"`
  };
}

async function detectActionable(text) {
  // Check if a note contains actionable items and suggest task creation
  const actionPatterns = /need to|should|must|TODO|fix|implement|update|create|add|review/i;
  if (!actionPatterns.test(text)) return null;

  const taskResult = await callLLM('create_task', { message: text });
  return {
    type: 'actionable_detected',
    suggested_task: taskResult,
    display: `  ● actionable detected\n  → create task: "${taskResult.title}"?\n  [ yes ] [ no ]`
  };
}

// ─── Parallel URL processing ──────────────────────────────────────────────────

async function bulkAddUrls(urls, clusterHint, onProgress) {
  const CONCURRENCY = 3;
  const results = [];

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(url => addUrl(url, clusterHint)));
    results.push(...batchResults);
    if (onProgress) onProgress(results.length, urls.length);
  }

  return results;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function handle(message, context) {
  const raw = message.trim();
  const body = raw.replace(/^\/kb\s*/i, '').trim();
  const lower = body.toLowerCase();

  if (lower.startsWith('add ')) {
    const target = body.slice(4).trim();
    if (/^https?:\/\//.test(target)) return addUrl(target);
    return addNote(target);
  }

  if (lower.startsWith('search ')) return searchKB(body.slice(7).trim());
  if (lower.startsWith('show ')) return showCluster(body.slice(5).trim());
  if (lower.startsWith('summary ')) return summaryCluster(body.slice(8).trim());

  // Auto-detect URL paste
  if (/^https?:\/\//.test(raw)) return addUrl(raw);

  // Auto-detect code snippet
  if (/```[\s\S]*```/.test(raw)) return addNote(raw);

  // Auto-detect long text
  if (raw.length > 300) return addNote(raw);

  return { type: 'kb_unknown', display: `  ✗ unknown kb command\n  try: /kb add <url|text>, /kb search <query>` };
}

module.exports = { handle, addUrl, addNote, searchKB, showCluster, summaryCluster, linkKBToTask, detectActionable, bulkAddUrls, formatKBCard };
