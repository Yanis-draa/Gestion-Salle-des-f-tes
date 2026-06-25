const { getDb } = require('../../database/db');
module.exports = function(ipcMain) {
  ipcMain.handle('expenses:getGeneral', async (_, month, year) => {
    try {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM monthly_expenses WHERE mois=? AND annee=? ORDER BY date_depense DESC').all(month, year);
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('expenses:getByReservation', async (_, id) => {
    try {
      const db = getDb();
      return { success: true, data: db.prepare('SELECT * FROM reservation_expenses WHERE reservation_id=?').all(id) };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('expenses:createGeneral', async (_, data) => {
    try {
      const db = getDb();
      const date = data.date_depense || new Date().toISOString().slice(0,10);
      const mois = data.mois || parseInt(date.split('-')[1]);
      const annee = data.annee || parseInt(date.split('-')[0]);
      const r = db.prepare('INSERT INTO monthly_expenses (categorie,description,montant,mois,annee,date_depense) VALUES(?,?,?,?,?,?)').run(data.categorie,data.description,data.montant,mois,annee,date);
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('expenses:createForReservation', async (_, data) => {
    try {
      const db = getDb();
      const r = db.prepare('INSERT INTO reservation_expenses (reservation_id,categorie,description,montant,date_depense) VALUES(?,?,?,?,?)').run(data.reservation_id,data.categorie,data.description,data.montant,data.date_depense||new Date().toISOString().slice(0,10));
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('expenses:update', async (_, id, data) => {
    try {
      getDb().prepare('UPDATE monthly_expenses SET categorie=?,description=?,montant=?,date_depense=? WHERE id=?').run(data.categorie,data.description,data.montant,data.date_depense,id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('expenses:delete', async (_, id) => {
    try { getDb().prepare('DELETE FROM monthly_expenses WHERE id=?').run(id); return { success: true }; }
    catch(e) { return { success: false, error: e.message }; }
  });

  // ✅ NOUVEAU : supprimer toutes les dépenses d'un mois/année
  ipcMain.handle('expenses:deleteAll', async (_, month, year) => {
    try {
      getDb().prepare('DELETE FROM monthly_expenses WHERE mois=? AND annee=?').run(month, year);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
