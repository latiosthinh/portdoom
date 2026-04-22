#!/usr/bin/env node

const readline = require('readline');
const os = require('os');
const { getListeningPorts, getProcessName, killProcess, isSystemProcess, platform, clearProcessCache } = require('../lib/port-detector');
const { isAppHidden, hideApp, unhideApp, unhideAllApps, getHiddenApps } = require('../lib/config');

const COLORS = {
  r: '\x1b[0m',
  b: '\x1b[1m',
  d: '\x1b[2m',
  g: '\x1b[38;5;76m',
  G: '\x1b[38;5;118m',
  y: '\x1b[38;5;214m',
  B: '\x1b[38;5;63m',
  c: '\x1b[38;5;51m',
  R: '\x1b[38;5;196m',
  M: '\x1b[38;5;129m',
  m: '\x1b[38;5;177m',
  w: '\x1b[38;5;250m',
  W: '\x1b[38;5;255m',
  k: '\x1b[38;5;238m',
  bgA: '\x1b[48;5;52;1m',
};

function groupByProcess(ports) {
  const groups = {};
  for (const port of ports) {
    const key = port.processName;
    if (!groups[key]) groups[key] = [];
    groups[key].push(port);
  }
  return groups;
}

function render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu) {
  const vis = ports.filter(p => {
    if (showSys || p.isSystem) return false;
    if (hiddenPids.has(p.pid)) return false;
    if (isAppHidden(p.processName)) return false;
    return true;
  });
  const W = process.stdout.columns || 80;
  const groups = groupByProcess(vis);
  const groupKeys = Object.keys(groups);

  let out = '\x1b[H\x1b[2J';

  out += `${COLORS.b}${COLORS.c}portdoom${COLORS.r} ${COLORS.k}(${platform})${COLORS.r} ${COLORS.R}💀${COLORS.r}\n`;
  out += `${COLORS.d}${'─'.repeat(W)}${COLORS.r}\n`;

  if (vis.length === 0) {
    out += `\n  ${COLORS.d}No user ports found${COLORS.r}\n\n`;
  } else {
    out += `\n`;
    let globalIdx = 1;
    
    for (const groupName of groupKeys) {
      const group = groups[groupName];
      const portCount = group.length;
      
      out += `  ${COLORS.b}${COLORS.y}${groupName}${COLORS.r} ${COLORS.d}(${portCount} port${portCount > 1 ? 's' : ''})${COLORS.r}\n`;
      
      for (let i = 0; i < group.length; i++) {
        const p = group[i];
        const isSel = globalIdx - 1 === sel;
        const id = String(globalIdx).padStart(2);
        const port = String(p.port);
        const pid = String(p.pid);
        const processName = p.processName;

        if (isSel) {
          out += `${COLORS.bgA} ${COLORS.r} ${COLORS.b}${COLORS.W} ▶ ${id} ${COLORS.r}  ${COLORS.R}${port.padStart(5)}  ${COLORS.W}${processName.padEnd(28)}  ${COLORS.M}${pid.padStart(6)}  ${COLORS.y}${p.isSystem ? 'daemon' : 'active'}${COLORS.r}\n`;
        } else {
          out += `    ${COLORS.d}${id}  ${COLORS.m}${port.padStart(5)}  ${COLORS.w}${processName.padEnd(28)}  ${COLORS.k}${pid.padStart(6)}  ${p.isSystem ? COLORS.d + 'daemon' + COLORS.r : COLORS.g + 'active' + COLORS.r}\n`;
        }
        globalIdx++;
      }
      out += `\n`;
    }
  }

  out += `${COLORS.d}${'─'.repeat(W)}${COLORS.r}\n`;
  const stats = `  ${COLORS.R}${vis.length}${COLORS.r} ports  ${COLORS.M}${groupKeys.length}${COLORS.r} apps  ${COLORS.k}${hiddenPids.size}${COLORS.r} hidden`;
  out += stats;

  if (msg) {
    out += `     ${msg}`;
  }
  out += '\n';

  const hiddenApps = getHiddenApps();
  
  if (showMenu) {
    out += `\n  ${COLORS.b}${COLORS.y}COMMANDS:${COLORS.r}\n`;
    out += `    ${COLORS.d}t${COLORS.r} or ${COLORS.d}SPACE${COLORS.r} - Terminate selected process\n`;
    out += `    ${COLORS.d}h${COLORS.r} - Hide selected port (session only)\n`;
    out += `    ${COLORS.d}H${COLORS.r} - Hide entire app (PERMANENT - saved to ~/.portdoom/)\n`;
    out += `    ${COLORS.d}s${COLORS.r} - Toggle system processes\n`;
    out += `    ${COLORS.d}r${COLORS.r} - Refresh port list\n`;
    out += `    ${COLORS.d}u${COLORS.r} - Unhide all (clears permanent hides too)\n`;
    out += `    ${COLORS.d}1-9${COLORS.r} - Quick terminate by ID\n`;
    out += `    ${COLORS.d}ESC${COLORS.r} - Close this menu\n`;
    out += `\n  ${COLORS.d}Press command key:${COLORS.r}`;
  } else {
    out += `\n  ${COLORS.d}↑↓${COLORS.r} navigate  ${COLORS.d}SPACE${COLORS.r} terminate  ${COLORS.d}h${COLORS.r} hide  ${COLORS.d}H${COLORS.r} hide-app  ${COLORS.d}s${COLORS.r} system  ${COLORS.d}r${COLORS.r} refresh  ${COLORS.d}u${COLORS.r} unhide  ${COLORS.d}?${COLORS.r} help  ${COLORS.d}q${COLORS.r} quit`;
    if (hiddenApps.length > 0) {
      out += `${COLORS.d}  |  ${COLORS.M}${hiddenApps.length} hidden apps${COLORS.r}`;
    }
  }

  if (cmd !== '') {
    out += `\n\n  ${COLORS.b}›${COLORS.r} ${COLORS.W}${cmd}${COLORS.r}${COLORS.b}█${COLORS.r}`;
  } else {
    out += `\n`;
  }

  out += '\n';

  process.stdout.write(out);
}

