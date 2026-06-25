const { getDb } = require('../../database/db');

module.exports = function(ipcMain) {
  ipcMain.handle('clients:getAll', async () => {
    try {
      const db = getDb();
      const clients = db.prepare(`
        SELECT c.*, 
          COUNT(r.id) as nb_reservations,
          COALESCE(SUM(p.montant), 0) as total_paye
        FROM clients c
        LEFT JOIN reservations r ON r.client_id = c.id
        LEFT JOIN payments p ON p.reservation_id = r.id
        GROUP BY c.id
        ORDER BY c.nom
      `).all();
      return { success: true, data: clients };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:getById', async (_, id) => {
    try {
      const db = getDb();
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
      const reservations = db.prepare(`
        SELECT r.*, COALESCE(SUM(p.montant),0) as total_paye
        FROM reservations r
        LEFT JOIN payments p ON p.reservation_id = r.id
        WHERE r.client_id = ?
        GROUP BY r.id
        ORDER BY r.date_evenement DESC
      `).all(id);
      return { success: true, data: { ...client, reservations } };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:create', async (_, data) => {
    try {
      const db = getDb();
      const r = db.prepare('INSERT INTO clients (nom, telephone, adresse, notes) VALUES (?, ?, ?, ?)').run(data.nom, data.telephone, data.adresse, data.notes);
      return { success: true, id: r.lastInsertRowid };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:update', async (_, id, data) => {
    try {
      const db = getDb();
      db.prepare('UPDATE clients SET nom=?, telephone=?, adresse=?, notes=? WHERE id=?').run(data.nom, data.telephone, data.adresse, data.notes, id);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

 ipcMain.handle('clients:delete', async (_, id) => {
  try {
    const db = getDb();

    // Récupérer les IDs des réservations de ce client
    const reservations = db.prepare('SELECT id FROM reservations WHERE client_id = ?').all(id);
    const resIds = reservations.map(r => r.id);

    if (resIds.length > 0) {
      const placeholders = resIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM payments WHERE reservation_id IN (${placeholders})`).run(...resIds);
      db.prepare(`DELETE FROM reservation_expenses WHERE reservation_id IN (${placeholders})`).run(...resIds);
      db.prepare(`DELETE FROM reservation_employees WHERE reservation_id IN (${placeholders})`).run(...resIds);
      db.prepare(`DELETE FROM catering WHERE reservation_id IN (${placeholders})`).run(...resIds);
    }

    db.prepare('DELETE FROM reservations WHERE client_id = ?').run(id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);

    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

  // ✅ NOUVEAU : Supprimer TOUS les clients (et leurs données liées)
  ipcMain.handle('clients:deleteAll', async () => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM reservation_expenses').run();
      db.prepare('DELETE FROM reservation_employees').run();
      db.prepare('DELETE FROM catering').run();
      db.prepare('DELETE FROM reservations').run();
      db.prepare('DELETE FROM clients').run();
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:search', async (_, q) => {
    try {
      const db = getDb();
      const clients = db.prepare(`
        SELECT c.*, COUNT(r.id) as nb_reservations
        FROM clients c
        LEFT JOIN reservations r ON r.client_id = c.id
        WHERE c.nom LIKE ? OR c.telephone LIKE ?
        GROUP BY c.id
        ORDER BY c.nom
      `).all(`%${q}%`, `%${q}%`);
      return { success: true, data: clients };
    } catch (e) { return { success: false, error: e.message }; }
  });
};
