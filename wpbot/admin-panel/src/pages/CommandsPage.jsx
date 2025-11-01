import React, { useEffect, useMemo, useState } from 'react';
import { fetchCommands, toggleCommand } from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';
import Toggle from '../components/Toggle.jsx';

function CommandsPage() {
  const { data, loading, error, execute, setData } = useAsync(fetchCommands, {
    immediate: false,
    initialData: { commands: [] },
  });
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    execute();
  }, [execute]);

  const commands = data?.commands || [];

  const filtered = useMemo(() => {
    if (!search) return commands;
    const term = search.toLowerCase();
    return commands.filter((command) =>
      [command.name, command.description, command.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [commands, search]);

  const handleToggle = async (name, enabled) => {
    setToggling((state) => ({ ...state, [name]: true }));
    try {
      const { commands: updated } = await toggleCommand(name, enabled);
      setData({ commands: updated });
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || err.message || 'Failed to update command');
    } finally {
      setToggling((state) => ({ ...state, [name]: false }));
    }
  };

  return (
    <div className="commands-page">
      <div className="flex-between">
        <h3 className="section-title">Command Catalogue</h3>
        <div className="flex-wrap" style={{ gap: '12px' }}>
          <input
            type="search"
            placeholder="Search commands"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: '260px' }}
          />
          <button type="button" className="ghost" onClick={execute} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          Failed to load commands. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="card-stack">
        {filtered.length ? (
          filtered.map((command) => (
            <div key={command.name} className="card">
              <div className="flex-between">
                <div>
                  <h3>{command.name}</h3>
                  <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>{command.description || 'No description provided.'}</div>
                </div>
                <span className="badge">{command.category}</span>
              </div>

              <div className="grid" style={{ marginTop: '18px', gap: '12px' }}>
                <div className="kv-list">
                  <div>
                    <strong>Usage:</strong> <code className="monospace" style={{ display: 'inline-block' }}>{command.usage || 'n/a'}</code>
                  </div>
                  <div>
                    <strong>Cooldown:</strong> {command.cooldown} ms
                  </div>
                  <div className="flex-wrap">
                    {command.ownerOnly ? <span className="badge danger">Owner</span> : null}
                    {command.adminOnly ? <span className="badge warning">Admin</span> : null}
                    {command.groupOnly ? <span className="badge">Group only</span> : null}
                  </div>
                </div>
                <Toggle
                  id={`command-${command.name}`}
                  label="Enabled"
                  checked={command.enabled}
                  onChange={(value) => handleToggle(command.name, value)}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            {loading ? 'Loading commands…' : 'No commands match the search filter.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandsPage;
