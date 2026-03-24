const { callLLM } = require('../llm/router');
const taskWorker = require('./taskWorker');
const kbWorker = require('./kbWorker');

async function route(message, context = {}) {
  const raw = (message || '').trim();

  if (!raw) {
    return { type: 'error', display: '  ✗ empty message' };
  }

  // Hard-wired routing by command prefix
  if (/^\/task/i.test(raw)) {
    return taskWorker.handle(raw, context);
  }

  if (/^\/kb/i.test(raw) || /^\/knowledge/i.test(raw)) {
    return kbWorker.handle(raw.replace(/^\/knowledge/i, '/kb'), context);
  }

  if (/^\/focus$/i.test(raw)) {
    return taskWorker.focusMode();
  }

  if (/^\/briefing$/i.test(raw) || /^\/morning$/i.test(raw)) {
    return taskWorker.morningBriefing();
  }

  if (/^\/graveyard$/i.test(raw)) {
    return taskWorker.graveyardList();
  }

  // Auto-detect URL paste
  if (/^https?:\/\/\S+$/.test(raw)) {
    return kbWorker.handle(raw, context);
  }

  // Auto-detect long text or code
  if (raw.length > 300 || /```[\s\S]*```/.test(raw)) {
    return kbWorker.handle(raw, context);
  }

  // Classify intent via LLM
  const classification = await callLLM('classify_intent', { message: raw });

  if (classification.intent === 'kb') {
    return kbWorker.handle(raw, context);
  }

  if (classification.intent === 'mixed') {
    const [taskResult, kbResult] = await Promise.all([
      taskWorker.handle(raw, context),
      kbWorker.handle(raw, context)
    ]);
    return {
      type: 'mixed',
      task: taskResult,
      kb: kbResult,
      display: [taskResult.display, '────────────────────', kbResult.display].join('\n')
    };
  }

  // Default: task intent
  return taskWorker.handle(raw, context);
}

module.exports = { route };
