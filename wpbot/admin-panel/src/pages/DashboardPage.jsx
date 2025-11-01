import React, { useEffect } from 'react';
import { fetchDashboard } from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';
import StatCard from '../components/StatCard.jsx';

function DashboardPage() {
  const { data, loading, error, execute } = useAsync(fetchDashboard, { immediate: false, initialData: null });

  useEffect(() => {
    execute();
  }, [execute]);

  const dashboard = data || {};

  return (
    <div className="dashboard-page">
      <div className="flex-between">
        <h3 className="section-title">System Overview</h3>
        <button type="button" className="ghost" onClick={execute} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          Failed to load dashboard data. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="grid cols-3">
        <StatCard
          label="Bot Status"
          value={dashboard.ready ? 'Online' : 'Offline'}
          icon={dashboard.ready ? '✅' : '⚠️'}
          tone={dashboard.ready ? 'success' : 'warning'}
        />
        <StatCard label="Messages processed" value={dashboard.analytics?.totalMessagesProcessed ?? 0} icon="✉️" />
        <StatCard label="Registered users" value={dashboard.analytics?.totalUsers ?? 0} icon="🧑‍🤝‍🧑" />
        <StatCard label="Groups tracked" value={dashboard.analytics?.totalGroups ?? 0} icon="👥" />
        <StatCard label="Uptime (s)" value={Math.floor(dashboard.uptimeSeconds ?? 0)} icon="⏱️" />
        <StatCard label="Memory (MB)" value={Math.round((dashboard.memoryUsage?.rss ?? 0) / 1048576)} icon="🧠" />
      </div>

      {!dashboard.ready && dashboard.qrCode ? (
        <div className="card">
          <h3>QR Code Pending</h3>
          <p>Scan the QR code with WhatsApp to authenticate the bot. The raw QR payload is shown below:</p>
          <pre className="monospace" style={{ wordBreak: 'break-all' }}>{dashboard.qrCode}</pre>
        </div>
      ) : null}

      <div className="card">
        <div className="flex-between">
          <h3>Command Usage (Top 10)</h3>
          <span className="badge">Live Metrics</span>
        </div>
        {dashboard.commandStats?.length ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Executions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.commandStats.map((entry) => (
                  <tr key={entry.command}>
                    <td>{entry.command}</td>
                    <td>{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No command usage recorded yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Feature Flags</h3>
        <div className="kv-list">
          {dashboard.featureFlags ? (
            Object.entries(dashboard.featureFlags).map(([flag, value]) => (
              <div key={flag} className="flex-between">
                <span style={{ textTransform: 'capitalize' }}>{flag}</span>
                <span className={`badge ${value ? 'success' : 'warning'}`}>{value ? 'Enabled' : 'Disabled'}</span>
              </div>
            ))
          ) : (
            <p>No feature flags found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
