import React, { useEffect, useMemo, useState } from 'react';
import { fetchUsers, toggleUserBlock } from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';

function UsersPage() {
  const { data, loading, error, execute, setData } = useAsync(fetchUsers, { immediate: false, initialData: { users: [] } });
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    execute();
  }, [execute]);

  const users = data?.users || [];

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const term = search.toLowerCase();
    return users.filter((user) => {
      return (
        user.id?.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.phone?.toString().toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const handleToggle = async (userId, nextBlocked) => {
    setToggling((state) => ({ ...state, [userId]: true }));
    try {
      const { user } = await toggleUserBlock(userId, nextBlocked);
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? user : u)),
      }));
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || err.message || 'Failed to update user');
    } finally {
      setToggling((state) => ({ ...state, [userId]: false }));
    }
  };

  return (
    <div className="users-page">
      <div className="flex-between">
        <h3 className="section-title">Users</h3>
        <div className="flex-wrap" style={{ gap: '12px' }}>
          <input
            type="search"
            placeholder="Search by name, number, id"
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
          Failed to load users. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Last Seen</th>
                <th>Messages</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>{user.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user.id}</div>
                    </td>
                    <td>{user.phone || '—'}</td>
                    <td>{user.last_seen ? new Date(user.last_seen).toLocaleString() : 'Never'}</td>
                    <td>{user.message_count ?? 0}</td>
                    <td>
                      <span className={`badge ${user.is_blocked ? 'danger' : 'success'}`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost"
                        disabled={toggling[user.id]}
                        onClick={() => handleToggle(user.id, !user.is_blocked)}
                      >
                        {user.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    {loading ? 'Loading users…' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
