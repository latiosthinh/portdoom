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
# No install needed - summon instantly
npx portdoom

# Or install globally (if you dare)
npm install -g portdoom
portdoom
```

---

## ✨ Features

- ⚡ **Lightning fast** - 22ms refresh with intelligent caching
- 🎯 **Smart grouping** - Ports organized by application
- 🧠 **Persistent hiding** - Banish apps forever, saved locally
- 🖥️ **Cross-platform** - Windows, macOS, Linux
- 🎨 **Dark TUI** - Doom-themed terminal interface
- 📦 **Zero dependencies** - Pure Node.js, ~50KB total
- 🔒 **Privacy-first** - All data stays in your realm

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate the abyss |
| `Space` | Execute selected process |
| `h` | Banish this port (session) |
| `H` | Banish entire app (eternal) |
| `s` | Reveal system daemons |
| `r` | Refresh port list |
| `u` | Resurrect all banished |
| `1` - `9` | Quick execute by ID |
| `q` | Escape to reality |

---

## 📸 Screenshots

### Interactive Mode
```
PortDoom 💀
─────────────────────────────────────────────────────────────────

  steam.exe (4 ports)
    ▶ 01  27036  0.0.0.0          8872  active
       02  27060  0.0.0.0          8872  active
       03  65022  0.0.0.0          8872  active
       04  65023  0.0.0.0          8872  active

  Code.exe (1 port)
       05  5500   127.0.0.1       20024  active

─────────────────────────────────────────────────────────────────
  5 ports  2 apps  0 banished

  ↑↓ navigate  space kill  h banish  H eternal-banish  s system  r refresh  u resurrect  1-9 quick-execute  q quit
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
# Find what's haunting port 3000
portdoom | grep 3000

# Execute it (navigate + space, or type "3" + Enter)
```

### Clean Up
```bash
# Banish apps you don't care about (press H)
# They'll stay in the void forever in ~/.portdoom/config.json
```

### Scripting
```bash
# Summon all ports as text
portdoom > report.txt

# Check if a port is possessed
portdoom | grep -q 3000 && echo "Port 3000 is haunted"
```

---

## 🔧 Configuration

PortDoom stores banished apps in your crypt:
- **Windows:** `C:\Users\You\.portdoom\config.json`
- **macOS/Linux:** `~/.portdoom/config.json`

```json
{
  "banishedApps": ["steam.exe", "OneDrive.exe"]
}
```

Edit this ancient tome manually or use `H` in the app to banish, `u` to resurrect all.

---

## 🛠️ Development

```bash
# Summon the source
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

PortDoom invokes native OS incantations - **no dependencies required**:

| Platform | Port Detection | Process Execution |
|----------|---------------|-------------------|
| Windows | `netstat -ano` | `taskkill /PID` |
| macOS | `lsof -i -P -n` | `kill -9` |
| Linux | `ss -tlnp` | `kill -9` |

Process names are cached for 5 seconds for instant refresh.

---

## 📊 Performance

| Action | Time |
|--------|------|
| First summoning | ~1.3s |
| Cached refresh | ~22ms ⚡ |
| Package size | ~50KB |
| Dependencies | 0 (pure darkness) |

---

## 🙋 FAQ

**Q: Why isn't `npx portdoom` showing the latest features?**  
A: Make sure you're using the latest version from npm. For development, use `npm link`.

**Q: Where are banished apps stored?**  
A: `~/.portdoom/config.json` - edit this ancient tome to manage banished apps.

**Q: Can I banish system processes?**  
A: System daemons are hidden by default. Press `s` to reveal them (if you dare).

**Q: Does this work on WSL?**  
A: Yes! PortDoom detects the plane of existence and uses appropriate incantations.

**Q: Is this safe?**  
A: PortDoom only shows and executes processes you have permission to execute. Admin/sudo may be required for system daemons.

**Q: What happens if I execute the wrong process?**  
A: Like any dark art, use with caution. You can restart most processes, but some may be... permanently doomed. 💀

---

## 🤝 Contributing

Contributions welcome! Areas we'd love help:

- 🎨 Custom themes/colors (darker themes preferred)
- 📊 Export to JSON/CSV
- 🔍 Search/filter functionality
- 🧪 Automated tests

```bash
# Join the coven
git clone https://github.com/latiosthinh/portdoom.git
```

---

## 📝 Changelog

### v1.0.0 - The Awakening
- ✨ Initial release
- 🎯 Port grouping by application
- 🧠 Eternal banishment (persistent hiding)
- ⚡ 50x faster refresh with caching
- 🖥️ Cross-platform support
- 💀 Doom-themed UI

---

## 📄 License

MIT © [PortDoom Team](https://github.com/latiosthinh/portdoom)

*Use responsibly. The authors are not responsible for accidentally doomed ports.*

---

<div align="center">

**Forged in darkness 💀 for developers who mean business**

[Report Issue](https://github.com/latiosthinh/portdoom/issues) • [Request Feature](https://github.com/latiosthinh/portdoom/issues) • [Discussions](https://github.com/latiosthinh/portdoom/discussions)

</div>
