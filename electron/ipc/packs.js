const { getDb } = require('../../database/db');

function initPacksTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS packs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prix REAL DEFAULT 0,
    menu_template_id INTEGER DEFAULT NULL,
    services TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

module.exports = function(ipcMain) {

  ipcMain.handle('packs:getAll', async () => {
    try {
      const db = getDb();
      initPacksTable(db);
      const rows = db.prepare(`
        SELECT p.*, m.nom as catering_nom, m.prix_par_personne as catering_prix_pers,
          m.plats, m.boissons, m.desserts, m.description as catering_description,
          m.type_repas
        FROM packs p
        LEFT JOIN menu_templates m ON m.id = p.menu_template_id
        WHERE p.actif = 1
        ORDER BY p.prix ASC
      `).all();
      return { success: true, data: rows.map(r => ({ ...r, services: JSON.parse(r.services || '[]') })) };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('packs:getById', async (_, id) => {
    try {
      const db = getDb();
      initPacksTable(db);
      const row = db.prepare(`
        SELECT p.*, m.nom as catering_nom, m.prix_par_personne as catering_prix_pers,
          m.plats, m.boissons, m.desserts, m.description as catering_description,
          m.type_repas, m.notes as catering_notes
        FROM packs p
        LEFT JOIN menu_templates m ON m.id = p.menu_template_id
        WHERE p.id = ?
      `).get(id);
      if (!row) return { success: false, error: 'Pack introuvable' };
      return { success: true, data: { ...row, services: JSON.parse(row.services || '[]') } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('packs:create', async (_, data) => {
    try {
      const db = getDb();
      initPacksTable(db);
      const r = db.prepare(`
        INSERT INTO packs (nom, prix, menu_template_id, services, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(data.nom, data.prix || 0, data.menu_template_id || null, JSON.stringify(data.services || []), data.description || '');
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('packs:update', async (_, id, data) => {
    try {
      getDb().prepare(`
        UPDATE packs SET nom=?, prix=?, menu_template_id=?, services=?, description=? WHERE id=?
      `).run(data.nom, data.prix || 0, data.menu_template_id || null, JSON.stringify(data.services || []), data.description || '', id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('packs:delete', async (_, id) => {
    try {
      getDb().prepare('UPDATE packs SET actif=0 WHERE id=?').run(id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
