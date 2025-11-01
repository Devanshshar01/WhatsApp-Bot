import React, { useEffect, useMemo, useState } from 'react';
import { fetchGroups, updateGroupSettings } from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';
import Toggle from '../components/Toggle.jsx';

function GroupsPage() {
  const { data, loading, error, execute, setData } = useAsync(fetchGroups, { immediate: false, initialData: { groups: [] } });
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState({});
  const [editingMessages, setEditingMessages] = useState({});

  useEffect(() => {
    execute();
  }, [execute]);

  const groups = data?.groups || [];

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const term = search.toLowerCase();
    return groups.filter((group) => group.name?.toLowerCase().includes(term) || group.id?.toLowerCase().includes(term));
  }, [groups, search]);

  const handleToggle = async (groupId, key, value) => {
    setUpdating((state) => ({ ...state, [groupId]: true }));
    try {
      const payload = { settings: { [key]: value } };
      const { group } = await updateGroupSettings(groupId, payload);
      setData((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id === groupId ? group : g)) }));
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || err.message || 'Failed to update group settings');
    } finally {
      setUpdating((state) => ({ ...state, [groupId]: false }));
    }
  };

  const handleMessageSave = async (groupId) => {
    const draft = editingMessages[groupId];
    if (!draft) return;
    setUpdating((state) => ({ ...state, [groupId]: true }));

    try {
      const payload = {
        welcomeMessage: draft.welcome_message,
        goodbyeMessage: draft.goodbye_message,
      };
      const { group } = await updateGroupSettings(groupId, payload);
      setData((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id === groupId ? group : g)) }));
      setEditingMessages((state) => ({ ...state, [groupId]: undefined }));
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || err.message || 'Failed to update group messages');
    } finally {
      setUpdating((state) => ({ ...state, [groupId]: false }));
    }
  };

  return (
    <div className="groups-page">
      <div className="flex-between">
        <h3 className="section-title">Groups</h3>
        <div className="flex-wrap" style={{ gap: '12px' }}>
          <input
            type="search"
            placeholder="Search groups"
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
          Failed to load groups. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="card-stack">
        {filteredGroups.length ? (
          filteredGroups.map((group) => {
            const drafts = editingMessages[group.id] || group.messages || {};
            return (
              <div key={group.id} className="card">
                <div className="flex-between">
                  <div>
                    <h3>{group.name || 'Unnamed group'}</h3>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{group.id}</div>
                  </div>
                  <div className="badge">Created {group.created_at ? new Date(group.created_at).toLocaleString() : '—'}</div>
                </div>

                <div className="grid" style={{ marginTop: '16px', gap: '16px' }}>
                  <Toggle
                    id={`${group.id}-welcome`}
                    label="Welcome message"
                    checked={Boolean(group.welcome_enabled)}
                    onChange={(value) => handleToggle(group.id, 'welcomeEnabled', value)}
                    description="Automatically greet new members"
                  />
                  <Toggle
                    id={`${group.id}-goodbye`}
                    label="Goodbye message"
                    checked={Boolean(group.goodbye_enabled)}
                    onChange={(value) => handleToggle(group.id, 'goodbyeEnabled', value)}
                    description="Send farewell when members leave"
                  />
                  <Toggle
                    id={`${group.id}-antilink`}
                    label="Anti-link"
                    checked={Boolean(group.anti_link)}
                    onChange={(value) => handleToggle(group.id, 'antiLink', value)}
                    description="Remove disallowed links automatically"
                  />
                  <Toggle
                    id={`${group.id}-antispam`}
                    label="Anti-spam"
                    checked={Boolean(group.anti_spam)}
                    onChange={(value) => handleToggle(group.id, 'antiSpam', value)}
                    description="Warn users that send messages too quickly"
                  />
                  <Toggle
                    id={`${group.id}-profanity`}
                    label="Profanity filter"
                    checked={Boolean(group.profanity_filter)}
                    onChange={(value) => handleToggle(group.id, 'profanityFilter', value)}
                    description="Delete messages with profane language"
                  />
                </div>

                <details style={{ marginTop: '16px' }}>
                  <summary style={{ cursor: 'pointer' }}>Custom messages</summary>
                  <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
                    <div>
                      <label htmlFor={`${group.id}-welcome-msg`} style={{ fontSize: '0.85rem' }}>
                        Welcome message
                      </label>
                      <textarea
                        id={`${group.id}-welcome-msg`}
                        value={drafts.welcome_message || ''}
                        onChange={(event) =>
                          setEditingMessages((state) => ({
                            ...state,
                            [group.id]: {
                              ...drafts,
                              welcome_message: event.target.value,
                            },
                          }))
                        }
                        placeholder="👋 Welcome @user to {group}!"
                      />
                    </div>

                    <div>
                      <label htmlFor={`${group.id}-goodbye-msg`} style={{ fontSize: '0.85rem' }}>
                        Goodbye message
                      </label>
                      <textarea
                        id={`${group.id}-goodbye-msg`}
                        value={drafts.goodbye_message || ''}
                        onChange={(event) =>
                          setEditingMessages((state) => ({
                            ...state,
                            [group.id]: {
                              ...drafts,
                              goodbye_message: event.target.value,
                            },
                          }))
                        }
                        placeholder="👋 Goodbye @user"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="ghost" onClick={() => setEditingMessages((state) => ({ ...state, [group.id]: undefined }))}>
                        Reset
                      </button>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => handleMessageSave(group.id)}
                        disabled={updating[group.id]}
                      >
                        Save messages
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            {loading ? 'Loading groups…' : 'No groups found.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupsPage;
