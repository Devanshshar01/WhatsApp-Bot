import React, { useMemo, useState } from 'react';

function normalizePhone(value) {
  if (!value) return '';
  return value.replace(/[^0-9+]/g, '');
}

function UserPicker({ users = [], value, onChange }) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return users.slice(0, 20);
    return users
      .filter((user) => {
        return (
          user.number?.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term) ||
          user.id?.toLowerCase().includes(term)
        );
      })
      .slice(0, 20);
  }, [users, filter]);

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <input
        type="search"
        placeholder="Search user"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      <select
        value={value || ''}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Select a user</option>
        {filtered.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.number || user.id} — {normalizePhone(user.number)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default UserPicker;
