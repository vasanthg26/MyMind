import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const styles = {
  strip: {
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '300px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  daemonLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-muted)'
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: 'var(--glow)'
  },
  toggle: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    minHeight: '60px'
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  msg: {
    fontSize: '12px',
    lineHeight: '1.5'
  },
  msgAgent: {
    color: 'var(--text)',
    whiteSpace: 'pre',
    fontFamily: 'inherit'
  },
  msgUser: {
    color: 'var(--text-muted)'
  },
  msgThinking: {
    color: 'var(--accent)',
    fontStyle: 'italic'
  },
  output: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    fontSize: '11px',
    whiteSpace: 'pre',
    color: 'var(--text)',
    overflowX: 'auto',
    lineHeight: '1.6'
  },
  quickActions: {
    display: 'flex',
    gap: '6px',
    padding: '4px 12px 6px',
    flexWrap: 'wrap'
  },
  qBtn: {
    fontSize: '10px',
    padding: '2px 8px',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 0.1s'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    padding: '6px 12px 16px',
    borderTop: '1px solid var(--border)',
    position: 'relative'
  },
  inputRow: {
    display: 'flex',
    gap: '6px'
  },
  chatInput: {
    flex: 1,
    padding: '5px 8px',
    fontSize: '12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)'
  },
  sendBtn: {
    padding: '5px 12px',
    fontSize: '11px',
    color: 'var(--accent)',
    border: '1px solid var(--border-accent)',
    background: 'transparent',
    cursor: 'pointer'
  },
  slashMenu: {
    position: 'absolute',
    bottom: '100%',
    left: '12px',
    right: '12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-accent)',
    zIndex: 100,
    marginBottom: '4px'
  },
  slashMenuHeader: {
    padding: '4px 10px',
    fontSize: '10px',
    color: 'var(--text-faint)',
    borderBottom: '1px solid var(--border)',
    letterSpacing: '0.05em'
  },
  slashOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s'
  },
  slashOptionName: {
    fontSize: '12px',
    color: 'var(--accent)',
    minWidth: '80px'
  },
  slashOptionDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)'
  },
  subMenu: {
    borderTop: '1px solid var(--border)'
  },
  subMenuHeader: {
    padding: '4px 10px',
    fontSize: '10px',
    color: 'var(--text-faint)',
    letterSpacing: '0.05em'
  },
  subOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '6px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s'
  },
  subOptionCmd: {
    fontSize: '11px',
    color: 'var(--text)',
    fontFamily: 'inherit'
  },
  subOptionHint: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  }
};

const SLASH_COMMANDS = [
  {
    name: '/task',
    description: 'create or manage tasks',
    subcommands: [
      { cmd: '/task ', label: '/task <description>', hint: 'create a new task with description' },
      { cmd: '/task focus', label: '/task focus', hint: 'show your highest priority task' },
      { cmd: '/task list p1', label: '/task list p1', hint: 'list all P1 priority tasks' },
      { cmd: '/task list p2', label: '/task list p2', hint: 'list all P2 priority tasks' },
      { cmd: '/task graveyard', label: '/task graveyard', hint: 'view abandoned tasks' }
    ]
  },
  {
    name: '/knowledge',
    description: 'search or add to knowledge base',
    subcommands: [
      { cmd: '/knowledge ', label: '/knowledge <query>', hint: 'search the knowledge base' },
      { cmd: '/knowledge add ', label: '/knowledge add <title> | <content>', hint: 'add a new knowledge entry' }
    ]
  }
];

const QUICK_ACTIONS = [
  { label: '/task focus', cmd: '/task focus' },
  { label: '/task list p1', cmd: '/task list p1' },
  { label: '/task graveyard', cmd: '/task graveyard' }
];

function MessageBubble({ msg }) {
  if (msg.type === 'thinking') {
    return <div style={{ ...styles.msg, ...styles.msgThinking }} className="pulse">daemon ● thinking...</div>;
  }
  if (msg.type === 'agent') {
    return <div style={styles.output}>{msg.text}</div>;
  }
  return (
    <div style={{ ...styles.msg, ...styles.msgUser }}>
      <span style={{ color: 'var(--text-faint)' }}>&gt; </span>{msg.text}
    </div>
  );
}

