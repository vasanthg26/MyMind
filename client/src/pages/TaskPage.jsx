import { useState } from 'react';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import AgentStrip from '../components/AgentStrip';
import FocusMode from '../components/FocusMode';
import Graveyard from '../components/Graveyard';
import useTasks from '../hooks/useTasks';

const styles = {
  page: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden'
  },
  left: {
    width: '240px',
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0
  },
  detailArea: {
    flex: 1,
    overflow: 'hidden'
  },
  right: {
    width: '300px',
    flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  rightTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)'
  },
  rightTab: {
    flex: 1,
    padding: '7px 0',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer'
  },
  rightTabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)'
  },
  rightContent: {
    flex: 1,
    overflow: 'hidden'
  }
};

const RIGHT_PANELS = ['focus', 'graveyard'];

export default function TaskPage({ onShowTaskInput }) {
  const { tasks, loading, createTask, updateTask, deleteTask, completeTask, toggleSubtask, addSubtask } = useTasks();
  const [selectedId, setSelectedId] = useState(null);
  const [rightPanel, setRightPanel] = useState('focus');

  const selectedTask = tasks.find(t => t.id === selectedId) || null;

  function handleTaskCreated(task) {
    setSelectedId(task.id);
  }

  function handleTaskUpdated(task) {
    if (task?.id) setSelectedId(task.id);
  }

  function handleRevive(task) {
    setSelectedId(task.id);
  }

  return (
    <div style={styles.page}>
      {/* Left: task list */}
      <div style={styles.left}>
        <TaskList
          tasks={tasks}
          loading={loading}
          selectedId={selectedId}
          onSelect={t => setSelectedId(t.id)}
          onNewTask={onShowTaskInput}
        />
      </div>

      {/* Center: detail + agent strip */}
      <div style={styles.center}>
        <div style={styles.detailArea}>
          <TaskDetail
            task={selectedTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onComplete={completeTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
          />
        </div>
        <AgentStrip
          task={selectedTask}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>

      {/* Right: focus / graveyard */}
      <div style={styles.right}>
        <div style={styles.rightTabs}>
          {RIGHT_PANELS.map(p => (
            <button
              key={p}
              style={{ ...styles.rightTab, ...(rightPanel === p ? styles.rightTabActive : {}) }}
              onClick={() => setRightPanel(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={styles.rightContent}>
          {rightPanel === 'focus' && (
            <FocusMode onSelectTask={t => setSelectedId(t.id)} />
          )}
          {rightPanel === 'graveyard' && (
            <Graveyard onRevive={handleRevive} />
          )}
        </div>
      </div>
    </div>
  );
}
