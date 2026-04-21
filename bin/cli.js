#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const appPath = path.join(__dirname, '..');
const child = spawn(electron, [appPath], {
  stdio: 'inherit',
  detached: true,
  env: { ...process.env }
});

child.on('error', (err) => {
  console.error('Failed to start Local Port Dashboard:', err.message);
  process.exit(1);
});

child.unref();
// Exit immediately after spawning
process.exit(0);
