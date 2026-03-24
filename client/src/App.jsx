import { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import TaskPage from './pages/TaskPage';
import KBPage from './pages/KBPage';
import TaskInput from './components/TaskInput';
import MorningBriefing, { shouldShowBriefing } from './components/MorningBriefing';
import { applyStoredTheme, toggleTheme, getStoredTheme } from './utils/theme';

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
    color: 'var(--text)'
  },
  main: {
    flex: 1,
    overflow: 'hidden'
  }
};

export default function App() {
  const [activePage, setActivePage] = useState('tasks');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [taskKey, setTaskKey] = useState(0);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const t = applyStoredTheme();
    setTheme(t);
    if (shouldShowBriefing()) {
      setShowBriefing(true);
    }
  }, []);

  function handleThemeToggle() {
    setTheme(prev => toggleTheme(prev));
  }

  function handleTaskCreated() {
    setTaskKey(k => k + 1);
  }

  return (
    <div style={styles.app}>
      <TopNav page={activePage} onPageChange={setActivePage} theme={theme} onThemeToggle={handleThemeToggle} />

      <main style={styles.main}>
        {activePage === 'tasks' && (
          <TaskPage
            key={taskKey}
            onShowTaskInput={() => setShowTaskInput(true)}
          />
        )}
        {activePage === 'knowledge' && (
          <KBPage />
        )}
      </main>

      {showTaskInput && (
        <TaskInput
          onClose={() => setShowTaskInput(false)}
          onTaskCreated={(task) => {
            handleTaskCreated(task);
            setShowTaskInput(false);
          }}
        />
      )}

      {showBriefing && (
        <MorningBriefing onDismiss={() => setShowBriefing(false)} />
      )}
    </div>
  );
}
