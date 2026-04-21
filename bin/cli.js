#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const readline = require('readline');

const SYSTEM_PIDS = new Set(['0', '4']);
const SYSTEM_PROCESS_NAMES = [
  'system', 'svchost.exe', 'services.exe', 'csrss.exe', 'smss.exe',
  'wininit.exe', 'winlogon.exe', 'lsass.exe', 'lsm.exe', 'spoolsv.exe',
  'taskhost.exe', 'taskhostw.exe', 'dwm.exe', 'fontdrvhost.exe',
  'runtimebroker.exe', 'sihost.exe', 'shellinfrahost.exe'
];

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

function isSystemProcess(processName) {
  if (!processName) return true;
  const lower = processName.toLowerCase();
  return SYSTEM_PROCESS_NAMES.some(sys => lower.includes(sys));
}

function getListeningPorts() {
  try {
    const output = execSync('netstat -ano | findstr LISTENING', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    const ports = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const localAddress = parts[1];
        const pid = parts[4];
        const [host, port] = localAddress.split(':');
        if (!port) continue;

        ports.push({
          address: host,
          port: parseInt(port),
          pid: parseInt(pid),
          protocol: 'TCP',
          isSystem: SYSTEM_PIDS.has(pid),
        });
      }
    }

    return ports;
  } catch (e) {
    return [];
  }
}

