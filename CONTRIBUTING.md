# Getting Started with portdoom Development

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn

## Installation

```bash
git clone https://github.com/latiosthinh/portdoom.git
cd portdoom
```

## Development

```bash
# Link locally for testing
npm link

# Run the CLI
portdoom

# Or run directly
node bin/cli.js
```

## Testing

```bash
# Run tests
npm test

# Test non-interactive mode
node bin/cli.js > output.txt
cat output.txt
```

## Publishing to npm

### Manual Publish

```bash
# Login to npm (one-time)
npm adduser

# Update version in package.json
npm version patch  # or minor/major

# Publish
npm publish --access public
```

### Automated Publish (CI/CD)

portdoom uses GitHub Actions to automatically publish to npm when you create a release:

1. **Update version:**
   ```bash
   npm version patch  # or minor/major
   git push --follow-tags
   ```

2. **Create a GitHub Release:**
   - Go to https://github.com/latiosthinh/portdoom/releases
   - Click "Create a new release"
   - Choose the tag you just pushed
   - Click "Publish release"

3. **GitHub Actions will:**
   - Run tests on Ubuntu, Windows, and macOS
   - Test on Node.js 18, 20, and 22
   - Automatically publish to npm if all tests pass

### Setup npm Token

To enable automated publishing:

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Create a new token with "Automation" type
3. Copy the token
4. In your GitHub repo, go to Settings → Secrets and variables → Actions
5. Click "New repository secret"
6. Name: `NPM_TOKEN`
7. Value: (paste your npm token)
8. Click "Add secret"

## Project Structure

```
portdoom/
├── bin/
│   └── cli.js          # Main CLI entry point
├── lib/
│   ├── port-detector.js # Cross-platform port detection
│   └── config.js        # Persistent config (hidden apps)
├── .github/
│   └── workflows/
│       ├── ci.yml       # CI testing
│       └── publish-npm.yml # Auto-publish
├── package.json
└── README.md
```

## How It Works

### Port Detection
- **Windows:** `netstat -ano`
- **macOS:** `lsof -i -P -n`
- **Linux:** `ss -tlnp`

### Process Killing
- **Windows:** `taskkill /PID <pid> /F`
- **macOS/Linux:** `kill -9 <pid>`

### Caching
Process names are cached for 5 seconds to make refresh instant (~22ms).

### Configuration
Hidden apps are stored in `~/.portdoom/config.json`.

## Code Style

- No semicolons (optional, but consistent)
- Single quotes for strings
- 2 space indentation
- ES6+ features (const/let, arrow functions, async/await)

## Adding Features

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test on multiple platforms if possible
4. Submit a pull request

## Debugging

```bash
# Enable verbose output (future feature)
DEBUG=portdoom node bin/cli.js

# Test specific function
node -e "const { getListeningPorts } = require('./lib/port-detector'); console.log(getListeningPorts(false));"
```

## Common Issues

### "No user ports found"
- Make sure you have applications running that listen on ports
- Try running a dev server: `python -m http.server 8000`

### Permission errors when killing processes
- Some processes require admin/root privileges
- Run as Administrator (Windows) or with sudo (macOS/Linux)

### Config not saving
- Check that `~/.portdoom/` directory exists and is writable
- On Windows: `C:\Users\YourName\.portdoom\config.json`

## Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG (if exists)
- [ ] Test on Windows, macOS, and Linux
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tags: `git push --tags`
- [ ] Create GitHub Release
- [ ] Verify npm publish succeeded

## Support

- **Issues:** https://github.com/latiosthinh/portdoom/issues
- **Discussions:** https://github.com/latiosthinh/portdoom/discussions
- **npm:** https://www.npmjs.com/package/portdoom
