const addCommand = require('./commands/add');
const helpers = require('./utils/helpers');

jest.mock('./utils/helpers', () => ({
  isBotGroupAdmin: jest.fn().mockResolvedValue(true),
}));

describe('add command', () => {
  let client;
  let message;
  let chat;

  beforeEach(() => {
    client = {};
    chat = {
      isGroup: true,
      addParticipants: jest.fn().mockResolvedValue({}),
    };
    message = {
      getChat: jest.fn().mockResolvedValue(chat),
      reply: jest.fn(),
    };
  });

  it('should add a user with a full international number', async () => {
    const args = ['12025550148']; // A US number with country code
    await addCommand.execute(client, message, args);
    expect(chat.addParticipants).toHaveBeenCalledWith(['12025550148@c.us']);
  });

  it('should not add a user with a 10-digit number (without country code)', async () => {
    const args = ['2025550148']; // A US number without country code
    await addCommand.execute(client, message, args);
    expect(chat.addParticipants).toHaveBeenCalledWith(['2025550148@c.us']);
  });
});
