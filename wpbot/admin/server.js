const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const helpers = require('../utils/helpers');

/**
 * Start the admin panel server.
 * @param {Object} options
 * @param {import('../config')} options.config
 * @param {import('../database/database')} options.database
 * @param {import('../utils/logger')} options.logger
 * @param {import('../utils/commandHandler')} options.commandHandler
 * @param {Object} options.runtime
 * @param {() => boolean} options.runtime.getIsReady
 * @param {() => string|null} options.runtime.getQrCode
 * @param {() => any} options.runtime.getClientInfo
 * @param {() => number|null} options.runtime.getReadyAt
 * @param {() => number} options.runtime.getStartTime
 * @param {() => import('whatsapp-web.js').Client} options.getClient
 */
function startAdminServer({
  config,
  database,
  logger,
  commandHandler,
  runtime,
  getClient,
}) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const { admin } = config;
  const cookieName = admin.jwtCookieName;
  const tokenExpirySeconds = admin.sessionExpirySeconds || 3600;
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: tokenExpirySeconds * 1000,
  };

  if (!admin.password) {
    logger.warn('[ADMIN] Admin password is not configured. Admin panel login will be unavailable.');
  }

  /**
   * Issue a JWT token and set it as an HTTP-only cookie.
   */
  function setSessionCookie(res) {
    const token = jwt.sign(
      { role: 'admin', issuedAt: Date.now() },
      admin.jwtSecret,
      { expiresIn: tokenExpirySeconds }
    );
    res.cookie(cookieName, token, cookieOptions);
  }

  /**
   * Clear the admin session cookie.
   */
  function clearSessionCookie(res) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  /**
   * Middleware that ensures the requester is authenticated.
   */
  function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.[cookieName];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const payload = jwt.verify(token, admin.jwtSecret);
      req.admin = payload;
      return next();
    } catch (error) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const router = express.Router();

  router.post('/auth/login', (req, res) => {
    const { password } = req.body || {};

    if (!admin.password) {
      return res.status(500).json({ error: 'Admin password is not configured' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password !== admin.password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    setSessionCookie(res);
    return res.json({ success: true });
  });

  router.post('/auth/logout', (req, res) => {
    clearSessionCookie(res);
    return res.json({ success: true });
  });

  router.get('/auth/me', requireAuth, (req, res) => {
    return res.json({ authenticated: true });
  });

  router.get('/dashboard', requireAuth, (req, res) => {
    const isReady = runtime.getIsReady();
    const analytics = database.getAnalytics();
    const commandStats = database.getCommandStats(10);
    const featureFlags = database.getFeatureFlags(config.features);
    const clientInfo = runtime.getClientInfo();

    return res.json({
      ready: isReady,
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      analytics,
      commandStats,
      featureFlags,
      client: clientInfo
        ? {
            id: clientInfo.wid?.user || null,
            pushName: clientInfo.pushname || null,
            platform: clientInfo.platform || null,
          }
        : null,
      qrCode: isReady ? null : runtime.getQrCode(),
      readyAt: runtime.getReadyAt(),
      startTime: runtime.getStartTime(),
    });
  });

  router.get('/users', requireAuth, (req, res) => {
    const users = database.getAllUsers();
    return res.json({ users });
  });

  router.patch('/users/:id/block', requireAuth, (req, res) => {
    const { id } = req.params;
    const { blocked } = req.body || {};

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'Blocked value must be boolean' });
    }

    if (blocked) {
      database.blockUser(id);
    } else {
      database.unblockUser(id);
    }

    const user = database.getUser(id);
    return res.json({ success: true, user });
  });

  router.get('/groups', requireAuth, (req, res) => {
    const groups = database.getAllGroups().map((group) => ({
      ...group,
      messages: database.getGroupSettings(group.id) || {},
    }));
    return res.json({ groups });
  });

  router.patch('/groups/:id/settings', requireAuth, (req, res) => {
    const { id } = req.params;
    const { settings = {}, welcomeMessage, goodbyeMessage } = req.body || {};

    const group = database.getGroup(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const normalizedSettings = {
      welcomeEnabled: settings.welcomeEnabled ?? Boolean(group.welcome_enabled),
      goodbyeEnabled: settings.goodbyeEnabled ?? Boolean(group.goodbye_enabled),
      antiLink: settings.antiLink ?? Boolean(group.anti_link),
      antiSpam: settings.antiSpam ?? Boolean(group.anti_spam),
      profanityFilter: settings.profanityFilter ?? Boolean(group.profanity_filter),
    };

    database.updateGroupSettings(id, normalizedSettings);

    if (typeof welcomeMessage === 'string') {
      database.setGroupWelcomeMessage(id, welcomeMessage);
    }

    if (typeof goodbyeMessage === 'string') {
      database.setGroupGoodbyeMessage(id, goodbyeMessage);
    }

    return res.json({
      success: true,
      group: {
        ...database.getGroup(id),
        messages: database.getGroupSettings(id) || {},
      },
    });
  });

  router.get('/commands', requireAuth, (req, res) => {
    const commands = commandHandler.getCommandMetadata();
    return res.json({ commands });
  });

  router.patch('/commands/:name/toggle', requireAuth, (req, res) => {
    const commandNameParam = req.params.name || '';
    const canonical = commandNameParam.toLowerCase();
    const { enabled } = req.body || {};

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled value must be boolean' });
    }

    const command = commandHandler
      .getAllCommands()
      .find((cmd) => cmd.name.toLowerCase() === canonical);

    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }

    database.setCommandEnabled(command.name, enabled);
    const commands = commandHandler.getCommandMetadata();
    return res.json({ success: true, commands });
  });

  router.get('/logs', requireAuth, (req, res) => {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 1000) : 200;
    const lines = logger.getLatestLogLines(limit);
    return res.json({ lines });
  });

  router.post('/messages', requireAuth, async (req, res) => {
    const { target, message } = req.body || {};

    if (!target || typeof target !== 'string' || !message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Target and message are required' });
    }

    const client = getClient();
    if (!client || !runtime.getIsReady()) {
      return res.status(503).json({ error: 'Bot is not ready' });
    }

    try {
      const chatId = target.includes('@') ? target : `${target.replace(/\D/g, '')}@c.us`;
      await client.sendMessage(chatId, message);
      logger.info(`[ADMIN] Message sent via admin panel to ${chatId}`);
      return res.json({ success: true });
    } catch (error) {
      logger.error('[ADMIN] Failed to send message via admin panel:', error.message || error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  router.get('/settings', requireAuth, (req, res) => {
    const features = database.getFeatureFlags(config.features);
    const commandToggles = database.getCommandToggles();
    return res.json({ features, commandToggles });
  });

  router.patch('/settings/features', requireAuth, (req, res) => {
    const { features } = req.body || {};

    if (!features || typeof features !== 'object') {
      return res.status(400).json({ error: 'Features payload is required' });
    }

    Object.entries(features).forEach(([flag, value]) => {
      database.setFeatureFlag(flag, !!value);
    });

    return res.json({ success: true, features: database.getFeatureFlags(config.features) });
  });

  router.get('/moderation/overview', requireAuth, (req, res) => {
    const overview = database.getModerationOverview();
    return res.json({ overview });
  });

  router.get('/moderation/users/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { groupId } = req.query;
    const detail = database.getModerationDetail(id, groupId || null);

    if (!detail) {
      return res.status(404).json({ error: 'User not found' });
    }

    const logs = database.getModerationLogs({ userId: id, groupId: groupId || null, limit: 100 });
    return res.json({ detail, logs });
  });

  router.get('/moderation/logs', requireAuth, (req, res) => {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
    const logs = database.getModerationLogs({ limit });
    return res.json({ logs });
  });

  router.post('/moderation/warn', requireAuth, async (req, res) => {
    const { userId, groupId, reason } = req.body || {};

    if (!userId || !groupId) {
      return res.status(400).json({ error: 'userId and groupId are required' });
    }

    try {
      const actor = 'admin:panel';
      const result = database.addWarning(userId, groupId, reason || 'No reason provided', actor);

      const response = {
        success: true,
        warning: result.warning,
        totalWarnings: result.totalWarnings,
        autoMute: result.autoMute,
        caseId: result.caseId,
      };

      const client = getClient();
      if (client && runtime.getIsReady()) {
        try {
          const contact = await client.getContactById(userId);
          const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
          const mentionOptions = contact ? { mentions: [contact] } : undefined;

          await client.sendMessage(
            groupId,
            `⚠️ Warning issued to ${mentionTarget}\n• Reason: ${reason || 'No reason provided'}\n• Total warnings: ${result.totalWarnings}`,
            mentionOptions
          );

          if (result.autoMute) {
            const remaining = result.autoMute.expires_at ? Math.max(result.autoMute.expires_at - Date.now(), 0) : null;
            const durationText = remaining ? helpers.formatDuration(remaining) : '30 minutes';
            await client.sendMessage(
              groupId,
              `🚫 ${mentionTarget} has been automatically muted for ${durationText}.`,
              mentionOptions
            );
          }
        } catch (error) {
          logger.error('[ADMIN] Failed to send warn notification message:', error.message || error);
        }
      }

      return res.json(response);
    } catch (error) {
      logger.error('[ADMIN] Failed to warn user via admin panel:', error);
      return res.status(500).json({ error: 'Failed to warn user' });
    }
  });

  router.post('/moderation/mute', requireAuth, async (req, res) => {
    const { userId, groupId, durationMs, durationText, reason } = req.body || {};

    if (!userId || !groupId) {
      return res.status(400).json({ error: 'userId and groupId are required' });
    }

    const client = getClient();
    const actor = 'admin:panel';

    try {
      if (database.getActiveMute(userId, groupId)) {
        return res.status(409).json({ error: 'User is already muted in this group' });
      }

      const parsedDurationMs = typeof durationMs === 'number' && Number.isFinite(durationMs)
        ? Math.max(durationMs, 0)
        : helpers.parseDuration(durationText || '', 30);

      const mute = database.addMute(
        userId,
        groupId,
        parsedDurationMs,
        reason || 'Muted by admin',
        actor
      );

      if (client && runtime.getIsReady()) {
        try {
          const contact = await client.getContactById(userId);
          const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
          const mentionOptions = contact ? { mentions: [contact] } : undefined;
          const remaining = mute.expires_at ? Math.max(mute.expires_at - Date.now(), 0) : null;
          const niceDuration = remaining ? helpers.formatDuration(remaining) : 'until further notice';

          await client.sendMessage(
            groupId,
            `🚫 ${mentionTarget} has been muted for ${niceDuration}.\nReason: ${reason || 'Muted by admin'}`,
            mentionOptions
          );
        } catch (error) {
          logger.error('[ADMIN] Failed to send mute notification message:', error.message || error);
        }
      }

      return res.json({ success: true, mute });
    } catch (error) {
      logger.error('[ADMIN] Failed to mute user via admin panel:', error);
      return res.status(500).json({ error: 'Failed to mute user' });
    }
  });

  router.post('/moderation/clear-warnings', requireAuth, async (req, res) => {
    const { userId, scope = 'group', groupId, reason } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (scope !== 'all' && !groupId) {
      return res.status(400).json({ error: 'groupId is required when scope is not "all"' });
    }

    try {
      const actor = 'admin:panel';
      let result;

      if (scope === 'all') {
        result = database.clearAllWarningsForUser(userId);
      } else {
        result = database.clearUserWarnings(userId, groupId);
      }

      if (!result || result.cleared === 0) {
        return res.status(404).json({ error: 'No warnings found for the specified scope.' });
      }

      database.addModerationLog('unwarn', {
        user_id: userId,
        group_id: scope === 'all' ? null : groupId,
        reason: reason || 'Warnings cleared by admin',
        actor,
        cleared: result.cleared,
        case_ids: result.caseIds
      });

      const client = getClient();
      if (client && runtime.getIsReady() && scope !== 'all') {
        try {
          const contact = await client.getContactById(userId);
          const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
          const mentionOptions = contact ? { mentions: [contact] } : undefined;
          await client.sendMessage(
            groupId,
            `✅ ${mentionTarget} warnings have been cleared.\nReason: ${reason || 'Warnings cleared by admin'}\nTotal cleared: ${result.cleared}`,
            mentionOptions
          );
        } catch (error) {
          logger.error('[ADMIN] Failed to send clear warning notification message:', error.message || error);
        }
      }

      return res.json({ success: true, cleared: result.cleared, caseIds: result.caseIds });
    } catch (error) {
      logger.error('[ADMIN] Failed to clear warnings via admin panel:', error);
      return res.status(500).json({ error: 'Failed to clear warnings' });
    }
  });

  router.post('/moderation/clear-mutes', requireAuth, async (req, res) => {
    const { userId, scope = 'group', groupId, reason } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (scope !== 'all' && !groupId) {
      return res.status(400).json({ error: 'groupId is required when scope is not "all"' });
    }

    try {
      const actor = 'admin:panel';
      let result;

      if (scope === 'all') {
        result = database.clearAllMutesForUser(userId);
      } else {
        result = database.clearUserMutes(userId, groupId);
      }

      if (!result || result.cleared === 0) {
        return res.status(404).json({ error: 'No mutes found for the specified scope.' });
      }

      database.addModerationLog('clear_mute', {
        user_id: userId,
        group_id: scope === 'all' ? null : groupId,
        reason: reason || 'Mutes cleared by admin',
        actor,
        cleared: result.cleared,
        case_ids: result.caseIds
      });

      const client = getClient();
      if (client && runtime.getIsReady() && scope !== 'all') {
        try {
          const contact = await client.getContactById(userId);
          const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
          const mentionOptions = contact ? { mentions: [contact] } : undefined;
          await client.sendMessage(
            groupId,
            `✅ ${mentionTarget} mute history has been cleared.\nReason: ${reason || 'Mutes cleared by admin'}\nTotal cleared: ${result.cleared}`,
            mentionOptions
          );
        } catch (error) {
          logger.error('[ADMIN] Failed to send clear mute notification message:', error.message || error);
        }
      }

      return res.json({ success: true, cleared: result.cleared, caseIds: result.caseIds });
    } catch (error) {
      logger.error('[ADMIN] Failed to clear mutes via admin panel:', error);
      return res.status(500).json({ error: 'Failed to clear mutes' });
    }
  });

  router.post('/moderation/unmute', requireAuth, async (req, res) => {
    const { userId, groupId, reason } = req.body || {};

    if (!userId || !groupId) {
      return res.status(400).json({ error: 'userId and groupId are required' });
    }

    try {
      const actor = 'admin:panel';
      const mute = database.removeMute(userId, groupId, actor, reason || 'Unmuted by admin');

      if (!mute) {
        return res.status(404).json({ error: 'User is not muted in this group' });
      }

      const client = getClient();
      if (client && runtime.getIsReady()) {
        try {
          const contact = await client.getContactById(userId);
          const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
          const mentionOptions = contact ? { mentions: [contact] } : undefined;

          await client.sendMessage(
            groupId,
            `✅ ${mentionTarget} has been unmuted.\nReason: ${reason || 'Mute lifted by admin'}`,
            mentionOptions
          );
        } catch (error) {
          logger.error('[ADMIN] Failed to send unmute notification message:', error.message || error);
        }
      }

      return res.json({ success: true, mute });
    } catch (error) {
      logger.error('[ADMIN] Failed to unmute user via admin panel:', error);
      return res.status(500).json({ error: 'Failed to unmute user' });
    }
  });

  router.delete('/moderation/cases/:caseId', requireAuth, (req, res) => {
    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required' });
    }

    try {
      const result = database.deleteModerationCase(caseId);

      if (!result) {
        return res.status(404).json({ error: 'Case not found' });
      }

      return res.json({ success: true, case: result });
    } catch (error) {
      logger.error('[ADMIN] Failed to delete moderation case via admin panel:', error);
      return res.status(500).json({ error: 'Failed to delete moderation case' });
    }
  });

  app.use('/admin/api', router);

  // Serve built static assets when available
  const distPath = path.join(__dirname, '../admin-panel/dist');
  if (fs.existsSync(distPath)) {
    app.use('/admin', express.static(distPath));
    app.get('/admin/*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    logger.error('[ADMIN] Unexpected error:', error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = admin.port || 4000;
  app.listen(port, () => {
    logger.success(`[ADMIN] Admin server listening on http://localhost:${port}`);
    if (fs.existsSync(distPath)) {
      logger.success(`[ADMIN] Admin panel available at http://localhost:${port}/admin`);
    }
  });

  return app;
}

module.exports = startAdminServer;
