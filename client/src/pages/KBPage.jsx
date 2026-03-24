import { useState } from 'react';
import KBList from '../components/KBList';
import KBDetail from '../components/KBDetail';
import KBSearch from '../components/KBSearch';
import AgentStrip from '../components/AgentStrip';
import useKB from '../hooks/useKB';

const styles = {
  page: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden'
  },
  left: {
    width: '320px',
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  listTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)'
  },
  tab: {
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
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)'
  },
  listContent: {
    flex: 1,
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
  }
};

export default function KBPage() {
  const { items, clusters, loading, deleteItem } = useKB();
  const [selectedItem, setSelectedItem] = useState(null);
  const [leftTab, setLeftTab] = useState('browse'); // browse | search
  const [searchQuery, setSearchQuery] = useState('');

  function handleSelect(item) {
    setSelectedItem(item);
  }

  function handleDelete(item) {
    deleteItem(item.id);
    if (selectedItem?.id === item.id) setSelectedItem(null);
  }

  return (
    <div style={styles.page}>
      {/* Left: browse / search */}
      <div style={styles.left}>
        <div style={styles.listTabs}>
          {['browse', 'search'].map(t => (
            <button
              key={t}
              style={{ ...styles.tab, ...(leftTab === t ? styles.tabActive : {}) }}
              onClick={() => setLeftTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={styles.listContent}>
          {leftTab === 'browse' && (
            <KBList
              items={items}
              clusters={clusters}
              selectedId={selectedItem?.id}
              onSelect={handleSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
          {leftTab === 'search' && (
            <KBSearch
              onSelect={handleSelect}
              selectedId={selectedItem?.id}
            />
          )}
        </div>
      </div>

      {/* Right: detail + agent */}
      <div style={styles.center}>
        <div style={styles.detailArea}>
          <KBDetail
            item={selectedItem}
            clusters={clusters}
            onDelete={handleDelete}
          />
        </div>
        <AgentStrip
          onTaskCreated={null}
          onTaskUpdated={null}
        />
      </div>
    </div>
  );
}
