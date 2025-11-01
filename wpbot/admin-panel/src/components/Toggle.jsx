import React from 'react';

function Toggle({ id, label, checked, onChange, description }) {
  return (
    <label htmlFor={id} className="toggle">
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <div>
        <div>{label}</div>
        {description ? (
          <div style={{ fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.8)' }}>{description}</div>
        ) : null}
      </div>
    </label>
  );
}

export default Toggle;
