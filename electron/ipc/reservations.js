const { getDb } = require('../../database/db');

module.exports = function(ipcMain) {
  ipcMain.handle('reservations:getAll', async () => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT r.*, c.nom as client_nom, c.telephone as client_tel,
        (SELECT COALESCE(SUM(p.montant), 0) FROM payments p WHERE p.reservation_id = r.id) as total_paye,
        (SELECT COUNT(DISTINCT re.employee_id) FROM reservation_employees re WHERE re.reservation_id = r.id) as nb_employees
      FROM reservations r
      JOIN clients c ON c.id = r.client_id
      ORDER BY r.date_evenement DESC
    `).all();
    return { success: true, data: rows };
  } catch (e) { return { success: false, error: e.message }; }
});

  ipcMain.handle('reservations:getById', async (_, id) => {
    try {
      const db = getDb();
      const r = db.prepare(`
        SELECT r.*, c.nom as client_nom, c.telephone as client_tel, c.adresse as client_adresse
        FROM reservations r JOIN clients c ON c.id = r.client_id WHERE r.id = ?
      `).get(id);
      const payments = db.prepare('SELECT * FROM payments WHERE reservation_id = ? ORDER BY date_paiement DESC').all(id);
      const expenses = db.prepare('SELECT * FROM reservation_expenses WHERE reservation_id = ? ORDER BY created_at DESC').all(id);
      const employees = db.prepare(`
        SELECT e.*, re.cout, re.role
        FROM employees e
        JOIN reservation_employees re ON re.employee_id = e.id
        WHERE re.reservation_id = ?
        ORDER BY e.poste, e.nom
      `).all(id);
      const catering = db.prepare('SELECT * FROM catering WHERE reservation_id = ?').get(id);
      return { success: true, data: { ...r, payments, expenses, employees, catering } };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:getByDate', async (_, date) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT r.*, c.nom as client_nom FROM reservations r
        JOIN clients c ON c.id = r.client_id
        WHERE r.date_evenement = ? AND r.statut != 'cancelled'
      `).all(date);
      return { success: true, data: rows };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:checkConflict', async (_, date) => {
    try {
      const db = getDb();
      const conflict = db.prepare(`
         SELECT id FROM reservations WHERE date_evenement = ? AND statut != 'cancelled'
      `).get(date);
      return { success: true, conflict: !!conflict };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:create', async (_, data) => {
    try {
      const db = getDb();
      const r = db.prepare(`
        INSERT INTO reservations (client_id, type_fete, salle, date_evenement, periode, heure_debut, heure_fin, nombre_invites, prix_total, avance, statut, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.client_id, data.type_fete, data.salle, data.date_evenement, data.periode || 'Soir', data.heure_debut, data.heure_fin, data.nombre_invites, data.prix_total, data.avance || 0, data.statut || 'pending', data.notes);
      if (parseFloat(data.avance) > 0) {
        db.prepare('INSERT INTO payments (reservation_id, montant, methode, type_paiement, date_paiement) VALUES (?, ?, ?, ?, ?)').run(r.lastInsertRowid, data.avance, 'Espèces', 'Avance', new Date().toISOString().slice(0,10));
      }
      return { success: true, id: r.lastInsertRowid };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:update', async (_, id, data) => {
    try {
      const db = getDb();
      db.prepare(`
        UPDATE reservations SET client_id=?, type_fete=?, salle=?, date_evenement=?, periode=?, heure_debut=?, heure_fin=?, nombre_invites=?, prix_total=?, avance=?, statut=?, notes=? WHERE id=?
      `).run(data.client_id, data.type_fete, data.salle, data.date_evenement, data.periode || 'Soir', data.heure_debut, data.heure_fin, data.nombre_invites, data.prix_total, data.avance, data.statut, data.notes, id);

      // Synchroniser avance avec payments
      const avance = parseFloat(data.avance) || 0;
      const firstPayment = db.prepare("SELECT id FROM payments WHERE reservation_id=? AND type_paiement='Avance' ORDER BY id ASC LIMIT 1").get(id);
      if (firstPayment) {
        db.prepare("UPDATE payments SET montant=? WHERE id=?").run(avance, firstPayment.id);
      } else if (avance > 0) {
        db.prepare("INSERT INTO payments (reservation_id, montant, methode, type_paiement, date_paiement) VALUES (?,?,?,?,?)").run(id, avance, 'Espèces', 'Avance', data.date_evenement);
      }

      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:cancel', async (_, id) => {
    try {
      const db = getDb();
      db.prepare("UPDATE reservations SET statut='cancelled' WHERE id=?").run(id);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:delete', async (_, id) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM payments WHERE reservation_id=?').run(id);
      db.prepare('DELETE FROM reservation_expenses WHERE reservation_id=?').run(id);
      db.prepare('DELETE FROM reservation_employees WHERE reservation_id=?').run(id);
      db.prepare('DELETE FROM catering WHERE reservation_id=?').run(id);
      db.prepare('DELETE FROM reservations WHERE id=?').run(id);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reservations:deleteAll', async () => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM reservation_expenses').run();
      db.prepare('DELETE FROM reservation_employees').run();
      db.prepare('DELETE FROM catering').run();
      db.prepare('DELETE FROM reservations').run();
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });

ipcMain.handle('reservations:getFinancialDetails', async (_, id) => {
  try {
    const db = getDb();
    const res = db.prepare('SELECT prix_total FROM reservations WHERE id=?').get(id);
    const totalPaye = db.prepare('SELECT COALESCE(SUM(montant),0) as s FROM payments WHERE reservation_id=?').get(id).s;

    const expenses = db.prepare(`
      SELECT categorie, COALESCE(SUM(montant),0) as total 
      FROM reservation_expenses WHERE reservation_id=? GROUP BY categorie
    `).all(id);

    // empCost juste pour l'affichage UI, PAS ajouté au totalDepenses
    const empCost = db.prepare('SELECT COALESCE(SUM(cout),0) as s FROM reservation_employees WHERE reservation_id=?').get(id).s;

    const catering = db.prepare('SELECT total_catering FROM catering WHERE reservation_id=?').get(id);

    // Les employés sont déjà dans reservation_expenses (catégorie 'Employés')
    // Le catering est déjà dans reservation_expenses (catégorie 'Catering')
    // Donc totalDepenses = juste la somme de reservation_expenses, sans double comptage
    const totalDepenses = expenses.reduce((a, b) => a + b.total, 0);

    const profit = totalPaye - totalDepenses;

    return {
      success: true,
      data: {
        prix_total: res.prix_total,
        total_paye: totalPaye,
        reste: res.prix_total - totalPaye,
        total_depenses: totalDepenses,
        emp_cost: empCost,
        catering_total: catering?.total_catering || 0,
        profit,
        expenses
      }
    };
  } catch (e) { return { success: false, error: e.message }; }
});
};
