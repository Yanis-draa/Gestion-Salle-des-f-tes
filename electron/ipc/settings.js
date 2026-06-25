const { getDb } = require('../../database/db');
module.exports = function(ipcMain) {
  ipcMain.handle('settings:get', async () => {
    try { return { success: true, data: getDb().prepare('SELECT * FROM settings WHERE id=1').get() }; }
    catch(e) { return { success: false, error: e.message }; }
  });
  ipcMain.handle('settings:update', async (_, data) => {
    try {
      const db = getDb();
      db.prepare('UPDATE settings SET nom_salle=?,telephone=?,adresse=?,theme=?,accent_color=?,backup_interval=? WHERE id=1').run(data.nom_salle,data.telephone,data.adresse,data.theme,data.accent_color,data.backup_interval);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
