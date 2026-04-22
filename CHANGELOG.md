# Changelog

All notable changes to portdoom will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Custom themes/colors
- Search/filter functionality
- Export to JSON/CSV
- Port protocol detection (TCP/UDP)

## [1.0.0] - 2026-04-22

### Added
- ✨ Initial release
- 🎯 Port grouping by application
- 🧠 Persistent app hiding with `~/.portdoom/config.json`
- ⚡ 50x faster refresh with 5-second process name caching
- 🖥️ Cross-platform support (Windows, macOS, Linux)
- 🎨 Beautiful TUI with color-coded status
- 📦 Zero dependencies - pure Node.js
- 🔧 Non-interactive mode for scripting
- 🎮 Quick kill by ID (1-9)
- 📊 Stats showing ports, apps, and hidden counts

### Technical
- Cross-platform port detection:
  - Windows: `netstat -ano`
  - macOS: `lsof -i -P -n`
  - Linux: `ss -tlnp`
- Process killing:
  - Windows: `taskkill /PID`
  - macOS/Linux: `kill -9`
- Intelligent caching (~22ms refresh after first load)
- GitHub Actions CI/CD for automated testing and publishing

[Unreleased]: https://github.com/latiosthinh/portdoom/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/latiosthinh/portdoom/releases/tag/v1.0.0
