import React from 'react';

function StatCard({ label, value, icon, tone = 'info' }) {
  const toneClass = {
    info: 'badge',
    success: 'badge success',
    warning: 'badge warning',
    danger: 'badge danger',
  }[tone] || 'badge';

  return (
    <div className="card">
      <div className="flex-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        {icon ? <div className={toneClass} style={{ fontSize: '1.5rem' }}>{icon}</div> : null}
      </div>
    </div>
  );
}

export default StatCard;
