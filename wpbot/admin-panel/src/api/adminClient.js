import axios from 'axios';

export const adminClient = axios.create({
  baseURL: '/admin/api',
  withCredentials: true,
});

export async function login(password) {
  const { data } = await adminClient.post('/auth/login', { password });
  return data;
}

export async function logout() {
  const { data } = await adminClient.post('/auth/logout');
  return data;
}

export async function fetchSession() {
  const { data } = await adminClient.get('/auth/me');
  return data;
}

export async function fetchDashboard() {
  const { data } = await adminClient.get('/dashboard');
  return data;
}

export async function fetchUsers() {
  const { data } = await adminClient.get('/users');
  return data;
}

export async function toggleUserBlock(id, blocked) {
  const { data } = await adminClient.patch(`/users/${encodeURIComponent(id)}/block`, { blocked });
  return data;
}

export async function fetchGroups() {
  const { data } = await adminClient.get('/groups');
  return data;
}

export async function updateGroupSettings(id, payload) {
  const { data } = await adminClient.patch(`/groups/${encodeURIComponent(id)}/settings`, payload);
  return data;
}

export async function fetchCommands() {
  const { data } = await adminClient.get('/commands');
  return data;
}

export async function toggleCommand(name, enabled) {
  const { data } = await adminClient.patch(`/commands/${encodeURIComponent(name)}/toggle`, { enabled });
  return data;
}

export async function fetchLogs(limit = 200) {
  const { data } = await adminClient.get('/logs', { params: { limit } });
  return data;
}

export async function sendMessage(target, message) {
  const { data } = await adminClient.post('/messages', { target, message });
  return data;
}

export async function fetchSettings() {
  const { data } = await adminClient.get('/settings');
  return data;
}

export async function updateFeatureFlags(features) {
  const { data } = await adminClient.patch('/settings/features', { features });
  return data;
}

export async function fetchModerationOverview() {
  const { data } = await adminClient.get('/moderation/overview');
  return data;
}

export async function fetchModerationDetail(userId, { groupId } = {}) {
  const params = {};
  if (groupId) params.groupId = groupId;
  const { data } = await adminClient.get(`/moderation/users/${encodeURIComponent(userId)}`, { params });
  return data;
}

export async function fetchModerationLogs(limit = 50) {
  const { data } = await adminClient.get('/moderation/logs', { params: { limit } });
  return data;
}

export async function warnUser(payload) {
  const { data } = await adminClient.post('/moderation/warn', payload);
  return data;
}

export async function muteUser(payload) {
  const { data } = await adminClient.post('/moderation/mute', payload);
  return data;
}

export async function unmuteUser(payload) {
  const { data } = await adminClient.post('/moderation/unmute', payload);
  return data;
}

export async function clearWarnings(payload) {
  const { data } = await adminClient.post('/moderation/clear-warnings', payload);
  return data;
}

export async function clearMutes(payload) {
  const { data } = await adminClient.post('/moderation/clear-mutes', payload);
  return data;
}

export async function deleteModerationCase(caseId) {
  const { data } = await adminClient.delete(`/moderation/cases/${encodeURIComponent(caseId)}`);
  return data;
}
