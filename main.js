require('dotenv').config();
const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let tray = null;
let mainWindow = null;
let serverProcess = null;
let widgetProcess = null;
const PORT = process.env.PORT || 8765;

const WIDGET_SIZE = { width: 380, height: 280 };
const DASHBOARD_SIZE = { width: 900, height: 700 };
const CORNER_OFFSET = 12;

function getCornerPosition(corner) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: workAreaX, y: workAreaY } = primaryDisplay.workArea;

  switch (corner) {
    case 'top-left':
      return { x: workAreaX + CORNER_OFFSET, y: workAreaY + CORNER_OFFSET };
    case 'top-right':
      return { x: workAreaX + screenWidth - WIDGET_SIZE.width - CORNER_OFFSET, y: workAreaY + CORNER_OFFSET };
    case 'bottom-left':
      return { x: workAreaX + CORNER_OFFSET, y: workAreaY + screenHeight - WIDGET_SIZE.height - CORNER_OFFSET };
    case 'bottom-right':
    default:
      return { x: workAreaX + screenWidth - WIDGET_SIZE.width - CORNER_OFFSET, y: workAreaY + screenHeight - WIDGET_SIZE.height - CORNER_OFFSET };
  }
}

function getCenterPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: workAreaX, y: workAreaY } = primaryDisplay.workArea;
  return {
    x: workAreaX + Math.floor(screenWidth / 2 - DASHBOARD_SIZE.width / 2),
    y: workAreaY + Math.floor(screenHeight / 2 - DASHBOARD_SIZE.height / 2),
  };
}

function findBrowser() {
  const candidates = [
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return 'msedge.exe';
}

function launchWidget() {
  if (widgetProcess) {
    widgetProcess.kill();
  }

  const browser = findBrowser();
  const widgetUrl = `http://localhost:${PORT}/widget.html`;
  const pos = getCornerPosition('bottom-right');

  widgetProcess = spawn(browser, [
    `--app=${widgetUrl}`,
    `--window-size=${WIDGET_SIZE.width},${WIDGET_SIZE.height}`,
    `--window-position=${pos.x},${pos.y}`,
    '--frame=0',
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  widgetProcess.unref();
}

function closeWidget() {
  if (widgetProcess) {
    try {
      widgetProcess.kill();
    } catch (e) {}
    widgetProcess = null;
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Launch Widget',
      click: () => {
        launchWidget();
      }
    },
    {
      label: 'Close Widget',
      click: () => {
        closeWidget();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        closeWidget();
        if (serverProcess) {
          serverProcess.kill();
        }
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Local Port Dashboard');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
      } else {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true);
        mainWindow.focus();
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DASHBOARD_SIZE.width,
    height: DASHBOARD_SIZE.height,
    show: false,
    alwaysOnTop: true,
    frame: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Local Port Dashboard',
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.setMinimumSize(600, 400);
  const pos = getCenterPosition();
  mainWindow.setPosition(pos.x, pos.y);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.show();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, PORT },
    });

    let serverReady = false;
    let portInUseDetected = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running')) {
        serverReady = true;
        setTimeout(resolve, 500);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errOutput = data.toString();
      console.error('Server error:', errOutput);

      if (!portInUseDetected && (
        errOutput.includes('EADDRINUSE') ||
        errOutput.includes('listen EADDRINUSE') ||
        errOutput.includes('address already in use')
      )) {
        portInUseDetected = true;
        dialog.showErrorBox(
          'Port Already in Use',
          `Port ${PORT} is already in use. Please close the other application or set a different PORT environment variable.`
        );
        app.quit();
        reject(new Error(`Port ${PORT} is already in use`));
      }
    });

    serverProcess.on('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.message.includes('address already in use')) {
        dialog.showErrorBox(
          'Port Already in Use',
          `Port ${PORT} is already in use. Please close the other application or set a different PORT environment variable.`
        );
        app.quit();
      }
      reject(err);
    });

    setTimeout(() => {
      if (!serverReady && !portInUseDetected) {
        dialog.showErrorBox(
          'Server Startup Timeout',
          `The dashboard server failed to start within 5 seconds. Please check the application logs for details.`
        );
        app.quit();
        reject(new Error('Server startup timeout'));
      }
    }, 5000);

    setTimeout(() => resolve(), 2000);
  });
}

app.whenReady().then(async () => {
  createTray();
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('before-quit', () => {
  closeWidget();
  if (serverProcess) {
    serverProcess.kill();
  }
});

ipcMain.on('launch-widget', () => {
  launchWidget();
});
