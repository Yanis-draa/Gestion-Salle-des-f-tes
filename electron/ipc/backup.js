const path = require('path');
const fs = require('fs');
const { app } = require('electron');

module.exports = function(ipcMain, dialog) {
  const DB_PATH = path.join(app.getPath('userData'), 'festiva.db');

  ipcMain.handle('backup:export', async () => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter la sauvegarde',
        defaultPath: `festiva_backup_${new Date().toISOString().slice(0,10)}.db`,
        filters: [{ name: 'Base de données', extensions: ['db'] }],
      });
      if (!filePath) return { success: false, error: 'Annulé' };
      fs.copyFileSync(DB_PATH, filePath);
      return { success: true, path: filePath };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('backup:import', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Restaurer une sauvegarde',
        filters: [{ name: 'Base de données', extensions: ['db'] }],
        properties: ['openFile'],
      });
      if (!filePaths || !filePaths[0]) return { success: false, error: 'Annulé' };
      // Backup current before overwrite
      const backupPath = DB_PATH + '.bak';
      if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, backupPath);
      fs.copyFileSync(filePaths[0], DB_PATH);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
