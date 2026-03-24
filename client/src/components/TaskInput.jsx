import { useState } from 'react';
import axios from 'axios';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--glow-strong)',
    width: '540px',
    maxWidth: '90vw',
    padding: '20px'
  },
  header: {
    fontSize: '11px',
    color: 'var(--accent)',
    marginBottom: '8px'
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '11px',
    marginBottom: '8px'
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px'
  },
  prompt: {
    color: 'var(--accent)',
    fontSize: '13px',
    paddingTop: '4px'
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-accent)',
    color: 'var(--text-bright)',
    fontSize: '13px',
    padding: '4px 2px',
    outline: 'none'
  },
  thinking: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '10px'
  },
  output: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '12px',
    fontSize: '12px',
    lineHeight: '1.7',
    whiteSpace: 'pre',
    color: 'var(--text)',
    marginBottom: '12px',
    overflowX: 'auto',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '8px'
  }
};

export default function TaskInput({ onClose, onTaskCreated }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input'); // input | thinking | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!input.trim()) return;
    setPhase('thinking');
    setError(null);
    try {
      const { data } = await axios.post('/api/agent', { message: `/task ${input}` });
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError(err.message);
      setPhase('input');
    }
  }

  function handleConfirm() {
    if (result?.task) onTaskCreated(result.task);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.panel} className="fade-in">
        <div style={styles.header}>&gt; /task</div>
        <div style={styles.header}>● new task</div>
        <div style={styles.divider}>────────────────────────────────────</div>

        {phase === 'input' && (
          <>
            <div style={styles.inputRow}>
              <span style={styles.prompt}>&gt;</span>
              <input
                style={styles.input}
                className="cursor"
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="describe your task..."
              />
            </div>
            {error && <div style={{ color: 'var(--priority-p1)', fontSize: '12px', marginBottom: '8px' }}>✗ {error}</div>}
            <div style={styles.hint}>[ enter ] submit  [ esc ] cancel</div>
          </>
        )}

        {phase === 'thinking' && (
          <div style={styles.thinking} className="pulse">daemon ● thinking...</div>
        )}

        {phase === 'result' && result && (
          <>
            <div style={styles.output}>
              {result.display || 'task processed'}
            </div>
            <div style={styles.actions}>
              <button className="btn-accent" onClick={handleConfirm}>[ enter ] confirm</button>
              <button onClick={() => setPhase('input')}>[ e ] edit</button>
              <button onClick={onClose}>[ esc ] cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