async function main() {
  if (!process.stdin.isTTY) {
    const rawPorts = getListeningPorts(false);
    const ports = rawPorts.map(p => {
      const proc = getProcessName(p.pid);
      return { ...p, processName: proc.name, isSystem: p.isSystem || proc.isSystem };
    }).filter(p => !p.isSystem);
    
    if (ports.length === 0) {
      console.log('No user ports found');
    } else {
      const groups = {};
      for (const p of ports) {
        if (!groups[p.processName]) groups[p.processName] = [];
        groups[p.processName].push(p);
      }
      
      console.log('ID   APP                                    PORTS');
      console.log('─'.repeat(60));
      let id = 1;
      for (const [name, group] of Object.entries(groups)) {
        const portList = group.map(p => String(p.port)).join(', ');
        console.log(`${String(id).padStart(2)}   ${name.padEnd(36)}   ${portList}`);
        id++;
      }
    }
    process.exit(0);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  let ports = [];
  let sel = 0;
  let showSys = false;
  let hiddenPids = new Set();
  let msg = '';
  let cmd = '';
  let showMenu = false;

  async function refresh() {
    const rawPorts = getListeningPorts(false);
    ports = rawPorts.map(p => {
      const proc = getProcessName(p.pid);
      return { ...p, processName: proc.name, isSystem: p.isSystem || proc.isSystem };
    });
    const vis = ports.filter(p => {
      if (showSys || p.isSystem) return false;
      if (hiddenPids.has(p.pid)) return false;
      if (isAppHidden(p.processName)) return false;
      return true;
    });
    const maxSel = vis.length - 1;
    if (sel > maxSel) sel = Math.max(0, maxSel);
    render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
    msg = '';
  }

  await refresh();

  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') process.exit(0);
    if (key.name === 'q' && !showMenu) process.exit(0);

    if (key.name === 'escape') {
      showMenu = false;
      cmd = '';
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (showMenu) {
      if (key.name === 't' || key.name === 'space') {
        const vis = ports.filter(p => {
          if (showSys || p.isSystem) return false;
          if (hiddenPids.has(p.pid)) return false;
          if (isAppHidden(p.processName)) return false;
          return true;
        });
        if (vis[sel]) {
          const t = vis[sel];
          const res = killProcess(t.pid);
          if (res.success) {
            msg = `${COLORS.G}✓ Terminated ${t.processName}${COLORS.r}`;
          } else {
            msg = `${COLORS.R}✗ Failed: ${res.error}${COLORS.r}`;
          }
        }
        showMenu = false;
        await refresh();
        return;
      }

      if (key.name === 'h') {
        const vis = ports.filter(p => {
          if (showSys || p.isSystem) return false;
          if (hiddenPids.has(p.pid)) return false;
          if (isAppHidden(p.processName)) return false;
          return true;
        });
        if (vis[sel]) {
          hiddenPids.add(vis[sel].pid);
          msg = `${COLORS.d}Hidden port ${vis[sel].port}${COLORS.r}`;
        }
        showMenu = false;
        await refresh();
        return;
      }

    if (key.name === 'H') {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[sel]) {
        const appName = vis[sel].processName;
        try {
          hideApp(appName);
          msg = `${COLORS.y}💀 Eternally banished ${appName}${COLORS.r}`;
        } catch (e) {
          msg = `${COLORS.R}Failed to banish: ${e.message}${COLORS.r}`;
        }
      }
      showMenu = false;
      await refresh();
      return;
    }

      if (key.name === 's') {
        showSys = !showSys;
        sel = 0;
        msg = showSys ? `${COLORS.y}Showing system processes${COLORS.r}` : `${COLORS.d}Hiding system processes${COLORS.r}`;
        showMenu = false;
        await refresh();
        return;
      }

      if (key.name === 'u') {
        hiddenPids.clear();
        unhideAllApps();
        msg = `${COLORS.G}✓ Unhidden all${COLORS.r}`;
        showMenu = false;
        await refresh();
        return;
      }

      if (key.name === 'r') {
        clearProcessCache();
        await refresh();
        msg = `${COLORS.G}✓ Refreshed${COLORS.r}`;
        showMenu = false;
        render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
        return;
      }

      showMenu = false;
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === '?') {
      showMenu = true;
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === 'r') {
      clearProcessCache();
      await refresh();
      msg = `${COLORS.G}✓ Refreshed${COLORS.r}`;
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === 's') {
      showSys = !showSys;
      sel = 0;
      msg = showSys ? `${COLORS.y}Showing system processes${COLORS.r}` : `${COLORS.d}Hiding system processes${COLORS.r}`;
      await refresh();
      return;
    }

    if (key.name === 'u') {
      hiddenPids.clear();
      unhideAllApps();
      msg = `${COLORS.G}✓ Unhidden all${COLORS.r}`;
      await refresh();
      return;
    }

    if (key.name === 'up') {
      sel = Math.max(0, sel - 1);
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === 'down') {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      sel = Math.min(vis.length - 1, sel + 1);
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === 'space') {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[sel]) {
        const t = vis[sel];
        const res = killProcess(t.pid);
        if (res.success) {
          msg = `${COLORS.G}✓ Terminated ${t.processName}${COLORS.r}`;
        } else {
          msg = `${COLORS.R}✗ Failed: ${res.error}${COLORS.r}`;
        }
        await refresh();
      }
      return;
    }

    if (key.name === 'h') {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[sel]) {
        hiddenPids.add(vis[sel].pid);
        msg = `${COLORS.d}Hidden ${vis[sel].processName}${COLORS.r}`;
        await refresh();
      }
      return;
    }

    if (key.name === 'H') {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[sel]) {
        const appName = vis[sel].processName;
        hideApp(appName);
        msg = `${COLORS.y}Hidden app ${appName}${COLORS.r}`;
        await refresh();
      }
      return;
    }

    if (key.name === 'backspace') {
      cmd = cmd.slice(0, -1);
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }

    if (key.name === 'return' && cmd) {
      const id = parseInt(cmd);
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[id - 1]) {
        const t = vis[id - 1];
        const res = killProcess(t.pid);
        msg = res.success ? `${COLORS.G}✓ Terminated ${t.processName}${COLORS.r}` : `${COLORS.R}✗ Failed: ${res.error}${COLORS.r}`;
      } else {
        msg = `${COLORS.R}✗ Invalid ID${COLORS.r}`;
      }
      cmd = '';
      await refresh();
      return;
    }

    if (/^\d$/.test(str) && key.name !== 'return') {
      cmd += str;
      render(ports, sel, showSys, hiddenPids, msg, cmd, showMenu);
      return;
    }
  });

  rl.on('close', () => process.exit(0));
}

main().catch(err => {
  console.error('PortDoom error:', err.message);
  process.exit(1);
});
