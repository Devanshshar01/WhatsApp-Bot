import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  fetchCommandSummary,
  fetchCommandTrend,
  fetchCommandHeatmap,
  fetchTopCommandUsers,
  fetchTopCommandGroups,
  downloadCommandRecordsCSV,
  downloadCommandRecordsXLSX,
} from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function AnalyticsPage() {
  const [days, setDays] = useState(7);

  const summaryAsync = useAsync(
    () => fetchCommandSummary({ limit: 10, days }),
    { immediate: false, initialData: { summary: [] } },
  );
  const trendAsync = useAsync(
    () => fetchCommandTrend({ days, top: 5 }),
    { immediate: false, initialData: { trend: [] } },
  );
  const heatmapAsync = useAsync(
    () => fetchCommandHeatmap({ days }),
    { immediate: false, initialData: { heatmap: [] } },
  );
  const topUsersAsync = useAsync(
    () => fetchTopCommandUsers({ limit: 10, days }),
    { immediate: false, initialData: { users: [] } },
  );
  const topGroupsAsync = useAsync(
    () => fetchTopCommandGroups({ limit: 10, days }),
    { immediate: false, initialData: { groups: [] } },
  );

  useEffect(() => {
    summaryAsync.execute();
    trendAsync.execute();
    heatmapAsync.execute();
    topUsersAsync.execute();
    topGroupsAsync.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const summaryChartData = useMemo(() => {
    const summary = summaryAsync.data?.summary || [];
    return {
      labels: summary.map((entry) => entry.command),
      datasets: [
        {
          label: 'Executions',
          data: summary.map((entry) => entry.count),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [summaryAsync.data]);

  const summaryChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Top Commands' },
    },
    scales: {
      x: { ticks: { color: '#cbd5f5' } },
      y: { ticks: { color: '#cbd5f5' }, beginAtZero: true },
    },
  }), []);

  const trendChartData = useMemo(() => {
    const trend = trendAsync.data?.trend || [];
    const labels = trend.map((entry) => entry.date);
    const commandKeys = new Set();
    trend.forEach((entry) => {
      Object.keys(entry.counts || {}).forEach((command) => commandKeys.add(command));
    });

    return {
      labels,
      datasets: Array.from(commandKeys).map((command, index) => {
        const colorPalette = [
          'rgba(16, 185, 129, 0.9)',
          'rgba(249, 115, 22, 0.9)',
          'rgba(129, 140, 248, 0.9)',
          'rgba(236, 72, 153, 0.9)',
          'rgba(234, 179, 8, 0.9)',
        ];
        return {
          label: command,
          data: trend.map((entry) => entry.counts?.[command] || 0),
          fill: false,
          borderColor: colorPalette[index % colorPalette.length],
          backgroundColor: colorPalette[index % colorPalette.length],
          tension: 0.25,
        };
      }),
    };
  }, [trendAsync.data]);

  const trendChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Command Usage Trend' },
    },
    scales: {
      x: { ticks: { color: '#cbd5f5' } },
      y: { ticks: { color: '#cbd5f5' }, beginAtZero: true },
    },
  }), []);

  const heatmapData = useMemo(() => {
    const heatmap = heatmapAsync.data?.heatmap || [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const max = heatmap.reduce((maxValue, day) => {
      const dayMax = Math.max(...day.hours, 0);
      return Math.max(maxValue, dayMax);
    }, 0);

    return heatmap.map((day) => ({
      label: dayNames[day.day] || `Day ${day.day}`,
      values: day.hours.map((count) => ({
        count,
        intensity: max ? count / max : 0,
      })),
    }));
  }, [heatmapAsync.data]);

  const topUsers = topUsersAsync.data?.users || [];
  const topGroups = topGroupsAsync.data?.groups || [];

  const loading =
    summaryAsync.loading ||
    trendAsync.loading ||
    heatmapAsync.loading ||
    topUsersAsync.loading ||
    topGroupsAsync.loading;

  const error =
    summaryAsync.error ||
    trendAsync.error ||
    heatmapAsync.error ||
    topUsersAsync.error ||
    topGroupsAsync.error;

  const handleExportCSV = () => {
    downloadCommandRecordsCSV({ days });
  };

  const handleExportXLSX = () => {
    downloadCommandRecordsXLSX({ days });
  };

  return (
    <div className="analytics-page" style={{ display: 'grid', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: '4px' }}>Command analytics</h3>
          <p style={{ opacity: 0.7, margin: 0 }}>Visualise how commands are used across your bot.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <label htmlFor="analytics-days" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Window:</span>
            <select
              id="analytics-days"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <button type="button" className="ghost" onClick={() => {
            summaryAsync.execute();
            trendAsync.execute();
            heatmapAsync.execute();
            topUsersAsync.execute();
            topGroupsAsync.execute();
          }} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="ghost" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button type="button" className="ghost" onClick={handleExportXLSX}>
              Export XLSX
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          Failed to load analytics data. {error?.response?.data?.error || error.message}
        </div>
      ) : null}

      <div className="grid" style={{ gap: '20px', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="card" style={{ minHeight: '320px' }}>
          <Bar data={summaryChartData} options={summaryChartOptions} />
        </div>
        <div className="card" style={{ minHeight: '320px' }}>
          <Line data={trendChartData} options={trendChartOptions} />
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '12px' }}>Activity heatmap</h4>
        {heatmapData.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '720px' }}>
              <thead>
                <tr>
                  <th>Day</th>
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <th key={hour} style={{ fontSize: '0.7rem' }}>{hour}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((day) => (
                  <tr key={day.label}>
                    <td style={{ fontWeight: 600 }}>{day.label}</td>
                    {day.values.map((value, hour) => {
                      const background = `rgba(59, 130, 246, ${0.1 + value.intensity * 0.6})`;
                      const color = value.intensity > 0.5 ? '#0f172a' : '#e2e8f0';
                      return (
                        <td
                          key={hour}
                          style={{
                            background,
                            color,
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '6px 4px',
                          }}
                        >
                          {value.count || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No command activity recorded for the selected window.</p>
        )}
      </div>

      <div className="grid" style={{ gap: '20px', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="card">
          <h4 style={{ marginBottom: '12px' }}>Top users</h4>
          {topUsers.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Total commands</th>
                    <th>Top commands</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((entry) => (
                    <tr key={entry.userId}>
                      <td>
                        <div>{entry.name || entry.phone || entry.userId}</div>
                        <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>{entry.userId}</div>
                      </td>
                      <td>{entry.totalCommands}</td>
                      <td>
                        {(entry.topCommands || []).map((cmd) => (
                          <span key={cmd.command} className="badge" style={{ marginRight: '6px' }}>
                            {cmd.command}: {cmd.count}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No user command activity recorded.</p>
          )}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '12px' }}>Top groups</h4>
          {topGroups.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Total commands</th>
                    <th>Top commands</th>
                  </tr>
                </thead>
                <tbody>
                  {topGroups.map((entry) => (
                    <tr key={entry.groupId}>
                      <td>
                        <div>{entry.name || entry.groupId}</div>
                        <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>{entry.groupId}</div>
                      </td>
                      <td>{entry.totalCommands}</td>
                      <td>
                        {(entry.topCommands || []).map((cmd) => (
                          <span key={cmd.command} className="badge" style={{ marginRight: '6px' }}>
                            {cmd.command}: {cmd.count}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No group command activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
