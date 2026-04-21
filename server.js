const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8765;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// System PIDs and known system process names to filter
const SYSTEM_PIDS = new Set(['0', '4']);
const SYSTEM_PROCESS_NAMES = [
  'system', 'svchost.exe', 'services.exe', 'csrss.exe', 'smss.exe',
  'wininit.exe', 'winlogon.exe', 'lsass.exe', 'lsm.exe', 'spoolsv.exe',
  'taskhost.exe', 'taskhostw.exe', 'dwm.exe', 'fontdrvhost.exe',
  'runtimebroker.exe', 'sihost.exe', 'shellinfrahost.exe'
];

function isSystemProcess(processName) {
  if (!processName) return true;
  const lower = processName.toLowerCase();
  return SYSTEM_PROCESS_NAMES.some(sys => lower.includes(sys));
}

function getListeningPorts() {
  return new Promise((resolve, reject) => {
    exec('netstat -ano | findstr LISTENING', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      const lines = stdout.trim().split('\n');
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
            isSystem: SYSTEM_PIDS.has(pid)
          });
        }
      }

      resolve(ports);
    });
  });
}

function getProcessName(pid) {
  return new Promise((resolve, reject) => {
    exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ name: 'Unknown', isSystem: true });
        return;
      }

      const parts = stdout.trim().split(',');
      if (parts.length >= 1) {
        const name = parts[0].replace(/"/g, '');
        resolve({ name, isSystem: isSystemProcess(name) });
      } else {
        resolve({ name: 'Unknown', isSystem: true });
      }
    });
  });
}

app.get('/api/ports', async (req, res) => {
  try {
    const { showSystem } = req.query;
    const ports = await getListeningPorts();

    const enriched = await Promise.all(
      ports.map(async (port) => {
        const procInfo = await getProcessName(port.pid);
        return {
          ...port,
          processName: procInfo.name,
          isSystem: port.isSystem || procInfo.isSystem
        };
      })
    );

    const filtered = showSystem === 'true'
      ? enriched
      : enriched.filter(p => !p.isSystem);

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/kill/:pid', (req, res) => {
  const { pid } = req.params;

  exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: stderr || error.message });
      return;
    }
    res.json({ success: true, message: `Process ${pid} killed` });
  });
});

app.listen(PORT, () => {
  console.log(`Local Port Dashboard running at http://localhost:${PORT}`);
});

module.exports = { PORT };
