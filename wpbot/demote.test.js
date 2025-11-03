
const assert = require('assert');
const demoteCommand = require('./commands/demote');
const helpers = require('./utils/helpers');

// Mock helpers
jest.mock('./utils/helpers', () => ({
  ...jest.requireActual('./utils/helpers'),
  isBotGroupAdmin: jest.fn(),
  isOwner: jest.fn(),
  getMessageActorId: jest.fn(),
}));

describe('demote command', () => {
  let client;
  let message;
  let chat;

  beforeEach(() => {
    client = {
      getContactById: jest.fn().mockResolvedValue({ number: '123', id: { _serialized: '123@c.us' } }),
    };
    chat = {
      isGroup: true,
      promoteParticipants: jest.fn(),
      demoteParticipants: jest.fn(),
    };
    message = {
      getChat: jest.fn().mockResolvedValue(chat),
      reply: jest.fn(),
      hasQuotedMsg: false,
      mentionedIds: [],
    };
  });

  it('should prevent a user from demoting themselves', async () => {
    // Arrange
    const userId = 'user@c.us';
    message.mentionedIds = [userId];
    helpers.isBotGroupAdmin.mockResolvedValue(true);
    helpers.getMessageActorId.mockReturnValue(userId);

    // Act
    await demoteCommand.execute(client, message, []);

    // Assert
    expect(message.reply).toHaveBeenCalledWith('❌ You cannot demote yourself.');
    expect(chat.demoteParticipants).not.toHaveBeenCalled();
  });

  it('should allow an admin to demote another admin', async () => {
    // Arrange
    const adminId = 'admin@c.us';
    const anotherAdminId = 'anotheradmin@c.us';
    const mockedContact = { number: '456', id: { _serialized: anotherAdminId } };

    message.mentionedIds = [anotherAdminId];
    helpers.isBotGroupAdmin.mockResolvedValue(true);
    helpers.getMessageActorId.mockReturnValue(adminId);
    helpers.isOwner.mockReturnValue(false);
    client.getContactById.mockResolvedValue(mockedContact);

    // Act
    await demoteCommand.execute(client, message, []);

    // Assert
    expect(chat.demoteParticipants).toHaveBeenCalledWith([anotherAdminId]);
    expect(message.reply).toHaveBeenCalledWith(
      `✅ @${mockedContact.number} has been demoted to member.`,
      null,
      { mentions: [mockedContact] }
    );
  });
});
