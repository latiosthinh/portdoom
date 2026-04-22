# PortDoom 💀

> **Kill ports, not vibes.** Doom your ports to oblivion.

[![npm](https://img.shields.io/npm/v/portdoom.svg)](https://www.npmjs.com/package/portdoom)
[![npm](https://img.shields.io/npm/dt/portdoom.svg)](https://www.npmjs.com/package/portdoom)
[![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://www.npmjs.com/package/portdoom)
[![license](https://img.shields.io/npm/l/portdoom.svg)](https://www.npmjs.com/package/portdoom)
[![size](https://img.shields.io/bundlephobia/min/portdoom)](https://www.npmjs.com/package/portdoom)

---

## 🚀 Quick Start

```bash
# No install needed - run instantly
npx portdoom

# Or install globally
npm install -g portdoom
portdoom
```

---

## ✨ Features

- ⚡ **Lightning fast** - 22ms refresh with intelligent caching
- 🎯 **Smart grouping** - Ports organized by application
- 🧠 **Persistent hiding** - Hide apps forever, saved locally
- 🖥️ **Cross-platform** - Windows, macOS, Linux
- 🎨 **Beautiful TUI** - Dark, doom-themed terminal interface
- 📦 **Zero dependencies** - Pure Node.js, ~50KB total
- 🔒 **Privacy-first** - All data stays on your machine

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate ports |
| `Space` | Kill selected process |
| `h` | Hide this port (session) |
| `H` | Hide entire app (permanent) |
| `s` | Toggle system processes |
| `r` | Refresh port list |
| `u` | Unhide everything |
| `1` - `9` | Quick kill by ID |
| `q` | Quit |

---

## 📸 Screenshots

### Interactive Mode
```
portdoom v1.0.0 (win32) 💀
─────────────────────────────────────────────────────────────────

  steam.exe (4 ports)
    ▶ 01  27036  0.0.0.0          8872  active
       02  27060  0.0.0.0          8872  active
       03  65022  0.0.0.0          8872  active
       04  65023  0.0.0.0          8872  active

  Code.exe (1 port)
       05  5500   127.0.0.1       20024  active

─────────────────────────────────────────────────────────────────
  5 ports  2 apps  0 hidden

  ↑↓ navigate  space kill  h hide port  H hide app  s system  r refresh  u unhide all  1-9 quick kill  q quit
```

### Non-Interactive (Piped Output)
```bash
$ portdoom > ports.txt
```

```
ID   APP                                    PORTS
────────────────────────────────────────────────────────────
 01   Code.exe                               5500
 02   steam.exe                              27036, 27060, 65022, 65023
 03   PanGPS.exe                             4767
 04   ArmouryCrateControlInterface.exe       7778, 50923
 05   AsusSoftwareManager.exe                24830
```

---

## 🎯 Use Cases

### Development
```bash
# Find what's using port 3000
portdoom | grep 3000

# Kill it fast (navigate + space, or type "3" + Enter)
```

### Clean Up
```bash
# Hide apps you don't care about (press H)
# They'll stay hidden forever in ~/.portdoom/config.json
```

### Scripting
```bash
# Get all ports as text
portdoom > report.txt

# Check if a port is in use
portdoom | grep -q 3000 && echo "Port 3000 is busy"
```

---

## 🔧 Configuration

PortDoom stores hidden apps in:
- **Windows:** `C:\Users\You\.portdoom\config.json`
- **macOS/Linux:** `~/.portdoom/config.json`

```json
{
  "hiddenApps": ["steam.exe", "OneDrive.exe"]
}
```

Edit this file manually or use `H` in the app to hide, `u` to unhide all.

---

## 🛠️ Development

```bash
# Clone and install (zero dependencies!)
git clone https://github.com/latiosthinh/portdoom.git
cd portdoom

# Run directly
node bin/cli.js

# Link globally for testing
npm link
portdoom

# Test non-interactive mode
node bin/cli.js > output.txt
```

---

## 🏗️ How It Works

PortDoom uses native OS commands - **no dependencies required**:

| Platform | Port Detection | Process Kill |
|----------|---------------|--------------|
| Windows | `netstat -ano` | `taskkill /PID` |
| macOS | `lsof -i -P -n` | `kill -9` |
| Linux | `ss -tlnp` | `kill -9` |

Process names are cached for 5 seconds for instant refresh.

---

## 📊 Performance

| Action | Time |
|--------|------|
| First run | ~1.3s |
| Cached refresh | ~22ms ⚡ |
| Package size | ~50KB |
| Dependencies | 0 |

---

## 🙋 FAQ

**Q: Why isn't `npx portdoom` showing the latest features?**  
A: Make sure you're using the latest version from npm. For development, use `npm link`.

**Q: Where are hidden apps stored?**  
A: `~/.portdoom/config.json` - edit this file to manage hidden apps.

**Q: Can I hide system processes?**  
A: System processes are hidden by default. Press `s` to show them.

**Q: Does this work on WSL?**  
A: Yes! PortDoom detects the platform and uses appropriate commands.

**Q: Is this safe?**  
A: PortDoom only shows and kills processes you have permission to kill. Admin/sudo may be required for system processes.

---

## 🤝 Contributing

Contributions welcome! Areas we'd love help:

- 🎨 Custom themes/colors
- 📊 Export to JSON/CSV
- 🔍 Search/filter functionality
- 🧪 Automated tests

```bash
# Fork, clone, and submit a PR
git clone https://github.com/latiosthinh/portdoom.git
```

---

## 📝 Changelog

### v1.0.0
- ✨ Initial release
- 🎯 Port grouping by application
- 🧠 Persistent app hiding
- ⚡ 50x faster refresh with caching
- 🖥️ Cross-platform support

---

## 📄 License

MIT © [PortDoom Team](https://github.com/latiosthinh/portdoom)

---

<div align="center">

**Made with 💀 for developers who mean business**

[Report Issue](https://github.com/latiosthinh/portdoom/issues) • [Request Feature](https://github.com/latiosthinh/portdoom/issues) • [Discussions](https://github.com/latiosthinh/portdoom/discussions)

</div>
