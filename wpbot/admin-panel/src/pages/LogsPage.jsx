import React, { useEffect, useState } from 'react';
import { fetchLogs } from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';

function LogsPage() {
  const [limit, setLimit] = useState(200);
  const { data, loading, error, execute } = useAsync(() => fetchLogs(limit), {
    immediate: false,
    initialData: { lines: [] },
  });

  useEffect(() => {
    execute();
  }, [execute, limit]);

  return (
    <div className="logs-page">
      <div className="flex-between">
        <h3 className="section-title">Logs</h3>
        <div className="flex-wrap" style={{ gap: '12px' }}>
          <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            {[100, 200, 300, 500, 800, 1000].map((value) => (
              <option key={value} value={value}>
                Last {value} lines
              </option>
            ))}
          </select>
          <button type="button" className="ghost" onClick={execute} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          Failed to load logs. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="card">
        <h3>Latest entries</h3>
        <pre className="monospace" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {(data?.lines || []).join('\n') || (loading ? 'Loading logs…' : 'No logs available.')}
        </pre>
      </div>
    </div>
  );
}

export default LogsPage;
