# 🤝 Contributing Guide

Thank you for considering contributing to the WhatsApp Bot project! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Adding New Commands](#adding-new-commands)
- [Testing](#testing)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Error messages and logs**
- **Screenshots** (if applicable)

**Example Bug Report:**
```markdown
**Title:** Bot crashes when processing large images

**Description:**
The bot crashes with an out-of-memory error when trying to convert 
large images (>10MB) to stickers.

**Steps to Reproduce:**
1. Send an image larger than 10MB
2. Reply with /sticker
3. Bot crashes

**Expected:** Bot should handle or reject large images gracefully
**Actual:** Bot crashes with OOM error

**Environment:**
- OS: Ubuntu 20.04
- Node.js: v18.17.0
- Bot Version: 1.0.0

**Error Log:**
```
[Error log here]
```
```

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use case** - why is it useful?
- **Examples** of how it would work
- **Alternatives** you've considered

### Improving Documentation

Documentation improvements are always appreciated:

- Fix typos and grammar
- Add examples
- Clarify confusing sections
- Add missing information
- Improve formatting

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/whatsapp-bot.git
cd whatsapp-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your test configuration
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 5. Make Changes

Edit the code, add features, fix bugs, etc.

### 6. Test Your Changes

```bash
npm start
# Test thoroughly in WhatsApp
```

## 📝 Coding Standards

### JavaScript Style

- Use **ES6+** features
- Use **async/await** for asynchronous code
- Use **const** and **let**, avoid **var**
- Use **template literals** for strings
- Add **comments** for complex logic

### Code Structure

```javascript
// Good
const helpers = require('../utils/helpers');

async function processMessage(message) {
    try {
        const contact = await message.getContact();
        // Process message
    } catch (error) {
        logger.error('Error processing message:', error);
    }
}

// Bad
var helpers = require('../utils/helpers')

function processMessage(message) {
    message.getContact().then(contact => {
        // Process message
    }).catch(err => {
        console.log(err)
    })
}
```

### Error Handling

Always use try-catch blocks:

```javascript
async execute(client, message, args) {
    try {
        // Command logic
    } catch (error) {
        console.error('Error in command:', error);
        await message.reply('❌ An error occurred.');
    }
}
```

### Naming Conventions

- **Files:** lowercase with hyphens (e.g., `message-handler.js`)
- **Functions:** camelCase (e.g., `getUserInfo`)
- **Classes:** PascalCase (e.g., `MessageHandler`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Variables:** camelCase (e.g., `userName`)

### Comments

Add comments for:
- Complex logic
- Non-obvious code
- Function purposes
- Important notes

```javascript
/**
 * Process incoming message and execute commands
 * @param {Client} client - WhatsApp client
 * @param {Message} message - Incoming message
 */
async function handleMessage(client, message) {
    // Check if message is from status broadcast
    if (message.from === 'status@broadcast') return;
    
    // Process command if message starts with prefix
    if (message.body.startsWith(config.prefix)) {
        await executeCommand(client, message);
    }
}
```

## 🚀 Submitting Changes

### 1. Commit Your Changes

Write clear commit messages:

```bash
# Good commit messages
git commit -m "Add user profile command"
git commit -m "Fix crash when downloading large files"
git commit -m "Update README with deployment instructions"

# Bad commit messages
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Fill in the PR template

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
How did you test this?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tested thoroughly
```

## 🎨 Adding New Commands

### Step 1: Create Command File

Create a new file in `commands/` directory:

```bash
touch commands/mycommand.js
```

### Step 2: Use Template

Copy from `commands/_template.js` or use this structure:

```javascript
module.exports = {
    name: 'mycommand',
    aliases: ['mc'],
    description: 'What this command does',
    usage: '/mycommand <args>',
    cooldown: 5000,
    category: 'basic',
    
    async execute(client, message, args) {
        try {
            // Your logic here
            await message.reply('Command executed!');
        } catch (error) {
            console.error('Error:', error);
            await message.reply('❌ An error occurred.');
        }
    }
};
```

### Step 3: Test Command

```bash
npm start
# Test in WhatsApp: /mycommand
```

### Step 4: Document Command

Add to `COMMANDS.md`:

```markdown
### /mycommand
Description of what the command does.

**Aliases:** `mc`  
**Usage:**
\`\`\`
/mycommand <args>
\`\`\`

**Example:**
\`\`\`
/mycommand test
\`\`\`
```

## 🧪 Testing

### Manual Testing Checklist

Before submitting:

- [ ] Command works in private chat
- [ ] Command works in group (if applicable)
- [ ] Error handling works
- [ ] Permissions work correctly
- [ ] Cooldown works
- [ ] Help text is correct
- [ ] No console errors
- [ ] Database operations work (if applicable)

### Test Cases

Example test scenarios:

```javascript
// Test 1: Basic functionality
/mycommand test
Expected: Command executes successfully

// Test 2: No arguments
/mycommand
Expected: Shows usage message

// Test 3: Invalid arguments
/mycommand invalid
Expected: Shows error message

// Test 4: Permission check
[Non-admin uses admin command]
Expected: Permission denied message

// Test 5: Cooldown
/mycommand
/mycommand (immediately after)
Expected: Cooldown message
```

## 📚 Documentation

When adding features, update:

- **README.md** - Main documentation
- **COMMANDS.md** - Command reference
- **SETUP_GUIDE.md** - Setup instructions (if needed)
- **Code comments** - Inline documentation

## 🐛 Debugging Tips

### Enable Debug Logging

```javascript
// In your code
const logger = require('./utils/logger');
logger.debug('Debug information:', data);
```

### Check Logs

```bash
# View latest log
tail -f logs/bot-$(date +%Y-%m-%d).log

# Search for errors
grep ERROR logs/*.log
```

### Common Issues

**Issue:** Command not loading
- Check file name and location
- Verify module.exports syntax
- Check for syntax errors

**Issue:** Permission errors
- Verify permission checks
- Test with different user types

**Issue:** Database errors
- Check database connection
- Verify SQL syntax
- Check table structure

## 🎯 Best Practices

### 1. Keep It Simple
- Write clear, readable code
- Avoid over-engineering
- One function, one purpose

### 2. Handle Errors Gracefully
- Always use try-catch
- Provide helpful error messages
- Log errors for debugging

### 3. Validate Input
- Check arguments
- Validate user permissions
- Sanitize user input

### 4. Be Consistent
- Follow existing patterns
- Use similar naming
- Match code style

### 5. Document Everything
- Add comments
- Update documentation
- Include examples

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

## 📞 Getting Help

Need help contributing?

- Check existing documentation
- Look at similar code
- Ask in issues/discussions
- Review closed PRs for examples

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🎉**

Your contributions help make this project better for everyone.
