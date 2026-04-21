const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let tray = null;
let mainWindow = null;
let serverProcess = null;
const PORT = process.env.PORT || 8765;

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
          mainWindow.setAlwaysOnTop(true);
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
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
    width: 900,
    height: 700,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Local Port Dashboard',
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
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

      // Detect port-in-use errors
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

    // Server startup timeout (5 seconds)
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
  
  mainWindow.show();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
