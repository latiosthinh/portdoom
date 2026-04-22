#!/usr/bin/env node

const readline = require('readline');
const os = require('os');
const { getListeningPorts, getProcessName, killProcess, isSystemProcess, platform, clearProcessCache } = require('../lib/port-detector');
const { isAppHidden, hideApp, unhideApp, unhideAllApps, getHiddenApps } = require('../lib/config');

const COLORS = {
  r: '\x1b[0m',
  b: '\x1b[1m',
  d: '\x1b[2m',
  g: '\x1b[38;5;152m',
  G: '\x1b[38;5;119m',
  y: '\x1b[38;5;228m',
  B: '\x1b[38;5;117m',
  c: '\x1b[38;5;159m',
  R: '\x1b[38;5;203m',
  m: '\x1b[38;5;183m',
  w: '\x1b[38;5;252m',
  W: '\x1b[38;5;255m',
  k: '\x1b[38;5;240m',
  bgA: '\x1b[48;5;23;1m',
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

function render(ports, sel, showSys, hiddenPids, msg, cmd) {
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

  out += `${COLORS.b}${COLORS.c}portdoom${COLORS.r} ${COLORS.d}v1.0.0${COLORS.r} ${COLORS.k}(${platform})${COLORS.r} ${COLORS.R}💀${COLORS.r}\n`;
  out += `${COLORS.d}${'─'.repeat(W)}${COLORS.r}\n`;

  if (vis.length === 0) {
    out += `\n  ${COLORS.d}No user ports found${COLORS.r}\n\n`;
  } else {
    out += `\n`;
    let globalIdx = 1;
    
    for (const groupName of groupKeys) {
      const group = groups[groupName];
      
      // Group header
      const portCount = group.length;
      
      out += `  ${COLORS.b}${COLORS.y}${groupName}${COLORS.r} ${COLORS.d}(${portCount} port${portCount > 1 ? 's' : ''})${COLORS.r}\n`;
      
      for (let i = 0; i < group.length; i++) {
        const p = group[i];
        const isSel = globalIdx - 1 === sel;
        const id = String(globalIdx).padStart(2);
        const port = String(p.port);
        const pid = String(p.pid);
        const address = p.address;

        if (isSel) {
          out += `${COLORS.bgA} ${COLORS.r} ${COLORS.b}${COLORS.W} ▶ ${id}  ${port.padStart(5)}  ${address.padEnd(15)}  ${pid.padStart(6)}  ${COLORS.g}${p.isSystem ? 'system' : 'active'}${COLORS.r}\n`;
        } else {
          out += `      ${COLORS.d}${id}  ${COLORS.m}${port.padStart(5)}  ${COLORS.k}${address.padEnd(15)}  ${COLORS.d}${pid.padStart(6)}  ${p.isSystem ? COLORS.d + 'system' + COLORS.r : COLORS.g + 'active' + COLORS.r}\n`;
        }
        globalIdx++;
      }
      out += `\n`;
    }
  }

  out += `${COLORS.d}${'─'.repeat(W)}${COLORS.r}\n`;
  const stats = `  ${COLORS.b}${vis.length}${COLORS.r} ports  ${COLORS.b}${groupKeys.length}${COLORS.r} apps  ${COLORS.b}${hiddenPids.size}${COLORS.r} hidden`;
  out += stats;

  if (msg) {
    out += `     ${msg}`;
  }
  out += '\n';

  const hiddenApps = getHiddenApps();
  out += `\n  ${COLORS.d}↑↓${COLORS.r} navigate  ${COLORS.d}space${COLORS.r} kill  ${COLORS.d}h${COLORS.r} hide port  ${COLORS.d}H${COLORS.r} hide app  ${COLORS.d}s${COLORS.r} system  ${COLORS.d}r${COLORS.r} refresh  ${COLORS.d}u${COLORS.r} unhide all  ${COLORS.d}1-9${COLORS.r} quick kill  ${COLORS.d}q${COLORS.r} quit`;
  if (hiddenApps.length > 0) {
    out += `${COLORS.d}  |  ${COLORS.y}${hiddenApps.length} hidden apps${COLORS.r}`;
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
    render(ports, sel, showSys, hiddenPids, msg, cmd);
    msg = '';
  }

  await refresh();

  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') process.exit(0);
    if (key.name === 'q') process.exit(0);

    if (key.name === 'r') {
      clearProcessCache();
      await refresh();
      msg = `${COLORS.G}✓ refreshed${COLORS.r}`;
      render(ports, sel, showSys, hiddenPids, msg, cmd);
      return;
    }

    if (key.name === 's') {
      showSys = !showSys;
      sel = 0;
      msg = showSys ? `${COLORS.y}showing system${COLORS.r}` : `${COLORS.d}hiding system${COLORS.r}`;
      await refresh();
      return;
    }

    if (key.name === 'u') {
      hiddenPids.clear();
      unhideAllApps();
      msg = `${COLORS.G}✓ unhidden all${COLORS.r}`;
      await refresh();
      return;
    }

    if (key.name === 'up') {
      sel = Math.max(0, sel - 1);
      render(ports, sel, showSys, hiddenPids, msg, cmd);
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
      render(ports, sel, showSys, hiddenPids, msg, cmd);
      return;
    }

    if (key.name === 'space' || (key.name === 'return' && cmd === '')) {
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
          msg = `${COLORS.G}✓ killed ${t.processName}${COLORS.r}`;
        } else {
          msg = `${COLORS.R}✗ ${res.error}${COLORS.r}`;
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
        msg = `${COLORS.d}hidden port ${vis[sel].port}${COLORS.r}`;
        await refresh();
      }
      return;
    }

    if (key.name === 'h' && key.shift) {
      const vis = ports.filter(p => {
        if (showSys || p.isSystem) return false;
        if (hiddenPids.has(p.pid)) return false;
        if (isAppHidden(p.processName)) return false;
        return true;
      });
      if (vis[sel]) {
        const appName = vis[sel].processName;
        hideApp(appName);
        msg = `${COLORS.y}hidden app ${appName}${COLORS.r}`;
        await refresh();
      }
      return;
    }

    if (key.name === 'backspace') {
      cmd = cmd.slice(0, -1);
      render(ports, sel, showSys, hiddenPids, msg, cmd);
      return;
    }

    if (key.name === 'escape') {
      cmd = '';
      render(ports, sel, showSys, hiddenPids, msg, cmd);
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
        msg = res.success ? `${COLORS.G}✓ killed ${t.processName}${COLORS.r}` : `${COLORS.R}✗ ${res.error}${COLORS.r}`;
      } else {
        msg = `${COLORS.R}✗ invalid id${COLORS.r}`;
      }
      cmd = '';
      await refresh();
      return;
    }

    if (/^\d$/.test(str) && key.name !== 'return') {
      cmd += str;
      render(ports, sel, showSys, hiddenPids, msg, cmd);
      return;
    }
  });

  rl.on('close', () => process.exit(0));
}

main().catch(err => {
  console.error('PortMan error:', err.message);
  process.exit(1);
});
