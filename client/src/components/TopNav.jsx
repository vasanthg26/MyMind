import { toggleTheme } from '../utils/theme';

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '44px',
    padding: '0 16px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    zIndex: 10
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    width: '26px',
    height: '26px',
    background: 'var(--accent)',
    color: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: 'var(--glow)'
  },
  wordmark: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-bright)',
    letterSpacing: '0.05em'
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  tab: {
    padding: '4px 14px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    border: '1px solid transparent',
    background: 'transparent',
    transition: 'all 0.15s ease',
    letterSpacing: '0.02em'
  },
  tabActive: {
    color: 'var(--accent)',
    borderColor: 'var(--border-accent)',
    background: 'var(--accent-bg)',
    boxShadow: 'var(--glow)'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  themeLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    userSelect: 'none'
  }
};

export default function TopNav({ page, onPageChange, theme, onThemeToggle }) {
  return (
    <nav style={styles.nav}>
      {/* Left: logo + wordmark */}
      <div style={styles.left}>
        <div style={styles.logo}>M</div>
        <span style={styles.wordmark}>MyMind</span>
      </div>

      {/* Center: tabs */}
      <div style={styles.center}>
        <button
          style={{ ...styles.tab, ...(page === 'tasks' ? styles.tabActive : {}) }}
          onClick={() => onPageChange('tasks')}
        >
          ✦ Tasks
        </button>
        <button
          style={{ ...styles.tab, ...(page === 'kb' ? styles.tabActive : {}) }}
          onClick={() => onPageChange('kb')}
        >
          ◈ Knowledge
        </button>
      </div>

      {/* Right: theme toggle */}
      <div style={styles.right}>
        <span style={styles.themeLabel}>{theme === 'dark' ? '◉ dark' : '○ light'}</span>
        <label className="theme-toggle" title="Toggle theme">
          <input
            type="checkbox"
            checked={theme === 'light'}
            onChange={onThemeToggle}
          />
          <div className="theme-toggle-track" />
          <div className="theme-toggle-thumb" />
        </label>
      </div>
    </nav>
  );
}
