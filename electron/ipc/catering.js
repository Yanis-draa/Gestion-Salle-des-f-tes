const { getDb } = require('../../database/db');

module.exports = function(ipcMain) {

  // ══════════════════════════════════════════════
  // MENUS MODÈLES (templates)
  // ══════════════════════════════════════════════

  ipcMain.handle('catering:getTemplates', async () => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT m.*,
          COUNT(c.id) as nb_utilisations,
          COALESCE(AVG(c.prix_par_personne), m.prix_par_personne) as prix_moyen
        FROM menu_templates m
        LEFT JOIN catering c ON c.menu_template_id = m.id
        WHERE m.actif = 1
        GROUP BY m.id
        ORDER BY nb_utilisations DESC, m.nom
      `).all();
      return { success: true, data: rows };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('catering:createTemplate', async (_, data) => {
    try {
      const db = getDb();
      const r = db.prepare(`
        INSERT INTO menu_templates (nom, description, prix_par_personne, type_repas, entrees, plats, boissons, desserts, cafe, collation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.nom,
        data.description || '',
        data.prix_par_personne || 0,
        data.type_repas || 'Complet',
        data.entrees || '',
        data.plats || '',
        data.boissons || '',
        data.desserts || '',
        data.cafe || '',
        data.collation || '',
        data.notes || ''
      );
      return { success: true, id: r.lastInsertRowid };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('catering:updateTemplate', async (_, id, data) => {
    try {
      getDb().prepare(`
        UPDATE menu_templates
        SET nom=?, description=?, prix_par_personne=?, type_repas=?,
            entrees=?, plats=?, boissons=?, desserts=?, cafe=?, collation=?, notes=?
        WHERE id=?
      `).run(
        data.nom,
        data.description || '',
        data.prix_par_personne || 0,
        data.type_repas || 'Complet',
        data.entrees || '',
        data.plats || '',
        data.boissons || '',
        data.desserts || '',
        data.cafe || '',
        data.collation || '',
        data.notes || '',
        id
      );
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

ipcMain.handle('catering:deleteTemplate', async (_, id) => {
  try {
    const db = getDb();
    // Soft delete du template
    db.prepare('UPDATE menu_templates SET actif=0 WHERE id=?').run(id);
    // Retirer ce template des packs qui l'utilisaient
   db.prepare('DELETE FROM packs WHERE menu_template_id=?').run(id);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

  // ══════════════════════════════════════════════
  // CATERING D'UNE RÉSERVATION
  // ══════════════════════════════════════════════

  ipcMain.handle('catering:getByReservation', async (_, reservationId) => {
    try {
      const db = getDb();
      const cat = db.prepare(`
        SELECT c.*, m.nom as template_nom
        FROM catering c
        LEFT JOIN menu_templates m ON m.id = c.menu_template_id
        WHERE c.reservation_id = ?
      `).get(reservationId);
      return { success: true, data: cat || null };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // Appliquer un menu template à une réservation (pré-remplissage)
  ipcMain.handle('catering:applyTemplate', async (_, reservationId, templateId) => {
    try {
      const db = getDb();
      const template = db.prepare('SELECT * FROM menu_templates WHERE id=?').get(templateId);
      if (!template) return { success: false, error: 'Menu introuvable' };
      const res = db.prepare('SELECT nombre_invites FROM reservations WHERE id=?').get(reservationId);
      const nbPersonnes = res?.nombre_invites || 0;
      const total = nbPersonnes * template.prix_par_personne;
      return {
        success: true,
        data: {
          menu_template_id: template.id,
          nom_menu: template.nom,
          type_repas: template.type_repas,
          nombre_personnes: nbPersonnes,
          prix_par_personne: template.prix_par_personne,
          total_catering: total,
          entrees: template.entrees || '',
          plats: template.plats || '',
          boissons: template.boissons || '',
          desserts: template.desserts || '',
          cafe: template.cafe || '',
          collation: template.collation || '',
          personnalisation: '',
          notes: template.notes || '',
        }
      };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // Sauvegarder / mettre à jour le catering d'une réservation
  ipcMain.handle('catering:save', async (_, reservationId, data) => {
    try {
      const db = getDb();
      const total = (data.nombre_personnes || 0) * (data.prix_par_personne || 0);
      const existing = db.prepare('SELECT id FROM catering WHERE reservation_id=?').get(reservationId);

      if (existing) {
        db.prepare(`
          UPDATE catering
          SET menu_template_id=?, nom_menu=?, type_repas=?, nombre_personnes=?,
              prix_par_personne=?, total_catering=?,
              entrees=?, plats=?, boissons=?, desserts=?, cafe=?, collation=?,
              personnalisation=?, notes=?
          WHERE reservation_id=?
        `).run(
          data.menu_template_id || null,
          data.nom_menu,
          data.type_repas || 'Complet',
          data.nombre_personnes || 0,
          data.prix_par_personne || 0,
          total,
          data.entrees || '',
          data.plats || '',
          data.boissons || '',
          data.desserts || '',
          data.cafe || '',
          data.collation || '',
          data.personnalisation || '',
          data.notes || '',
          reservationId
        );
      } else {
        db.prepare(`
          INSERT INTO catering (
            reservation_id, menu_template_id, nom_menu, type_repas, nombre_personnes,
            prix_par_personne, total_catering,
            entrees, plats, boissons, desserts, cafe, collation,
            personnalisation, notes
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          reservationId,
          data.menu_template_id || null,
          data.nom_menu,
          data.type_repas || 'Complet',
          data.nombre_personnes || 0,
          data.prix_par_personne || 0,
          total,
          data.entrees || '',
          data.plats || '',
          data.boissons || '',
          data.desserts || '',
          data.cafe || '',
          data.collation || '',
          data.personnalisation || '',
          data.notes || ''
        );
      }

      // Mettre à jour les dépenses de la réservation (supprimer l'ancien catering, ajouter le nouveau)
      db.prepare("DELETE FROM reservation_expenses WHERE reservation_id=? AND categorie='Catering'").run(reservationId);
      if (total > 0) {
        db.prepare("INSERT INTO reservation_expenses (reservation_id, categorie, description, montant) VALUES (?,?,?,?)")
          .run(reservationId, 'Catering', `${data.nom_menu} — ${data.nombre_personnes} personnes`, total);
      }

      return { success: true, total };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('catering:delete', async (_, reservationId) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM catering WHERE reservation_id=?').run(reservationId);
      db.prepare("DELETE FROM reservation_expenses WHERE reservation_id=? AND categorie='Catering'").run(reservationId);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // ══════════════════════════════════════════════
  // FICHE CUISINE (impression)
  // ══════════════════════════════════════════════

  ipcMain.handle('catering:getFicheData', async (_, reservationId) => {
    try {
      const db = getDb();
      const res = db.prepare(`
        SELECT r.*, c.nom as client_nom, c.telephone as client_tel
        FROM reservations r JOIN clients c ON c.id = r.client_id
        WHERE r.id=?
      `).get(reservationId);
      const cat = db.prepare('SELECT * FROM catering WHERE reservation_id=?').get(reservationId);
      const settings = db.prepare('SELECT * FROM settings WHERE id=1').get();
      return { success: true, data: { reservation: res, catering: cat, settings } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // Stats catering pour le dashboard
  ipcMain.handle('catering:getStats', async () => {
    try {
      const db = getDb();
      const totalCA = db.prepare('SELECT COALESCE(SUM(total_catering),0) as s FROM catering').get().s;
      const nbMenus = db.prepare('SELECT COUNT(*) as c FROM catering').get().c;
      const topMenu = db.prepare(`
        SELECT nom_menu, COUNT(*) as count, SUM(total_catering) as total
        FROM catering GROUP BY nom_menu ORDER BY count DESC LIMIT 5
      `).all();
      const templates = db.prepare('SELECT COUNT(*) as c FROM menu_templates WHERE actif=1').get().c;
      return { success: true, data: { totalCA, nbMenus, topMenu, templates } };
    } catch(e) { return { success: false, error: e.message }; }
  });
};