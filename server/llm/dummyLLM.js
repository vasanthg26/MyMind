// Dummy LLM — simulates 600–900ms delay and returns canned responses.
// Response shapes match what claudeAPI.js will eventually return.

function delay() {
  return new Promise(r => setTimeout(r, 600 + Math.random() * 300));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

function inDays(n) {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

function inferPriority(msg) {
  if (/urgent|asap|blocking|critical|broken|down/i.test(msg)) return 'p1';
  if (/tonight|today|need to|must|deadline/i.test(msg)) return 'p1';
  if (/soon|this week|by friday|tomorrow/i.test(msg)) return 'p2';
  if (/explore|research|look into|low priority|someday|eventually/i.test(msg)) return 'p3';
  return 'p2';
}

function inferDueDate(msg) {
  if (/today|tonight|asap|urgent|now/i.test(msg)) return today();
  if (/tomorrow/i.test(msg)) return tomorrow();
  if (/this week|by friday/i.test(msg)) return inDays(5);
  if (/next week/i.test(msg)) return inDays(9);
  return null;
}

function inferEnergy(msg) {
  if (/urgent|asap|fix|bug|critical|deploy/i.test(msg)) return 'deep';
  if (/quick|small|minor|update|check/i.test(msg)) return 'quick';
  return 'shallow';
}

function extractTags(msg) {
  const keywords = {
    '#PeopleSoft': /peoplesoft|peoplecode|ps_/i,
    '#Bug': /bug|fix|broken|error|crash/i,
    '#TraceLens': /tracelens|trace/i,
    '#DevOps': /deploy|deployment|ci|cd|build/i,
    '#Refactor': /refactor|cleanup|clean up|restructure/i,
    '#Docs': /doc|document|write up|readme/i,
    '#Research': /research|explore|investigate|look into/i,
    '#IB': /integration broker|ib handler|pub.sub|pubsub/i,
    '#Auth': /auth|login|token|session|password/i,
    '#API': /api|endpoint|rest|graphql/i
  };
  const tags = [];
  for (const [tag, re] of Object.entries(keywords)) {
    if (re.test(msg)) tags.push(tag);
  }
  return tags.length ? tags : ['#General'];
}

function generateSubtasks(msg) {
  if (/fix|bug|error/i.test(msg)) {
    return [
      { title: 'Reproduce the issue', done: false },
      { title: 'Identify root cause', done: false },
      { title: 'Implement fix', done: false },
      { title: 'Test and verify', done: false }
    ];
  }
  if (/deploy|release/i.test(msg)) {
    return [
      { title: 'Run test suite', done: false },
      { title: 'Build production bundle', done: false },
      { title: 'Deploy and verify', done: false }
    ];
  }
  if (/refactor|restructure/i.test(msg)) {
    return [
      { title: 'Audit current implementation', done: false },
      { title: 'Design new structure', done: false },
      { title: 'Implement changes', done: false },
      { title: 'Validate behavior unchanged', done: false }
    ];
  }
  if (/research|explore|investigate/i.test(msg)) {
    return [
      { title: 'Gather initial resources', done: false },
      { title: 'Summarize findings', done: false }
    ];
  }
  if (/doc|document/i.test(msg)) {
    return [
      { title: 'Outline structure', done: false },
      { title: 'Write draft', done: false },
      { title: 'Review and publish', done: false }
    ];
  }
  // Simple tasks — no subtasks
  return [];
}

async function call(taskType, input) {
  await delay();

  const msg = (input.message || input.text || input.title || '').toString();

  switch (taskType) {

    case 'classify_intent': {
      const hasUrl = /https?:\/\//.test(msg);
      const isKBCmd = msg.startsWith('/kb');
      const isTaskCmd = msg.startsWith('/task');
      const looksLikeUrl = /^https?:\/\//.test(msg.trim());
      const looksLongText = msg.length > 300;
      const looksLikeCode = /```|def |function |const |import |class /.test(msg);

      if (isTaskCmd) return { intent: 'task', confidence: 0.98 };
      if (isKBCmd || looksLikeUrl) return { intent: 'kb', confidence: 0.97 };
      if (looksLongText || looksLikeCode) return { intent: 'kb', confidence: 0.88 };
      if (hasUrl && /task|todo|remind|need/i.test(msg)) return { intent: 'mixed', confidence: 0.82 };
      if (hasUrl) return { intent: 'kb', confidence: 0.91 };
      return { intent: 'task', confidence: 0.76 };
    }

    case 'create_task': {
      const clean = msg.replace(/^\/task\s+/i, '').trim();
      const priority = inferPriority(clean);
      const due_date = inferDueDate(clean);
      const tags = extractTags(clean);
      const subtasks = generateSubtasks(clean);
      const energy = inferEnergy(clean);
      const title = clean.length > 60 ? clean.slice(0, 57) + '...' : clean || 'New Task';
      return { title, priority, due_date, tags, subtasks, energy };
    }

    case 'update_task': {
      return {
        updates: {
          priority: inferPriority(msg),
          tags: extractTags(msg)
        }
      };
    }

    case 'complete_task': {
      return {
        summary: `Task completed. Key learnings captured from: ${msg.slice(0, 80)}`,
        learnings: [
          'Document the approach taken for future reference',
          'Note any edge cases discovered during implementation'
        ],
        effort: 'as_expected'
      };
    }

    case 'extract_urls': {
      const urlRe = /https?:\/\/[^\s"'>)]+/g;
      const urls = msg.match(urlRe) || [];
      return { urls };
    }

    case 'auto_tag': {
      return { tags: extractTags(msg) };
    }

    case 'summarize_url': {
      const title = input.title || 'Fetched Article';
      return {
        title,
        summary: `This resource covers key concepts related to ${title.toLowerCase()}. It provides practical guidance and examples for implementation.`,
        key_points: [
          'Core concept explained with practical examples',
          'Best practices and common pitfalls highlighted',
          'Implementation patterns demonstrated',
          'Performance considerations noted'
        ],
        cluster: input.cluster || 'General',
        tags: extractTags(title)
      };
    }

    case 'summarize_note': {
      return {
        summary: `Note captures ${msg.slice(0, 120).trim()}...`,
        key_points: [
          msg.split('.')[0]?.trim() || 'Key insight captured',
          'Reference for future implementation'
        ],
        tags: extractTags(msg),
        cluster: 'General'
      };
    }

    case 'auto_cluster': {
      const clusterMap = [
        { re: /peoplesoft|peoplecode|ps_/i, name: 'PeopleSoft' },
        { re: /integration broker|ib\s/i, name: 'Integration Broker' },
        { re: /trace|tracing|debug/i, name: 'PeopleCode Tracing' },
        { re: /app package|apppackage/i, name: 'App Packages' },
        { re: /react|vue|angular|frontend/i, name: 'Frontend' },
        { re: /node|express|api|backend/i, name: 'Backend' },
        { re: /sql|database|db|query/i, name: 'Database' }
      ];
      for (const { re, name } of clusterMap) {
        if (re.test(msg)) return { cluster: name, confidence: 0.88 };
      }
      return { cluster: 'General', confidence: 0.60 };
    }

    case 'break_subtasks': {
      return { subtasks: generateSubtasks(msg) };
    }

    case 'search_kb': {
      return {
        results: [
          { id: input.topId || 'placeholder', score: 0.91, reason: 'Strong keyword match on title and summary' },
          { id: input.secondId || 'placeholder2', score: 0.72, reason: 'Related cluster, partial tag overlap' }
        ]
      };
    }

    case 'prioritize_tasks': {
      const tasks = input.tasks || [];
      return {
        prioritized: tasks.map((t, i) => ({
          id: t.id,
          score: 1 - i * 0.1,
          reason: t.priority === 'p1' ? 'High priority, near due date' : 'Standard priority ranking'
        }))
      };
    }

    case 'focus_mode': {
      const tasks = input.tasks || [];
      const best = tasks.find(t => t.priority === 'p1' && t.status === 'active')
        || tasks.find(t => t.priority === 'p1')
        || tasks[0];

      if (!best) {
        return {
          task_id: null,
          title: 'No active tasks',
          reasoning: 'All caught up. Consider reviewing your Knowledge Base or planning tomorrow.',
          estimated_minutes: 0,
          linked_kb_count: 0,
          energy: 'shallow'
        };
      }

      return {
        task_id: best.id,
        title: best.title,
        reasoning: `${best.priority === 'p1' ? 'P1 priority' : 'Highest priority available'}. ${best.due_date ? `Due ${best.due_date}.` : ''} ${best.status === 'active' ? 'Already in progress.' : 'Ready to start.'}`,
        estimated_minutes: best.subtasks?.filter(s => !s.done).length * 25 || 30,
        linked_kb_count: input.linkedKBCount || 0,
        energy: best.energy || 'shallow'
      };
    }

    case 'morning_briefing': {
      const tasks = input.tasks || [];
      const p1 = tasks.filter(t => t.priority === 'p1' && t.status !== 'done');
      const p2 = tasks.filter(t => t.priority === 'p2' && t.status !== 'done');
      const active = tasks.find(t => t.status === 'active');

      return {
        yesterday_summary: active
          ? `Last session: working on "${active.title}". ${active.subtasks?.filter(s => s.done).length || 0} subtasks completed.`
          : 'No active session from yesterday.',
        today_tasks: [...p1, ...p2].slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          due_date: t.due_date
        })),
        focus_suggestion: p1[0]
          ? `Start with "${p1[0].title}" — it's P1 and ${p1[0].due_date ? `due ${p1[0].due_date}` : 'urgent'}.`
          : p2[0] ? `Consider "${p2[0].title}" as your focus today.`
          : 'Light day — good time for research or documentation.',
        total_tasks: tasks.filter(t => t.status !== 'done').length
      };
    }

    case 'kb_task_loop': {
      const kbItem = input.kbItem || {};
      const tasks = input.tasks || [];
      const matched = tasks
        .filter(t => {
          const blob = `${t.title} ${(t.tags || []).join(' ')}`.toLowerCase();
          const kbText = `${kbItem.title || ''} ${(kbItem.tags || []).join(' ')}`.toLowerCase();
          return kbText.split(' ').some(w => w.length > 3 && blob.includes(w));
        })
        .slice(0, 3);

      return {
        matched_tasks: matched.map(t => ({
          task_id: t.id,
          task_title: t.title,
          relevance: 'Tag and keyword overlap'
        })),
        suggested_links: matched.map(t => t.id)
      };
    }

    default:
      return { error: `Unknown taskType: ${taskType}` };
  }
}

module.exports = { call };
