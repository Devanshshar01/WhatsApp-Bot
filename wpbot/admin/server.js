const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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
  app.use(express.json({ limit: '1mb' })); // Limit request body size
  app.use(cookieParser());

  // CORS configuration - allow all origins for personal/dev use
  app.use(cors({
    origin: true, // Allow all origins
    credentials: true, // Allow cookies
  }));

  // Rate limiting - 100 requests per 15 minutes per IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/admin/api', apiLimiter);

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

  // Input validation limits
  const MAX_REASON_LENGTH = 500;
  const MAX_MESSAGE_LENGTH = 4096;
  const MAX_BULK_USERS = 50;
  const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days max

  /**
   * Validate and truncate string input
   */
  function validateString(value, maxLength, fieldName) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    return value.slice(0, maxLength);
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

  router.get('/analytics/command-summary', requireAuth, (req, res) => {
    const limitParam = parseInt(req.query.limit, 10);
    const daysParam = parseInt(req.query.days, 10);
    const summary = database.getCommandUsageSummary({
      limit: Number.isFinite(limitParam) ? Math.max(limitParam, 1) : 10,
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : null,
    });
    return res.json({ summary });
  });

  router.get('/analytics/command-trend', requireAuth, (req, res) => {
    const daysParam = parseInt(req.query.days, 10);
    const topParam = parseInt(req.query.top, 10);
    const trend = database.getCommandUsageTrend({
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : 7,
      top: Number.isFinite(topParam) ? Math.max(topParam, 1) : 5,
    });
    return res.json({ trend });
  });

  router.get('/analytics/command-heatmap', requireAuth, (req, res) => {
    const daysParam = parseInt(req.query.days, 10);
    const heatmap = database.getCommandUsageHeatmap({
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : 7,
    });
    return res.json({ heatmap });
  });

  router.get('/analytics/top-users', requireAuth, (req, res) => {
    const limitParam = parseInt(req.query.limit, 10);
    const daysParam = parseInt(req.query.days, 10);
    const users = database.getCommandUsageByUsers({
      limit: Number.isFinite(limitParam) ? Math.max(limitParam, 1) : 10,
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : null,
    });
    return res.json({ users });
  });

  router.get('/analytics/top-groups', requireAuth, (req, res) => {
    const limitParam = parseInt(req.query.limit, 10);
    const daysParam = parseInt(req.query.days, 10);
    const groups = database.getCommandUsageByGroups({
      limit: Number.isFinite(limitParam) ? Math.max(limitParam, 1) : 10,
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : null,
    });
    return res.json({ groups });
  });

  router.get('/analytics/command-records.csv', requireAuth, (req, res) => {
    const daysParam = parseInt(req.query.days, 10);
    const records = database.getCommandUsageRecords({
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : null,
    });

    const header = 'Command,User ID,User Name,Group ID,Group Name,Executed At\n';
    const rows = records.map((record) => {
      const executed = new Date(record.executedAt).toISOString();
      return [
        record.command,
        record.userId || '',
        record.userName || '',
        record.groupId || '',
        record.groupName || '',
        executed,
      ].map((value) => {
        if (value === null || value === undefined) {
          return '';
        }
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="command-usage.csv"');
    res.send(header + rows.join('\n'));
  });

  router.get('/analytics/command-records.xlsx', requireAuth, async (req, res) => {
    const daysParam = parseInt(req.query.days, 10);
    const records = database.getCommandUsageRecords({
      days: Number.isFinite(daysParam) ? Math.max(daysParam, 1) : null,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Command Usage');
    worksheet.columns = [
      { header: 'Command', key: 'command', width: 20 },
      { header: 'User ID', key: 'userId', width: 25 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'Group ID', key: 'groupId', width: 25 },
      { header: 'Group Name', key: 'groupName', width: 25 },
      { header: 'Executed At', key: 'executedAt', width: 25 },
    ];

    records.forEach((record) => {
      worksheet.addRow({
        command: record.command,
        userId: record.userId || '',
        userName: record.userName || '',
        groupId: record.groupId || '',
        groupName: record.groupName || '',
        executedAt: new Date(record.executedAt).toISOString(),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="command-usage.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  });

  router.post('/messages', requireAuth, async (req, res) => {
    const { target, message } = req.body || {};

    if (!target || typeof target !== 'string' || !message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Target and message are required' });
    }

    // Validate input lengths
    if (target.length > 100) {
      return res.status(400).json({ error: 'Target is too long' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` });
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

  router.get('/moderation/stream', requireAuth, (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const sendEvent = (record) => {
      try {
        res.write(`data: ${JSON.stringify(record)}\n\n`);
      } catch (error) {
        logger.error('[ADMIN] Failed to write moderation SSE:', error?.message || error);
      }
    };

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    database.events?.on('moderationLog', sendEvent);

    req.on('close', () => {
      clearInterval(heartbeat);
      database.events?.off('moderationLog', sendEvent);
    });
  });

  router.post('/moderation/warn', requireAuth, async (req, res) => {
    const { userId, groupId, reason } = req.body || {};

    if (!userId || !groupId) {
      return res.status(400).json({ error: 'userId and groupId are required' });
    }

    // Validate reason length
    const validatedReason = validateString(reason, MAX_REASON_LENGTH, 'reason') || 'No reason provided';

    try {
      const actor = 'admin:panel';
      const result = database.addWarning(userId, groupId, validatedReason, actor);

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

    // Validate reason length
    const validatedReason = validateString(reason, MAX_REASON_LENGTH, 'reason') || 'Muted by admin';

    const client = getClient();
    const actor = 'admin:panel';

    try {
      if (database.getActiveMute(userId, groupId)) {
        return res.status(409).json({ error: 'User is already muted in this group' });
      }

      const parsedDurationMs = typeof durationMs === 'number' && Number.isFinite(durationMs)
        ? Math.min(Math.max(durationMs, 0), MAX_DURATION_MS)
        : Math.min(helpers.parseDuration(durationText || '', 30), MAX_DURATION_MS);

      const mute = database.addMute(
        userId,
        groupId,
        parsedDurationMs,
        validatedReason,
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

  router.post('/moderation/kick', requireAuth, async (req, res) => {
    const { userId, groupId, reason } = req.body || {};

    if (!userId || !groupId) {
      return res.status(400).json({ error: 'userId and groupId are required' });
    }

    const client = getClient();
    if (!client || !runtime.getIsReady()) {
      return res.status(503).json({ error: 'Bot is not ready' });
    }

    try {
      await client.groupRemove(groupId, [userId]);
      database.addModerationLog('kick', {
        user_id: userId,
        group_id: groupId,
        reason: reason || 'Removed by admin',
        actor: 'admin:panel',
      });

      try {
        const contact = await client.getContactById(userId);
        logger.info(`[ADMIN] Kicked ${contact?.pushname || userId} from ${groupId}`);
      } catch (contactError) {
        logger.warn('[ADMIN] Failed to fetch contact during kick:', contactError?.message || contactError);
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error('[ADMIN] Failed to kick user via admin panel:', error);
      return res.status(500).json({ error: 'Failed to kick user' });
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

  router.post('/moderation/bulk', requireAuth, async (req, res) => {
    const { action, userIds, groupId, reason, durationMs, durationText, scope = 'group' } = req.body || {};

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    // Limit bulk operations to prevent abuse
    if (userIds.length > MAX_BULK_USERS) {
      return res.status(400).json({ error: `Cannot process more than ${MAX_BULK_USERS} users at once` });
    }

    // Validate reason length
    const validatedReason = validateString(reason, MAX_REASON_LENGTH, 'reason') || 'No reason provided';

    const results = [];
    const client = getClient();
    const actor = 'admin:panel';

    const handleWarn = async (userId) => {
      if (!groupId) {
        return { userId, success: false, error: 'groupId is required for warn' };
      }
      try {
        const response = database.addWarning(userId, groupId, validatedReason, actor);
        return { userId, success: true, data: response };
      } catch (error) {
        logger.error('[ADMIN] Bulk warn failed:', error);
        return { userId, success: false, error: error?.message || 'Failed to warn' };
      }
    };

    const handleMute = async (userId) => {
      if (!groupId) {
        return { userId, success: false, error: 'groupId is required for mute' };
      }
      try {
        if (database.getActiveMute(userId, groupId)) {
          return { userId, success: false, error: 'User already muted' };
        }
        const parsedDuration = typeof durationMs === 'number' && Number.isFinite(durationMs)
          ? Math.min(Math.max(durationMs, 0), MAX_DURATION_MS)
          : Math.min(helpers.parseDuration(durationText || '', 30), MAX_DURATION_MS);
        const mute = database.addMute(userId, groupId, parsedDuration, validatedReason, actor);
        return { userId, success: true, data: mute };
      } catch (error) {
        logger.error('[ADMIN] Bulk mute failed:', error);
        return { userId, success: false, error: error?.message || 'Failed to mute' };
      }
    };

    const handleKick = async (userId) => {
      if (!groupId) {
        return { userId, success: false, error: 'groupId is required for kick' };
      }
      if (!client || !runtime.getIsReady()) {
        return { userId, success: false, error: 'Bot is not ready' };
      }
      try {
        await client.groupRemove(groupId, [userId]);
        database.addModerationLog('kick', {
          user_id: userId,
          group_id: groupId,
          reason: validatedReason,
          actor,
        });
        return { userId, success: true };
      } catch (error) {
        logger.error('[ADMIN] Bulk kick failed:', error);
        return { userId, success: false, error: error?.message || 'Failed to kick user' };
      }
    };

    const handleClear = async (userId) => {
      try {
        let result;
        if (scope === 'all') {
          result = database.clearAllWarningsForUser(userId);
        } else {
          if (!groupId) {
            return { userId, success: false, error: 'groupId is required for scope=group' };
          }
          result = database.clearUserWarnings(userId, groupId);
        }

        if (!result || result.cleared === 0) {
          return { userId, success: false, error: 'No warnings found' };
        }

        database.addModerationLog('unwarn', {
          user_id: userId,
          group_id: scope === 'all' ? null : groupId,
          reason: reason || 'Warnings cleared by admin',
          actor,
          cleared: result.cleared,
        });

        return { userId, success: true, data: result };
      } catch (error) {
        logger.error('[ADMIN] Bulk clear warnings failed:', error);
        return { userId, success: false, error: error?.message || 'Failed to clear warnings' };
      }
    };

    const handlers = {
      warn: handleWarn,
      mute: handleMute,
      kick: handleKick,
      clear: handleClear,
    };

    const handler = handlers[action];
    if (!handler) {
      return res.status(400).json({ error: 'Unsupported bulk action' });
    }

    for (const userId of userIds) {
      // eslint-disable-next-line no-await-in-loop
      const result = await handler(userId);
      results.push(result);
    }

    return res.json({ success: true, results });
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

  // ========== AUTOMATION ROUTES ==========

  // Scheduled Messages
  router.get('/automation/schedules', requireAuth, (req, res) => {
    const { chatId } = req.query;
    const schedules = chatId 
      ? database.getScheduledMessages(chatId)
      : database.data.scheduledMessages || [];
    res.json({ success: true, schedules });
  });

  router.post('/automation/schedules', requireAuth, (req, res) => {
    const { chatId, message, cronExpression } = req.body;
    if (!chatId || !message || !cronExpression) {
      return res.status(400).json({ error: 'chatId, message, and cronExpression are required' });
    }
    try {
      const schedule = database.addScheduledMessage(chatId, message, cronExpression, 'admin:panel');
      // Start the job if scheduler is available
      try {
        const scheduler = require('../utils/scheduler');
        const client = getClient();
        if (client) scheduler.startJob(schedule, client);
      } catch (e) { /* scheduler not loaded */ }
      res.json({ success: true, schedule });
    } catch (error) {
      logger.error('[ADMIN] Failed to create schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  });

  router.delete('/automation/schedules/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const scheduler = require('../utils/scheduler');
      scheduler.stopJob(id);
    } catch (e) { /* scheduler not loaded */ }
    const deleted = database.deleteScheduledMessage(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });

  // Auto-Reply Rules
  router.get('/automation/autoreplies', requireAuth, (req, res) => {
    const { chatId } = req.query;
    const rules = chatId
      ? database.getAutoReplies(chatId)
      : database.getAllAutoReplies();
    res.json({ success: true, rules });
  });

  router.post('/automation/autoreplies', requireAuth, (req, res) => {
    const { chatId, trigger, response, matchType } = req.body;
    if (!trigger || !response) {
      return res.status(400).json({ error: 'trigger and response are required' });
    }
    try {
      const rule = database.addAutoReply(trigger, response, {
        matchType: matchType || 'contains',
        chatId: chatId || null,
        createdBy: 'admin:panel'
      });
      res.json({ success: true, rule });
    } catch (error) {
      logger.error('[ADMIN] Failed to create auto-reply:', error);
      res.status(500).json({ error: 'Failed to create auto-reply' });
    }
  });

  router.patch('/automation/autoreplies/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const toggled = database.toggleAutoReply(id);
    if (toggled) {
      res.json({ success: true, rule: toggled });
    } else {
      res.status(404).json({ error: 'Auto-reply rule not found' });
    }
  });

  router.delete('/automation/autoreplies/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = database.deleteAutoReply(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Auto-reply rule not found' });
    }
  });

  // AFK Users (read-only from admin)
  router.get('/automation/afk', requireAuth, (req, res) => {
    const afkUsers = database.data.afkUsers || {};
    const list = Object.entries(afkUsers).map(([userId, data]) => ({
      userId,
      ...data,
      duration: Date.now() - data.since
    }));
    res.json({ success: true, afkUsers: list });
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
