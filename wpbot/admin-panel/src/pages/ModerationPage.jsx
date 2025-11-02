import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchModerationOverview,
  fetchModerationDetail,
  fetchGroups,
  warnUser,
  muteUser,
  unmuteUser,
  clearWarnings,
  clearMutes,
  deleteModerationCase,
} from '../api/adminClient.js';
import { useAsync } from '../hooks/useAsync.js';
import Toggle from '../components/Toggle.jsx';

function ModerationPage() {
  const overviewAsync = useAsync(fetchModerationOverview, { immediate: false, initialData: { overview: [] } });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('');

  const [warnForm, setWarnForm] = useState({ groupId: '', reason: '' });
  const [muteForm, setMuteForm] = useState({ groupId: '', duration: '30m', reason: '' });
  const [unmuteForm, setUnmuteForm] = useState({ groupId: '', reason: '' });
  const [actionState, setActionState] = useState({ warn: false, mute: false, unmute: false, clear: false, clearMutes: false });
  const [includeOnlyActive, setIncludeOnlyActive] = useState(false);
  const [clearForm, setClearForm] = useState({ scope: 'group', groupId: '', reason: '' });
  const [clearMuteForm, setClearMuteForm] = useState({ scope: 'group', groupId: '', reason: '' });
  const [deletingCaseIds, setDeletingCaseIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const dismissFeedback = () => setFeedback(null);

  const groupsById = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      if (group?.id) {
        map.set(group.id, group);
      }
    });
    return map;
  }, [groups]);

  const unmuteOptions = useMemo(() => {
    const activeOptions = (userDetail?.summary?.activeMutes || [])
      .filter((mute) => mute?.group_id)
      .map((mute) => {
        const group = groupsById.get(mute.group_id);
        return {
          value: mute.group_id,
          label: group?.name || mute.group_id,
        };
      });

    if (activeOptions.length) {
      return activeOptions;
    }

    return groups
      .filter((group) => group?.id)
      .map((group) => ({
        value: group.id,
        label: group.name || group.id,
      }));
  }, [groups, groupsById, userDetail?.summary?.activeMutes]);

  useEffect(() => {
    setUnmuteForm((state) => {
      if (!unmuteOptions.length) {
        if (!state.groupId) {
          return state;
        }
        return { ...state, groupId: '' };
      }

      if (unmuteOptions.some((option) => option.value === state.groupId)) {
        return state;
      }

      return { ...state, groupId: unmuteOptions[0].value };
    });
  }, [unmuteOptions]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    overviewAsync.execute();
    (async () => {
      try {
        const { groups: allGroups } = await fetchGroups();
        setGroups(allGroups || []);
      } catch (error) {
        console.error('Failed to fetch groups for moderation page:', error);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetail(null);
      setUserLogs([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { detail, logs } = await fetchModerationDetail(selectedUserId, {
          groupId: groupFilter || undefined,
        });
        if (!cancelled) {
          setUserDetail(detail);
          setUserLogs(logs || []);
        }
      } catch (error) {
        console.error('Failed to load moderation detail:', error);
        if (!cancelled) {
          setUserDetail(null);
          setUserLogs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId, groupFilter]);

  const filteredOverview = useMemo(() => {
    const list = overviewAsync.data?.overview || [];
    if (!includeOnlyActive) return list;
    return list.filter((entry) => (entry.warningsCount > 0) || (entry.activeMutes?.length));
  }, [overviewAsync.data, includeOnlyActive]);

  const selectedUserEntry = useMemo(() => {
    if (!selectedUserId) return null;
    return (overviewAsync.data?.overview || []).find((entry) => entry.user.id === selectedUserId) || null;
  }, [overviewAsync.data, selectedUserId]);

  const handleClearWarnings = async (event) => {
    event.preventDefault();
    if (!selectedUserId) return;

    if (clearForm.scope !== 'all' && !clearForm.groupId) {
      window.alert('Please pick a group to clear warnings in, or switch scope to "All groups".');
      return;
    }

    const targetLabel = selectedUserEntry?.user?.name || selectedUserEntry?.user?.phone || selectedUserId;
    const scopeLabel = clearForm.scope === 'all' ? 'all groups' : 'this group';
    const confirmed = window.confirm(`Clear warnings for ${targetLabel} in ${scopeLabel}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setActionState((state) => ({ ...state, clear: true }));
    try {
      const response = await clearWarnings({
        userId: selectedUserId,
        scope: clearForm.scope,
        groupId: clearForm.scope === 'all' ? undefined : clearForm.groupId,
        reason: clearForm.reason || 'Warnings cleared by admin',
      });
      if (response?.caseIds?.length) {
        console.info('[Moderation] Cleared warning case IDs:', response.caseIds.join(', '));
      }
      setClearForm((state) => ({ ...state, reason: '' }));
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      setFeedback({ type: 'success', message: `Cleared ${response?.cleared ?? 0} warning(s) for ${targetLabel} in ${scopeLabel}.` });
    } catch (error) {
      console.error('Clear warnings failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to clear warnings' });
    } finally {
      setActionState((state) => ({ ...state, clear: false }));
    }
  };

  const handleClearMutes = async (event) => {
    event.preventDefault();
    if (!selectedUserId) return;

    if (clearMuteForm.scope !== 'all' && !clearMuteForm.groupId) {
      window.alert('Please pick a group to clear mutes in, or switch scope to "All groups".');
      return;
    }

    const targetLabel = selectedUserEntry?.user?.name || selectedUserEntry?.user?.phone || selectedUserId;
    const scopeLabel = clearMuteForm.scope === 'all' ? 'all groups' : 'this group';
    const confirmed = window.confirm(`Clear mute history for ${targetLabel} in ${scopeLabel}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setActionState((state) => ({ ...state, clearMutes: true }));
    try {
      const response = await clearMutes({
        userId: selectedUserId,
        scope: clearMuteForm.scope,
        groupId: clearMuteForm.scope === 'all' ? undefined : clearMuteForm.groupId,
        reason: clearMuteForm.reason || 'Mutes cleared by admin',
      });
      if (response?.caseIds?.length) {
        console.info('[Moderation] Cleared mute case IDs:', response.caseIds.join(', '));
      }
      setClearMuteForm((state) => ({ ...state, reason: '' }));
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      setFeedback({ type: 'success', message: `Cleared ${response?.cleared ?? 0} mute record(s) for ${targetLabel} in ${scopeLabel}.` });
    } catch (error) {
      console.error('Clear mutes failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to clear mutes' });
    } finally {
      setActionState((state) => ({ ...state, clearMutes: false }));
    }
  };

  const handleDeleteCase = async (caseId) => {
    const normalized = caseId?.trim();
    if (!normalized) {
      window.alert('Unable to delete: missing case ID.');
      return;
    }

    if (deletingCaseIds.includes(normalized)) {
      return;
    }

    const confirmed = window.confirm(`Delete moderation case ${normalized}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingCaseIds((list) => [...list, normalized]);
    try {
      await deleteModerationCase(normalized);
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      setFeedback({ type: 'success', message: `Deleted case ${normalized}.` });
    } catch (error) {
      console.error('Delete moderation case failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to delete moderation record' });
    } finally {
      setDeletingCaseIds((list) => list.filter((id) => id !== normalized));
    }
  };

  const handleWarn = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !warnForm.groupId) return;
    setActionState((state) => ({ ...state, warn: true }));
    try {
      const response = await warnUser({
        userId: selectedUserId,
        groupId: warnForm.groupId,
        reason: warnForm.reason || 'No reason provided',
      });
      if (response?.caseId) {
        console.info('[Moderation] Warning case issued:', response.caseId);
      }
      setWarnForm((state) => ({ ...state, reason: '' }));
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      const targetLabel = selectedUserEntry?.user?.name || selectedUserEntry?.user?.phone || selectedUserId;
      setFeedback({ type: 'success', message: `Warning issued to ${targetLabel}${response?.caseId ? ` (Case ${response.caseId})` : ''}.` });
    } catch (error) {
      console.error('Warn failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to warn user' });
    } finally {
      setActionState((state) => ({ ...state, warn: false }));
    }
  };

  const handleMute = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !muteForm.groupId) return;
    setActionState((state) => ({ ...state, mute: true }));
    try {
      const response = await muteUser({
        userId: selectedUserId,
        groupId: muteForm.groupId,
        durationText: muteForm.duration,
        reason: muteForm.reason || 'Muted by admin',
      });
      if (response?.mute?.case_id) {
        console.info('[Moderation] Mute case issued:', response.mute.case_id);
      }
      setMuteForm((state) => ({ ...state, reason: '' }));
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      const targetLabel = selectedUserEntry?.user?.name || selectedUserEntry?.user?.phone || selectedUserId;
      const caseSuffix = response?.mute?.case_id ? ` (Case ${response.mute.case_id})` : '';
      setFeedback({ type: 'success', message: `Mute applied to ${targetLabel}${caseSuffix}.` });
    } catch (error) {
      console.error('Mute failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to mute user' });
    } finally {
      setActionState((state) => ({ ...state, mute: false }));
    }
  };

  const handleUnmute = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !unmuteForm.groupId) return;
    setActionState((state) => ({ ...state, unmute: true }));
    try {
      const response = await unmuteUser({
        userId: selectedUserId,
        groupId: unmuteForm.groupId,
        reason: unmuteForm.reason || 'Mute lifted by admin',
      });
      if (response?.mute?.case_id) {
        console.info('[Moderation] Unmute case logged under:', response.mute.case_id);
      }
      setUnmuteForm((state) => ({ ...state, reason: '' }));
      await overviewAsync.execute();
      const { detail, logs } = await fetchModerationDetail(selectedUserId, {
        groupId: groupFilter || undefined,
      });
      setUserDetail(detail);
      setUserLogs(logs || []);
      const targetLabel = selectedUserEntry?.user?.name || selectedUserEntry?.user?.phone || selectedUserId;
      setFeedback({ type: 'success', message: `Unmuted ${targetLabel}.` });
    } catch (error) {
      console.error('Unmute failed:', error);
      setFeedback({ type: 'error', message: error?.response?.data?.error || error.message || 'Failed to unmute user' });
    } finally {
      setActionState((state) => ({ ...state, unmute: false }));
    }
  };

  const renderOverviewTable = () => {
    if (overviewAsync.loading) {
      return <div className="card">Loading moderation data…</div>;
    }

    if (overviewAsync.error) {
      return (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)', color: '#fecaca' }}>
          Failed to load moderation overview. {overviewAsync.error?.response?.data?.error || overviewAsync.error.message}
        </div>
      );
    }

    if (!filteredOverview.length) {
      return <div className="card">No moderation records found.</div>;
    }

    return (
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '12px' }}>
          <h3>Users</h3>
          <button type="button" className="ghost" onClick={overviewAsync.execute}>
            Refresh
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Warnings</th>
                <th>Mutes</th>
                <th>Last warning</th>
                <th>Last mute</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverview.map((entry) => {
                const isSelected = entry.user.id === selectedUserId;
                return (
                  <tr
                    key={entry.user.id}
                    className={isSelected ? 'row-selected' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedUserId(entry.user.id)}
                  >
                    <td>
                      <div>{entry.user.name || entry.user.phone || entry.user.id}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{entry.user.id}</div>
                    </td>
                    <td>{entry.warningsCount}</td>
                    <td>
                      {entry.totalMutes}
                      {entry.activeMutes?.length ? (
                        <span className="badge warning" style={{ marginLeft: '8px' }}>
                          {entry.activeMutes.length} active
                        </span>
                      ) : null}
                    </td>
                    <td>{entry.lastWarning ? new Date(entry.lastWarning.created_at).toLocaleString() : '—'}</td>
                    <td>{entry.lastMute ? new Date(entry.lastMute.created_at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedUserId) {
      return <div className="card">Select a user to view detailed moderation history and actions.</div>;
    }

    if (!userDetail) {
      return <div className="card">Loading user moderation detail…</div>;
    }

    const user = userDetail.user || {};
    const summary = userDetail.summary || {};
    const warnings = userDetail.warnings || [];
    const groupedWarnings = userDetail.groupedWarnings || {};
    const mutes = userDetail.mutes || [];

    const formatDurationText = (ms) => {
      if (!ms || ms < 0) {
        return 'less than a second';
      }

      const totalSeconds = Math.floor(ms / 1000);
      const units = [
        { label: 'day', value: 24 * 60 * 60 },
        { label: 'hour', value: 60 * 60 },
        { label: 'minute', value: 60 },
        { label: 'second', value: 1 },
      ];

      const parts = [];
      let remaining = totalSeconds;

      units.forEach((unit) => {
        if (remaining >= unit.value) {
          const count = Math.floor(remaining / unit.value);
          remaining -= count * unit.value;
          parts.push(`${count} ${unit.label}${count !== 1 ? 's' : ''}`);
        }
      });

      return parts.slice(0, 2).join(', ') || 'less than a second';
    };

    return (
      <div className="card" style={{ display: 'grid', gap: '20px' }}>
        <div className="flex-between">
          <h3>Moderation detail</h3>
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name || group.id}
              </option>
            ))}
          </select>
        </div>

        <div className="grid cols-3">
          <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
            <div className="stat-label">Total warnings</div>
            <div className="stat-value">{summary.warningsCount || 0}</div>
          </div>
          <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
            <div className="stat-label">Total mutes</div>
            <div className="stat-value">{summary.totalMutes || 0}</div>
          </div>
          <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
            <div className="stat-label">Active mutes</div>
            <div className="stat-value">{(summary.activeMutes || []).length}</div>
          </div>
        </div>

        <section>
          <h4>Quick actions</h4>
          <div className="grid" style={{ gap: '16px' }}>
            <form onSubmit={handleWarn} className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h5>Warn user</h5>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Issues a warning in the selected group. 10 warnings auto-mute for 30 minutes.</p>
              <select
                value={warnForm.groupId}
                onChange={(event) => setWarnForm((state) => ({ ...state, groupId: event.target.value }))}
                required
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name || group.id}
                  </option>
                ))}
              </select>
              <textarea
                value={warnForm.reason}
                onChange={(event) => setWarnForm((state) => ({ ...state, reason: event.target.value }))}
                placeholder="Reason"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="primary" disabled={actionState.warn}>
                  {actionState.warn ? 'Issuing…' : 'Warn'}
                </button>
              </div>
            </form>

            <form onSubmit={handleMute} className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h5>Mute user</h5>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Temporarily mute the user in the selected group.</p>
              <select
                value={muteForm.groupId}
                onChange={(event) => setMuteForm((state) => ({ ...state, groupId: event.target.value }))}
                required
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name || group.id}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={muteForm.duration}
                onChange={(event) => setMuteForm((state) => ({ ...state, duration: event.target.value }))}
                placeholder="Duration (e.g. 30m, 2h, perm)"
              />
              <textarea
                value={muteForm.reason}
                onChange={(event) => setMuteForm((state) => ({ ...state, reason: event.target.value }))}
                placeholder="Reason"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="primary" disabled={actionState.mute}>
                  {actionState.mute ? 'Muting…' : 'Mute'}
                </button>
              </div>
            </form>

            <form onSubmit={handleUnmute} className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h5>Unmute user</h5>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Lift an active mute in the selected group.</p>
              <select
                value={unmuteForm.groupId}
                onChange={(event) => setUnmuteForm((state) => ({ ...state, groupId: event.target.value }))}
                required
              >
                <option value="">Select group</option>
                {unmuteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <textarea
                value={unmuteForm.reason}
                onChange={(event) => setUnmuteForm((state) => ({ ...state, reason: event.target.value }))}
                placeholder="Reason"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="primary" disabled={actionState.unmute}>
                  {actionState.unmute ? 'Processing…' : 'Unmute'}
                </button>
              </div>
            </form>

            <form onSubmit={handleClearWarnings} className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h5>Clear warnings</h5>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Use this if warnings were issued by mistake.</p>
              <div className="segmented">
                <label>
                  <input
                    type="radio"
                    name="clear-scope"
                    value="group"
                    checked={clearForm.scope === 'group'}
                    onChange={() => setClearForm((state) => ({ ...state, scope: 'group' }))}
                  />
                  Current group
                </label>
                <label>
                  <input
                    type="radio"
                    name="clear-scope"
                    value="all"
                    checked={clearForm.scope === 'all'}
                    onChange={() => setClearForm((state) => ({ ...state, scope: 'all' }))}
                  />
                  All groups
                </label>
              </div>

              {clearForm.scope !== 'all' ? (
                <select
                  value={clearForm.groupId}
                  onChange={(event) => setClearForm((state) => ({ ...state, groupId: event.target.value }))}
                  required
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name || group.id}
                    </option>
                  ))}
                </select>
              ) : null}

              <textarea
                value={clearForm.reason}
                onChange={(event) => setClearForm((state) => ({ ...state, reason: event.target.value }))}
                placeholder="Reason"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="primary" disabled={actionState.clear}>
                  {actionState.clear ? 'Clearing…' : 'Clear warnings'}
                </button>
              </div>
            </form>

            <form onSubmit={handleClearMutes} className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h5>Clear mutes</h5>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Removes mute history entries for the user.</p>
              <div className="segmented">
                <label>
                  <input
                    type="radio"
                    name="clear-mute-scope"
                    value="group"
                    checked={clearMuteForm.scope === 'group'}
                    onChange={() => setClearMuteForm((state) => ({ ...state, scope: 'group' }))}
                  />
                  Current group
                </label>
                <label>
                  <input
                    type="radio"
                    name="clear-mute-scope"
                    value="all"
                    checked={clearMuteForm.scope === 'all'}
                    onChange={() => setClearMuteForm((state) => ({ ...state, scope: 'all' }))}
                  />
                  All groups
                </label>
              </div>

              {clearMuteForm.scope !== 'all' ? (
                <select
                  value={clearMuteForm.groupId}
                  onChange={(event) => setClearMuteForm((state) => ({ ...state, groupId: event.target.value }))}
                  required
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name || group.id}
                    </option>
                  ))}
                </select>
              ) : null}

              <textarea
                value={clearMuteForm.reason}
                onChange={(event) => setClearMuteForm((state) => ({ ...state, reason: event.target.value }))}
                placeholder="Reason"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="primary" disabled={actionState.clearMutes}>
                  {actionState.clearMutes ? 'Clearing…' : 'Clear mutes'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section>
          <h4>Warnings in selected scope</h4>
          {warnings.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Reason</th>
                    <th>Group</th>
                    <th>Issued by</th>
                    <th>Date</th>
                    <th>Case ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((warning, index) => {
                    const caseId = warning.case_id || '—';
                    const isDeleting = caseId !== '—' && deletingCaseIds.includes(caseId);
                    return (
                      <tr key={warning.id}>
                        <td>{index + 1}</td>
                        <td>{warning.reason}</td>
                        <td>{warning.group_id || 'Direct'}</td>
                        <td>{warning.warned_by || 'system'}</td>
                        <td>{new Date(warning.created_at).toLocaleString()}</td>
                        <td className="monospace">{caseId}</td>
                        <td>
                          <button
                            type="button"
                            className="ghost"
                            disabled={caseId === '—' || isDeleting}
                            onClick={() => handleDeleteCase(caseId)}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No warnings recorded for this selection.</p>
          )}
        </section>

        <section>
          <h4>Mute history</h4>
          {mutes.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Reason</th>
                    <th>Group</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Case ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mutes.map((mute, index) => {
                    const remaining = mute.expires_at ? Math.max(mute.expires_at - Date.now(), 0) : null;
                    const status = mute.active
                      ? `Active — ${remaining ? `${formatDurationText(remaining)} remaining` : 'until lifted'}`
                      : 'Ended';
                    const caseId = mute.case_id || '—';
                    const isDeleting = caseId !== '—' && deletingCaseIds.includes(caseId);
                    return (
                      <tr key={mute.id || index}>
                        <td>{index + 1}</td>
                        <td>{mute.reason}</td>
                        <td>{mute.group_id || 'Direct'}</td>
                        <td>{status}</td>
                        <td>{new Date(mute.created_at).toLocaleString()}</td>
                        <td>{mute.expires_at ? new Date(mute.expires_at).toLocaleString() : '—'}</td>
                        <td className="monospace">{caseId}</td>
                        <td>
                          <button
                            type="button"
                            className="ghost"
                            disabled={caseId === '—' || isDeleting}
                            onClick={() => handleDeleteCase(caseId)}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No mutes recorded.</p>
          )}
        </section>

        <section>
          <h4>Moderation logs</h4>
          {userLogs.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Group</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Case ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userLogs.map((log) => {
                    const caseId = log.case_id || log.payload?.case_id || '—';
                    const isDeleting = caseId !== '—' && deletingCaseIds.includes(caseId);
                    return (
                      <tr key={log.id}>
                        <td>{log.action}</td>
                        <td>{log.payload?.actor || 'system'}</td>
                        <td>{log.payload?.group_id || '—'}</td>
                        <td>{log.payload?.reason || '—'}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td className="monospace">{caseId}</td>
                        <td>
                          <button
                            type="button"
                            className="ghost"
                            disabled={caseId === '—' || isDeleting}
                            onClick={() => handleDeleteCase(caseId)}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No moderation logs recorded for this user.</p>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="moderation-page">
      {feedback ? (
        <div
          className="feedback-banner"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: feedback.type === 'error' ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(34,197,94,0.4)',
            background: feedback.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            color: feedback.type === 'error' ? '#fecaca' : '#bbf7d0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>{feedback.message}</span>
          <button type="button" className="ghost" onClick={dismissFeedback} style={{ color: 'inherit' }}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex-between" style={{ alignItems: 'center' }}>
        <h3 className="section-title">Moderation center</h3>
        <Toggle
          id="filter-active"
          label="Show only users with warnings or active mutes"
          checked={includeOnlyActive}
          onChange={(checked) => setIncludeOnlyActive(checked)}
        />
      </div>

      <div className="grid" style={{ gap: '20px', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)' }}>
        <div>{renderOverviewTable()}</div>
        <div>{renderDetailPanel()}</div>
      </div>

      {selectedUserEntry ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <h4>User metadata</h4>
          <dl className="kv-list">
            <div>
              <dt>Name</dt>
              <dd>{selectedUserEntry.user.name || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{selectedUserEntry.user.phone || 'Unknown'}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd className="monospace" style={{ background: 'transparent', padding: 0 }}>{selectedUserEntry.user.id}</dd>
            </div>
            <div>
              <dt>Last seen</dt>
              <dd>{selectedUserEntry.user.last_seen ? new Date(selectedUserEntry.user.last_seen).toLocaleString() : '—'}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export default ModerationPage;
