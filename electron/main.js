const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'FESTIVA — Gestion Salle des Fêtes',
    backgroundColor: '#0f1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  require('./ipc/auth')(ipcMain);       
  // require('../database/db')(ipcMain);
  require('./ipc/clients')(ipcMain);
  require('./ipc/reservations')(ipcMain);
  require('./ipc/payments')(ipcMain);
  require('./ipc/employees')(ipcMain);
  require('./ipc/expenses')(ipcMain);
  require('./ipc/finance')(ipcMain);
  require('./ipc/catering')(ipcMain);
  require('./ipc/settings')(ipcMain);
  require('./ipc/pdf')(ipcMain, mainWindow);
  require('./ipc/packs')(ipcMain);
  require('./ipc/backup')(ipcMain, dialog);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
