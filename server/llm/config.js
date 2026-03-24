require('dotenv').config();

const USE_DUMMY = process.env.USE_DUMMY !== 'false';

const MODEL_MAP = {
  classify_intent:  'claude-haiku-4-5-20251001',
  create_task:      'claude-haiku-4-5-20251001',
  update_task:      'claude-haiku-4-5-20251001',
  complete_task:    'claude-haiku-4-5-20251001',
  extract_urls:     'claude-haiku-4-5-20251001',
  auto_tag:         'claude-haiku-4-5-20251001',
  summarize_url:    'claude-sonnet-4-6',
  summarize_note:   'claude-sonnet-4-6',
  auto_cluster:     'claude-sonnet-4-6',
  break_subtasks:   'claude-sonnet-4-6',
  search_kb:        'claude-sonnet-4-6',
  prioritize_tasks: 'claude-sonnet-4-6',
  focus_mode:       'claude-sonnet-4-6',
  morning_briefing: 'claude-sonnet-4-6',
  kb_task_loop:     'claude-sonnet-4-6'
};

module.exports = { USE_DUMMY, MODEL_MAP };