function getProcessName(pid) {
  try {
    const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' });
    const parts = output.trim().split(',');
    if (parts.length >= 1) {
      const name = parts[0].replace(/"/g, '');
      return { name, isSystem: isSystemProcess(name) };
    }
  } catch (e) {}
  return { name: 'Unknown', isSystem: true };
}

function killProcess(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
    return { success: true, message: `Process ${pid} killed` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

async function getPorts() {
  const ports = getListeningPorts();
  const enriched = await Promise.all(
    ports.map(async (port) => {
      const procInfo = getProcessName(port.pid);
      return {
        ...port,
        processName: procInfo.name,
        isSystem: port.isSystem || procInfo.isSystem,
      };
    })
  );
  return enriched;
}

function renderTable(ports, selectedIndex, showSystem, hiddenPids, message) {
  const visiblePorts = ports
    .filter(p => showSystem || !p.isSystem)
    .filter(p => !hiddenPids.has(p.pid))
    .map((p, i) => ({ ...p, id: i + 1 }));

  process.stdout.write('\x1b[H\x1b[2J');

  console.log(`${COLORS.bold}${COLORS.cyan}╔══════════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.bold}${COLORS.green}⚡ LOCAL PORT DASHBOARD${COLORS.reset}                              ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}╠══════════════════════════════════════════════════════════════════╣${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.dim}↑↓ navigate  |  space kill  |  h hide  |  s toggle system${COLORS.reset}  ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.dim}q quit  |  r refresh  |  u unhide all  |  <id> quick kill${COLORS.reset}  ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}╠══════════════════════════════════════════════════════════════════╣${COLORS.reset}`);

  if (visiblePorts.length === 0) {
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}                                                              ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.dim}No active ports found${COLORS.reset}                                     ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}                                                              ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  } else {
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.bold}${COLORS.yellow}ID${COLORS.reset}   ${COLORS.bold}${COLORS.yellow}PORT${COLORS.reset}     ${COLORS.bold}${COLORS.yellow}PROCESS${COLORS.reset}              ${COLORS.bold}${COLORS.yellow}PID${COLORS.reset}     ${COLORS.bold}${COLORS.yellow}STATUS${COLORS.reset}      ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}  ${COLORS.dim}─────────────────────────────────────────────────────────────${COLORS.reset}  ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);

    for (let i = 0; i < visiblePorts.length; i++) {
      const port = visiblePorts[i];
      const isSelected = i === selectedIndex;
      const idStr = String(port.id).padStart(2);
      const portStr = String(port.port).padStart(5);
      const pidStr = String(port.pid).padStart(7);

      let processName = port.processName;
      if (processName.length > 22) processName = processName.substring(0, 20) + '..';
      processName = processName.padEnd(22);

      let status;
      if (port.isSystem) {
        status = `${COLORS.dim}system${COLORS.reset}`;
      } else {
        status = `${COLORS.green}active${COLORS.reset}`;
      }

      const prefix = isSelected ? `${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ▶ ${COLORS.reset}` : '   ';

      const line = `${COLORS.bold}${COLORS.cyan}║${COLORS.reset}${prefix} ${COLORS.bold}${COLORS.cyan}${idStr}${COLORS.reset}   ${COLORS.magenta}${portStr}${COLORS.reset}   ${COLORS.white}${processName}${COLORS.reset}  ${COLORS.dim}${pidStr}${COLORS.reset}   ${status}          ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`;
      console.log(line);
    }
  }

  console.log(`${COLORS.bold}${COLORS.cyan}╠══════════════════════════════════════════════════════════════════╣${COLORS.reset}`);

  const totalPorts = ports.length;
  const visibleCount = visiblePorts.length;
  const hiddenCount = hiddenPids.size;
  const uniqueProcesses = new Set(ports.filter(p => !hiddenPids.has(p.pid)).map(p => p.processName)).size;

  const stats = `  ${COLORS.bold}Total:${COLORS.reset} ${COLORS.cyan}${totalPorts}${COLORS.reset}  ${COLORS.bold}Visible:${COLORS.reset} ${COLORS.green}${visibleCount}${COLORS.reset}  ${COLORS.bold}Processes:${COLORS.reset} ${COLORS.yellow}${uniqueProcesses}${COLORS.reset}  ${COLORS.bold}Hidden:${COLORS.reset} ${COLORS.dim}${hiddenCount}${COLORS.reset}  `;
  const paddedStats = stats.padEnd(62);
  console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}${paddedStats}${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);

  if (message) {
    const msgLine = `  ${message}`.padEnd(62);
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}${COLORS.green}${msgLine}${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  } else {
    console.log(`${COLORS.bold}${COLORS.cyan}║${COLORS.reset}                                                              ${COLORS.bold}${COLORS.cyan}║${COLORS.reset}`);
  }

  console.log(`${COLORS.bold}${COLORS.cyan}╚══════════════════════════════════════════════════════════════════╝${COLORS.reset}`);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  let ports = [];
  let selectedIndex = 0;
  let showSystem = false;
  let hiddenPids = new Set();
  let message = '';
  let inputBuffer = '';
  let lastRefresh = Date.now();

  async function refresh() {
    ports = await getPorts();
    if (selectedIndex >= ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid)).length) {
      selectedIndex = Math.max(0, ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid)).length - 1);
    }
    renderTable(ports, selectedIndex, showSystem, hiddenPids, message);
    message = '';
  }

  await refresh();

  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit(0);
    }

    if (key.name === 'q') {
      process.exit(0);
    }

    if (key.name === 'r') {
      await refresh();
      message = `${COLORS.green}✓ Refreshed${COLORS.reset}`;
      renderTable(ports, selectedIndex, showSystem, hiddenPids, message);
      return;
    }

    if (key.name === 's') {
      showSystem = !showSystem;
      selectedIndex = 0;
      message = showSystem ? `${COLORS.yellow}Showing system processes${COLORS.reset}` : `${COLORS.dim}Hiding system processes${COLORS.reset}`;
      await refresh();
      return;
    }

    if (key.name === 'u') {
      hiddenPids.clear();
      message = `${COLORS.green}✓ All processes unhidden${COLORS.reset}`;
      await refresh();
      return;
    }

    if (key.name === 'up') {
      selectedIndex = Math.max(0, selectedIndex - 1);
      renderTable(ports, selectedIndex, showSystem, hiddenPids, message);
      return;
    }

    if (key.name === 'down') {
      const visiblePorts = ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid));
      selectedIndex = Math.min(visiblePorts.length - 1, selectedIndex + 1);
      renderTable(ports, selectedIndex, showSystem, hiddenPids, message);
      return;
    }

    if (key.name === 'space' || (key.name === 'return' && !inputBuffer)) {
      const visiblePorts = ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid));
      if (visiblePorts[selectedIndex]) {
        const target = visiblePorts[selectedIndex];
        const result = killProcess(target.pid);
        if (result.success) {
          message = `${COLORS.green}✓ Killed ${target.processName} (PID ${target.pid})${COLORS.reset}`;
        } else {
          message = `${COLORS.red}✗ Failed: ${result.error}${COLORS.reset}`;
        }
        await refresh();
      }
      return;
    }

    if (key.name === 'h') {
      const visiblePorts = ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid));
      if (visiblePorts[selectedIndex]) {
        const target = visiblePorts[selectedIndex];
        hiddenPids.add(target.pid);
        message = `${COLORS.dim}Hidden ${target.processName} (PID ${target.pid})${COLORS.reset}`;
        selectedIndex = Math.min(selectedIndex, visiblePorts.length - 2);
        await refresh();
      }
      return;
    }

    if (key.name === 'backspace') {
      inputBuffer = inputBuffer.slice(0, -1);
      renderTable(ports, selectedIndex, showSystem, hiddenPids, `${COLORS.bold}Command:${COLORS.reset} kill ${COLORS.cyan}${inputBuffer}${COLORS.reset}  ${COLORS.dim}(enter to confirm, esc to cancel)${COLORS.reset}`);
      return;
    }

    if (key.name === 'escape') {
      inputBuffer = '';
      renderTable(ports, selectedIndex, showSystem, hiddenPids, message);
      return;
    }

    if (key.name === 'return' && inputBuffer) {
      const id = parseInt(inputBuffer);
      const visiblePorts = ports.filter(p => showSystem || !p.isSystem).filter(p => !hiddenPids.has(p.pid));
      const target = visiblePorts.find(p => p.id === id);
      if (target) {
        const result = killProcess(target.pid);
        if (result.success) {
          message = `${COLORS.green}✓ Killed ${target.processName} (PID ${target.pid})${COLORS.reset}`;
        } else {
          message = `${COLORS.red}✗ Failed: ${result.error}${COLORS.reset}`;
        }
      } else {
        message = `${COLORS.red}✗ Invalid ID: ${inputBuffer}${COLORS.reset}`;
      }
      inputBuffer = '';
      await refresh();
      return;
    }

    if (/^\d$/.test(str) && key.name !== 'return') {
      inputBuffer += str;
      renderTable(ports, selectedIndex, showSystem, hiddenPids, `${COLORS.bold}Command:${COLORS.reset} kill ${COLORS.cyan}${inputBuffer}${COLORS.reset}  ${COLORS.dim}(enter to confirm, esc to cancel)${COLORS.reset}`);
      return;
    }
  });

  rl.on('close', () => process.exit(0));
}

main().catch(console.error);
