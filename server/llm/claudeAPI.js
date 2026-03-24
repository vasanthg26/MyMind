// Real Anthropic SDK implementation — currently inactive (USE_DUMMY=true).
// Activate by setting USE_DUMMY=false in .env

const Anthropic = require('@anthropic-ai/sdk');

let client;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPTS = {
  classify_intent: 'You classify user messages as "task", "kb", or "mixed" intent. Respond with JSON: { "intent": "task"|"kb"|"mixed", "confidence": 0.0-1.0 }',
  create_task: 'You parse natural language task descriptions into structured task objects. Respond with JSON: { "title": string, "priority": "p1"|"p2"|"p3", "due_date": "YYYY-MM-DD"|null, "tags": string[], "subtasks": [{title, done}], "energy": "deep"|"shallow"|"quick" }',
  update_task: 'You extract task update fields from natural language. Respond with JSON: { "updates": { optional fields } }',
  complete_task: 'You summarize completed tasks and extract learnings. Respond with JSON: { "summary": string, "learnings": string[], "effort": "quick"|"as_expected"|"harder_than_thought" }',
  extract_urls: 'Extract all URLs from the input text. Respond with JSON: { "urls": string[] }',
  auto_tag: 'Generate relevant hashtags for the input. Respond with JSON: { "tags": string[] }',
  summarize_url: 'Summarize the provided web content. Respond with JSON: { "title": string, "summary": string, "key_points": string[], "cluster": string, "tags": string[] }',
  summarize_note: 'Summarize the provided note. Respond with JSON: { "summary": string, "key_points": string[], "tags": string[], "cluster": string }',
  auto_cluster: 'Determine the best cluster/category for this content. Respond with JSON: { "cluster": string, "confidence": 0.0-1.0 }',
  break_subtasks: 'Break this task into actionable subtasks. Respond with JSON: { "subtasks": [{ "title": string, "done": false }] }',
  search_kb: 'Rank knowledge base items by relevance to the query. Respond with JSON: { "results": [{ "id": string, "score": number, "reason": string }] }',
  prioritize_tasks: 'Prioritize tasks by urgency and impact. Respond with JSON: { "prioritized": [{ "id": string, "score": number, "reason": string }] }',
  focus_mode: 'Recommend the single best task to work on now. Respond with JSON: { "task_id": string, "title": string, "reasoning": string, "estimated_minutes": number, "linked_kb_count": number, "energy": string }',
  morning_briefing: 'Generate a morning briefing. Respond with JSON: { "yesterday_summary": string, "today_tasks": [{id,title,priority,due_date}], "focus_suggestion": string, "total_tasks": number }',
  kb_task_loop: 'Find tasks related to this KB item. Respond with JSON: { "matched_tasks": [{task_id,task_title,relevance}], "suggested_links": string[] }'
};

async function call(taskType, model, input) {
  const systemPrompt = SYSTEM_PROMPTS[taskType] || 'You are a helpful assistant. Respond with JSON.';
  const userContent = typeof input === 'string' ? input : JSON.stringify(input);

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    });

    const text = response.content[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (err) {
    console.error(`[llm] ${taskType} failed:`, err.status, err.message);
    throw err;
  }
}

module.exports = { call };
