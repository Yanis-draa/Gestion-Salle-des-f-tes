const { getDb } = require('../../database/db');
module.exports = function(ipcMain) {
  ipcMain.handle('finance:getSummary', async (_, month, year) => {
    try {
      const db = getDb();
      const revenus = db.prepare(`SELECT COALESCE(SUM(p.montant),0) as total FROM payments p JOIN reservations r ON r.id=p.reservation_id WHERE strftime('%m',p.date_paiement)=? AND strftime('%Y',p.date_paiement)=?`).get(String(month).padStart(2,'0'), String(year)).total;
      const depenses = db.prepare(`SELECT COALESCE(SUM(montant),0) as total FROM monthly_expenses WHERE mois=? AND annee=?`).get(month, year).total;
      const depensesRes = db.prepare(`SELECT COALESCE(SUM(re.montant),0) as total FROM reservation_expenses re JOIN reservations r ON r.id=re.reservation_id WHERE strftime('%m',r.date_evenement)=? AND strftime('%Y',r.date_evenement)=?`).get(String(month).padStart(2,'0'), String(year)).total;
      const nbRes = db.prepare(`SELECT COUNT(*) as c FROM reservations WHERE strftime('%m',date_evenement)=? AND strftime('%Y',date_evenement)=? AND statut!='cancelled'`).get(String(month).padStart(2,'0'), String(year)).c;
      const totalDepenses = depenses + depensesRes;
      return { success: true, data: { revenus, depenses: totalDepenses, profit: revenus - totalDepenses, nb_reservations: nbRes } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('finance:getMonthlySummary', async (_, year) => {
    try {
      const db = getDb();
      const months = [];
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2,'0');
        const revenus = db.prepare(`SELECT COALESCE(SUM(montant),0) as t FROM payments WHERE strftime('%m',date_paiement)=? AND strftime('%Y',date_paiement)=?`).get(mm, String(year)).t;
        const depenses = db.prepare(`SELECT COALESCE(SUM(montant),0) as t FROM monthly_expenses WHERE mois=? AND annee=?`).get(m, year).t;
        const nbRes = db.prepare(`SELECT COUNT(*) as c FROM reservations WHERE strftime('%m',date_evenement)=? AND strftime('%Y',date_evenement)=? AND statut!='cancelled'`).get(mm, String(year)).c;
        months.push({ mois: m, revenus, depenses, profit: revenus - depenses, nb_reservations: nbRes });
      }
      return { success: true, data: months };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('finance:getAnnualSummary', async (_, year) => {
    try {
      const db = getDb();
      const revenus = db.prepare(`SELECT COALESCE(SUM(montant),0) as t FROM payments WHERE strftime('%Y',date_paiement)=?`).get(String(year)).t;
      const depenses = db.prepare(`SELECT COALESCE(SUM(montant),0) as t FROM monthly_expenses WHERE annee=?`).get(year).t;
      const nbRes = db.prepare(`SELECT COUNT(*) as c FROM reservations WHERE strftime('%Y',date_evenement)=? AND statut!='cancelled'`).get(String(year)).c;
      return { success: true, data: { revenus, depenses, profit: revenus - depenses, nb_reservations: nbRes } };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('finance:getStats', async () => {
    try {
      const db = getDb();
      const byType = db.prepare(`SELECT type_fete, COUNT(*) as count FROM reservations WHERE statut!='cancelled' GROUP BY type_fete`).all();
      const topClients = db.prepare(`SELECT c.nom, COUNT(DISTINCT r.id) as nb, COALESCE(SUM(DISTINCT p.montant),0) as total FROM clients c JOIN reservations r ON r.client_id=c.id LEFT JOIN payments p ON p.reservation_id=r.id GROUP BY c.id ORDER BY nb DESC LIMIT 5`).all();
      return { success: true, data: { byType, topClients } };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