function SlashMenu({ input, onSelect, onClose }) {
  const [hoveredCmd, setHoveredCmd] = useState(null);
  const [expandedCmd, setExpandedCmd] = useState(null);

  const lower = input.toLowerCase();

  // Which top-level commands match what's typed so far
  const visibleCmds = SLASH_COMMANDS.filter(c => c.name.startsWith(lower) || lower.startsWith(c.name));

  // Auto-expand if input already matches a full command name
  useEffect(() => {
    const matched = SLASH_COMMANDS.find(c => lower.startsWith(c.name));
    if (matched) setExpandedCmd(matched.name);
  }, [lower]);

  if (visibleCmds.length === 0) return null;

  return (
    <div style={styles.slashMenu}>
      <div style={styles.slashMenuHeader}>COMMANDS</div>
      {visibleCmds.map(cmd => (
        <div key={cmd.name}>
          <div
            style={{
              ...styles.slashOption,
              background: hoveredCmd === cmd.name ? 'var(--bg)' : 'transparent'
            }}
            onMouseEnter={() => setHoveredCmd(cmd.name)}
            onMouseLeave={() => setHoveredCmd(null)}
            onClick={() => {
              setExpandedCmd(expandedCmd === cmd.name ? null : cmd.name);
              onSelect(cmd.name + ' ');
            }}
          >
            <span style={styles.slashOptionName}>{cmd.name}</span>
            <span style={styles.slashOptionDesc}>{cmd.description}</span>
          </div>

          {expandedCmd === cmd.name && (
            <div style={styles.subMenu}>
              <div style={styles.subMenuHeader}>SELECT A FORM</div>
              {cmd.subcommands.map(sub => (
                <div
                  key={sub.cmd}
                  style={{
                    ...styles.subOption,
                    background: hoveredCmd === sub.cmd ? 'var(--bg)' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredCmd(sub.cmd)}
                  onMouseLeave={() => setHoveredCmd(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onSelect(sub.cmd);
                    onClose();
                  }}
                >
                  <span style={styles.subOptionCmd}>{sub.label}</span>
                  <span style={styles.subOptionHint}>{sub.hint}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AgentStrip({ task, onTaskCreated, onTaskUpdated }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    { type: 'agent', text: task
      ? `daemon ● ready\n────────────────────\n  task: "${task.title}"\n  status: ${task.status}\n────────────────────\n  type a command or question`
      : 'daemon ● ready\n────────────────────\n  type /task <description> to create\n  type /task focus for focus mode' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (task) {
      setMessages([{
        type: 'agent',
        text: `daemon ● ready\n────────────────────\n  task: "${task.title}"\n  priority: ${task.priority === 'p1' ? '[ P1 ]' : task.priority === 'p2' ? '[ P2 ]' : '[ P3 ]'}\n  status: ${task.status}\n────────────────────\n  type a command or message`
      }]);
    }
  }, [task?.id]);

  function handleInputChange(e) {
    const val = e.target.value;
    setInput(val);
    setShowSlash(val.startsWith('/'));
  }

  function handleSlashSelect(cmd) {
    setInput(cmd);
    inputRef.current?.focus();
    // Position cursor at end after update
    setTimeout(() => {
      const el = inputRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  }

  async function send(cmd) {
    const msg = (cmd || input).trim();
    if (!msg) return;
    setInput('');
    setShowSlash(false);

    setMessages(prev => [...prev, { type: 'user', text: msg }, { type: 'thinking' }]);
    setLoading(true);

    try {
      const context = task ? { taskId: task.id, taskTitle: task.title } : {};
      const { data } = await axios.post('/api/agent', { message: msg, context });

      setMessages(prev => {
        const without = prev.filter(m => m.type !== 'thinking');
        return [...without, { type: 'agent', text: data.display || JSON.stringify(data, null, 2) }];
      });

      if (data.task && onTaskCreated) onTaskCreated(data.task);
      if (data.task && onTaskUpdated) onTaskUpdated(data.task);
    } catch (err) {
      setMessages(prev => {
        const without = prev.filter(m => m.type !== 'thinking');
        return [...without, { type: 'agent', text: `  ✗ error: ${err.message}` }];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.strip}>
      {/* Header */}
      <div style={styles.header} onClick={() => setOpen(o => !o)}>
        <div style={styles.daemonLabel}>
          <div style={styles.dot} className="pulse" />
          daemon ●
        </div>
        <span style={styles.toggle}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <>
          {/* Messages */}
          <div style={styles.body}>
            <div style={styles.messages}>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Quick actions */}
          <div style={styles.quickActions}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.cmd} style={styles.qBtn} onClick={() => send(a.cmd)}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={styles.footer}>
            {showSlash && (
              <SlashMenu
                input={input}
                onSelect={handleSlashSelect}
                onClose={() => setShowSlash(false)}
              />
            )}
            <div style={styles.inputRow}>
              <input
                ref={inputRef}
                style={styles.chatInput}
                placeholder="&gt; type command or message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setShowSlash(false); return; }
                  if (e.key === 'Enter' && !loading) send();
                }}
                disabled={loading}
              />
              <button style={styles.sendBtn} onClick={() => send()} disabled={loading}>
                send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
