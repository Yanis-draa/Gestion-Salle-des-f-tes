const { getDb } = require('../../database/db');

module.exports = function(ipcMain) {

  // ─── GET ALL ───────────────────────────────────────────────
  ipcMain.handle('employees:getAll', async () => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT e.*,
          COUNT(DISTINCT re.reservation_id) as nb_reservations,
          COALESCE(SUM(re.cout), 0) as total_gagne
        FROM employees e
        LEFT JOIN reservation_employees re ON re.employee_id = e.id
        GROUP BY e.id
        ORDER BY e.nom
      `).all();
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET BY ID (with full history) ────────────────────────
  ipcMain.handle('employees:getById', async (_, id) => {
    try {
      const db = getDb();
      const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(id);
      if (!emp) return { success: false, error: 'Employé introuvable' };

      const history = db.prepare(`
        SELECT r.id, r.date_evenement, r.type_fete, r.statut, r.salle,
          c.nom as client_nom, re.cout, re.role
        FROM reservations r
        JOIN reservation_employees re ON re.reservation_id = r.id
        JOIN clients c ON c.id = r.client_id
        WHERE re.employee_id = ?
        ORDER BY r.date_evenement DESC
      `).all(id);

      const stats = db.prepare(`
        SELECT
          COUNT(DISTINCT re.reservation_id) as total_reservations,
          COALESCE(SUM(re.cout), 0) as total_gagne,
          COALESCE(AVG(re.cout), 0) as avg_cout
        FROM reservation_employees re
        WHERE re.employee_id = ?
      `).get(id);

      const byType = db.prepare(`
        SELECT r.type_fete, COUNT(*) as count
        FROM reservations r
        JOIN reservation_employees re ON re.reservation_id = r.id
        WHERE re.employee_id = ?
        GROUP BY r.type_fete
        ORDER BY count DESC
      `).all(id);

      return { success: true, data: { ...emp, history, stats, byType } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── CREATE ────────────────────────────────────────────────
  ipcMain.handle('employees:create', async (_, data) => {
    try {
      const db = getDb();
      const r = db.prepare(`
        INSERT INTO employees (nom, telephone, adresse, poste, grade, prix_par_jour, disponible, date_recrutement, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.nom, data.telephone, data.adresse || '',
        data.poste, data.grade || 'Standard',
        data.prix_par_jour || 0,
        data.disponible !== false ? 1 : 0,
        data.date_recrutement || null,
        data.notes || ''
      );
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── UPDATE ────────────────────────────────────────────────
  ipcMain.handle('employees:update', async (_, id, data) => {
    try {
      const db = getDb();

      // 1. Mettre à jour l'employé
      db.prepare(`
        UPDATE employees SET
          nom=?, telephone=?, adresse=?, poste=?, grade=?,
          prix_par_jour=?, disponible=?, date_recrutement=?, notes=?
        WHERE id=?
      `).run(
        data.nom, data.telephone, data.adresse || '',
        data.poste, data.grade || 'Standard',
        data.prix_par_jour || 0,
        data.disponible ? 1 : 0,
        data.date_recrutement || null,
        data.notes || '',
        id
      );

      // 2. Récupérer les réservations futures (pending/confirmed) où cet employé est affecté
      const affectedReservations = db.prepare(`
        SELECT re.reservation_id
        FROM reservation_employees re
        JOIN reservations r ON r.id = re.reservation_id
        WHERE re.employee_id = ?
          AND r.statut NOT IN ('done', 'cancelled')
      `).all(id);

      for (const { reservation_id } of affectedReservations) {
        // 3. Mettre à jour le cout dans reservation_employees
        db.prepare(`
          UPDATE reservation_employees
          SET cout = ?, role = ?
          WHERE employee_id = ? AND reservation_id = ?
        `).run(data.prix_par_jour || 0, data.poste, id, reservation_id);

        // 4. Mettre à jour la dépense dans reservation_expenses
        db.prepare(`
          UPDATE reservation_expenses
          SET montant = ?, description = ?
          WHERE reservation_id = ?
            AND categorie = 'Employés'
            AND description LIKE ?
        `).run(
          data.prix_par_jour || 0,
          `${data.nom} (${data.poste}) [emp_id:${id}]`,
          reservation_id,
          `%[emp_id:${id}]%`
        );
      }

      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── DELETE ONE ────────────────────────────────────────────
  ipcMain.handle('employees:delete', async (_, id) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM reservation_employees WHERE employee_id=?').run(id);
      db.prepare('DELETE FROM employees WHERE id=?').run(id);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── DELETE ALL ────────────────────────────────────────────
  ipcMain.handle('employees:deleteAll', async () => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM reservation_employees').run();
      db.prepare('DELETE FROM employees').run();
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── SEARCH ───────────────────────────────────────────────
  ipcMain.handle('employees:search', async (_, q) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT e.*, COUNT(DISTINCT re.reservation_id) as nb_reservations,
          COALESCE(SUM(re.cout), 0) as total_gagne
        FROM employees e
        LEFT JOIN reservation_employees re ON re.employee_id = e.id
        WHERE e.nom LIKE ? OR e.telephone LIKE ? OR e.poste LIKE ?
        GROUP BY e.id ORDER BY e.nom
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET HISTORY ──────────────────────────────────────────
  ipcMain.handle('employees:getHistory', async (_, id) => {
    try {
      const db = getDb();
      const history = db.prepare(`
        SELECT r.id, r.date_evenement, r.type_fete, r.statut, r.salle,
          c.nom as client_nom, re.cout, re.role
        FROM reservations r
        JOIN reservation_employees re ON re.reservation_id = r.id
        JOIN clients c ON c.id = r.client_id
        WHERE re.employee_id = ?
        ORDER BY r.date_evenement DESC
      `).all(id);
      return { success: true, data: history };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET STATS (dashboard) ────────────────────────────────
  ipcMain.handle('employees:getStats', async () => {
    try {
      const db = getDb();
      const total = db.prepare('SELECT COUNT(*) as c FROM employees').get().c;
      const disponibles = db.prepare("SELECT COUNT(*) as c FROM employees WHERE disponible=1").get().c;
      const byPoste = db.prepare(`
        SELECT poste, COUNT(*) as count FROM employees GROUP BY poste ORDER BY count DESC
      `).all();
      const topActif = db.prepare(`
        SELECT e.nom, e.poste, COUNT(re.reservation_id) as nb, COALESCE(SUM(re.cout),0) as gains
        FROM employees e
        LEFT JOIN reservation_employees re ON re.employee_id = e.id
        GROUP BY e.id ORDER BY nb DESC LIMIT 5
      `).all();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const coutMensuel = db.prepare(`
        SELECT COALESCE(SUM(re.cout), 0) as total
        FROM reservation_employees re
        JOIN reservations r ON r.id = re.reservation_id
        WHERE strftime('%m', r.date_evenement) = ? AND strftime('%Y', r.date_evenement) = ?
      `).get(String(currentMonth).padStart(2,'0'), String(currentYear)).total;

      return { success: true, data: { total, disponibles, occupes: total - disponibles, byPoste, topActif, coutMensuel } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── ASSIGN TO RESERVATION ────────────────────────────────
  ipcMain.handle('employees:assignToReservation', async (_, data) => {
    try {
      const db = getDb();
      const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(data.employee_id);
      if (!emp) return { success: false, error: 'Employé introuvable' };
      const cout = data.cout !== undefined ? data.cout : emp.prix_par_jour;

      db.prepare(`
        INSERT OR REPLACE INTO reservation_employees (reservation_id, employee_id, role, cout)
        VALUES (?, ?, ?, ?)
      `).run(data.reservation_id, data.employee_id, data.role || emp.poste, cout);

      // Supprimer l'ancienne dépense de cet employé pour cette réservation
      db.prepare(`
        DELETE FROM reservation_expenses
        WHERE reservation_id=? AND categorie='Employés' AND description LIKE '%emp_id:'||?||'%'
      `).run(data.reservation_id, data.employee_id);

      // Insérer la nouvelle dépense
      db.prepare(`
        INSERT INTO reservation_expenses (reservation_id, categorie, description, montant)
        VALUES (?, 'Employés', ?, ?)
      `).run(data.reservation_id, `${emp.nom} (${data.role || emp.poste}) [emp_id:${data.employee_id}]`, cout);

      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── REMOVE FROM RESERVATION ──────────────────────────────
  ipcMain.handle('employees:removeFromReservation', async (_, empId, resId) => {
    try {
      const db = getDb();

      // Supprimer l'affectation
      db.prepare(`
        DELETE FROM reservation_employees
        WHERE employee_id=? AND reservation_id=?
      `).run(empId, resId);

      // Supprimer la dépense associée à cet employé
      db.prepare(`
        DELETE FROM reservation_expenses
        WHERE reservation_id=?
          AND categorie='Employés'
          AND description LIKE ?
      `).run(resId, `%[emp_id:${empId}]%`);

      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ─── GET EMPLOYEES FOR RESERVATION ───────────────────────
  ipcMain.handle('employees:getByReservation', async (_, resId) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT e.*, re.cout, re.role
        FROM employees e
        JOIN reservation_employees re ON re.employee_id = e.id
        WHERE re.reservation_id = ?
        ORDER BY e.poste, e.nom
      `).all(resId);
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });
};