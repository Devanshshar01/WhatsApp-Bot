import React, { useEffect, useState } from 'react';
import { fetchSettings, updateFeatureFlags } from '../api/adminClient.js';
import Toggle from '../components/Toggle.jsx';

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureFlags, setFeatureFlags] = useState({});
  const [commandToggles, setCommandToggles] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await fetchSettings();
        if (isMounted) {
          setFeatureFlags(data.features || {});
          setCommandToggles(data.commandToggles || {});
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.error || err.message || 'Failed to load settings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFeatureChange = (flag, value) => {
    setFeatureFlags((state) => ({ ...state, [flag]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const { features } = await updateFeatureFlags(featureFlags);
      setFeatureFlags(features || {});
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to update feature flags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="flex-between">
        <h3 className="section-title">Global Settings</h3>
        <button type="button" className="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          {error}
        </div>
      ) : null}

      <div className="card" style={{ opacity: loading ? 0.6 : 1 }}>
        <h3>Feature flags</h3>
        <div className="grid" style={{ gap: '16px', marginTop: '16px' }}>
          {Object.keys(featureFlags).length ? (
            Object.entries(featureFlags).map(([flag, value]) => (
              <Toggle
                key={flag}
                id={`feature-${flag}`}
                label={flag}
                checked={value}
                onChange={(checked) => handleFeatureChange(flag, checked)}
              />
            ))
          ) : (
            <p>No feature flags available.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ opacity: loading ? 0.6 : 1 }}>
        <h3>Command toggles</h3>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.75 }}>
          Use the Commands page to toggle commands individually. This summary reflects the stored state.
        </p>
        <div className="grid" style={{ gap: '12px', marginTop: '16px' }}>
          {Object.keys(commandToggles).length ? (
            Object.entries(commandToggles).map(([command, enabled]) => (
              <div key={command} className="flex-between" style={{ borderBottom: '1px solid rgba(148,163,184,0.12)', paddingBottom: '8px' }}>
                <span>{command}</span>
                <span className={`badge ${enabled ? 'success' : 'warning'}`}>{enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            ))
          ) : (
            <p>No overrides applied yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
