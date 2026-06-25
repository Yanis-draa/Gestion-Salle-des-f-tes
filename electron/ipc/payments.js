const { getDb } = require('../../database/db');

// Recalcule total_paye de la réservation et met à jour son statut
function recalcReservation(db, reservationId) {
  const totalPaye = db.prepare(
    'SELECT COALESCE(SUM(montant),0) as s FROM payments WHERE reservation_id=?'
  ).get(reservationId).s;
  const res = db.prepare('SELECT prix_total, statut FROM reservations WHERE id=?').get(reservationId);
  if (!res) return;
  let newStatut = res.statut;
  if (res.statut !== 'cancelled' && res.statut !== 'done') {
    newStatut = totalPaye >= res.prix_total ? 'confirmed' : 'pending';
  }
  // ✅ Fix : total_paye au lieu de avance
  db.prepare('UPDATE reservations SET total_paye=?, statut=? WHERE id=?').run(totalPaye, newStatut, reservationId);
}

module.exports = function(ipcMain) {

  // ─── GET ALL ───────────────────────────────────────────────
  ipcMain.handle('payments:getAll', async () => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT p.*,
          c.nom as client_nom,
          r.type_fete, r.date_evenement, r.prix_total,
          COALESCE((SELECT SUM(p2.montant) FROM payments p2 WHERE p2.reservation_id = r.id), 0) as total_paye_res
        FROM payments p
        JOIN reservations r ON r.id = p.reservation_id
        JOIN clients c ON c.id = r.client_id
        ORDER BY p.date_paiement DESC, p.created_at DESC
      `).all();
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET BY RESERVATION ────────────────────────────────────
  ipcMain.handle('payments:getByReservation', async (_, id) => {
    try {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM payments WHERE reservation_id=? ORDER BY date_paiement DESC').all(id);
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── SEARCH ───────────────────────────────────────────────
  ipcMain.handle('payments:search', async (_, q) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT p.*,
          c.nom as client_nom,
          r.type_fete, r.date_evenement, r.prix_total
        FROM payments p
        JOIN reservations r ON r.id = p.reservation_id
        JOIN clients c ON c.id = r.client_id
        WHERE c.nom LIKE ? OR r.type_fete LIKE ? OR p.methode LIKE ?
          OR p.date_paiement LIKE ? OR p.notes LIKE ?
        ORDER BY p.date_paiement DESC
      `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── CREATE ────────────────────────────────────────────────
  ipcMain.handle('payments:create', async (_, data) => {
    try {
      const db = getDb();
      const res = db.prepare('SELECT prix_total FROM reservations WHERE id=?').get(data.reservation_id);
      const totalPaye = db.prepare('SELECT COALESCE(SUM(montant),0) as s FROM payments WHERE reservation_id=?').get(data.reservation_id).s;
      if (res && totalPaye >= res.prix_total) {
        return { success: false, error: 'Cette réservation est déjà soldée — aucun paiement supplémentaire possible.' };
      }
      const r = db.prepare(`
        INSERT INTO payments (reservation_id, montant, methode, type_paiement, reference, notes, date_paiement)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.reservation_id, data.montant, data.methode || 'Espèces',
        'Paiement', data.reference || '',
        data.notes || '', data.date_paiement || new Date().toISOString().slice(0,10)
      );
      recalcReservation(db, data.reservation_id);
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── UPDATE ────────────────────────────────────────────────
  ipcMain.handle('payments:update', async (_, id, data) => {
    try {
      const db = getDb();
      const payment = db.prepare('SELECT reservation_id FROM payments WHERE id=?').get(id);
      if (!payment) return { success: false, error: 'Paiement introuvable' };
      db.prepare(`
        UPDATE payments SET montant=?, methode=?, reference=?, notes=?, date_paiement=?
        WHERE id=?
      `).run(data.montant, data.methode, data.reference || '', data.notes || '', data.date_paiement, id);
      recalcReservation(db, payment.reservation_id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── DELETE ONE ────────────────────────────────────────────
  ipcMain.handle('payments:delete', async (_, id) => {
    try {
      const db = getDb();
      const payment = db.prepare('SELECT reservation_id FROM payments WHERE id=?').get(id);
      if (!payment) return { success: false, error: 'Paiement introuvable' };
      db.prepare('DELETE FROM payments WHERE id=?').run(id);
      recalcReservation(db, payment.reservation_id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── DELETE ALL BY RESERVATION ─────────────────────────────
  ipcMain.handle('payments:deleteByReservation', async (_, reservationId) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM payments WHERE reservation_id=?').run(reservationId);
      db.prepare('UPDATE reservations SET total_paye=0, statut=? WHERE id=?').run('pending', reservationId);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET RECEIPT DATA ──────────────────────────────────────
  ipcMain.handle('payments:getReceiptData', async (_, id) => {
    try {
      const db = getDb();
      const payment = db.prepare(`
        SELECT p.*, c.nom as client_nom, c.telephone as client_tel, c.adresse as client_adresse,
          r.type_fete, r.date_evenement, r.salle, r.nombre_invites, r.prix_total,
          COALESCE((SELECT SUM(p2.montant) FROM payments p2 WHERE p2.reservation_id = r.id), 0) as total_paye,
          r.id as reservation_id
        FROM payments p
        JOIN reservations r ON r.id = p.reservation_id
        JOIN clients c ON c.id = r.client_id
        WHERE p.id=?
      `).get(id);
      const settings = db.prepare('SELECT * FROM settings WHERE id=1').get();
      const allPayments = db.prepare('SELECT * FROM payments WHERE reservation_id=? ORDER BY date_paiement').all(payment.reservation_id);
      return { success: true, data: { payment, settings, allPayments } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── STATS ─────────────────────────────────────────────────
  ipcMain.handle('payments:getStats', async () => {
    try {
      const db = getDb();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const totalGlobal = db.prepare('SELECT COALESCE(SUM(montant),0) as s FROM payments').get().s;
      const totalMois = db.prepare(`
        SELECT COALESCE(SUM(montant),0) as s FROM payments
        WHERE strftime('%m', date_paiement)=? AND strftime('%Y', date_paiement)=?
      `).get(String(currentMonth).padStart(2,'0'), String(currentYear)).s;
      const byMethode = db.prepare('SELECT methode, COUNT(*) as count, SUM(montant) as total FROM payments GROUP BY methode ORDER BY total DESC').all();
      const nbPaiements = db.prepare('SELECT COUNT(DISTINCT reservation_id) as c FROM payments').get().c;
      return { success: true, data: { totalGlobal, totalMois, byMethode, nbPaiements } };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
