const path = require('path');
const fs = require('fs');
const { app } = require('electron');

module.exports = function(ipcMain, mainWindow) {
  ipcMain.handle('pdf:generateReceipt', async (_, data) => {
    try {
      // Generate HTML receipt and print via Electron
      const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 900; color: #6366f1; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f8f9fa; }
  .total { font-weight: bold; font-size: 18px; color: #6366f1; }
  .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
  .signature { margin-top: 60px; display: flex; justify-content: space-between; }
</style>
</head><body>
<div class="header">
  <div class="logo">🏛 ${data.nom_salle || 'FESTIVA'}</div>
  <div>Salle des Fêtes de Luxe</div>
  <div>${data.adresse || ''} · ${data.telephone || ''}</div>
</div>
<h2>REÇU N° ${data.numero || 'REC-001'}</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-DZ')}</p>
<hr>
<p><strong>Client:</strong> ${data.client_nom}</p>
<p><strong>Téléphone:</strong> ${data.client_tel || ''}</p>
<p><strong>Événement:</strong> ${data.type_fete}</p>
<p><strong>Date événement:</strong> ${data.date_evenement}</p>
<p><strong>Salle:</strong> ${data.salle}</p>
<p><strong>Nombre d'invités:</strong> ${data.nombre_invites}</p>
<table>
  <tr><th>Description</th><th>Montant</th></tr>
  <tr><td>Location salle — ${data.type_fete}</td><td>${Number(data.prix_total).toLocaleString('fr-DZ')} DA</td></tr>
  <tr><td>Avance versée</td><td style="color:green">-${Number(data.avance||0).toLocaleString('fr-DZ')} DA</td></tr>
  <tr><td class="total">RESTE À PAYER</td><td class="total">${Number((data.prix_total||0)-(data.avance||0)).toLocaleString('fr-DZ')} DA</td></tr>
</table>
<div class="signature">
  <div><strong>Cachet & Signature</strong><br><br><br><div style="border-top:1px solid #999;width:150px;margin-top:8px;"></div></div>
  <div style="text-align:center;"><em>Merci pour votre confiance</em></div>
</div>
<div class="footer">
  <p>${data.nom_salle || 'FESTIVA'} — Tous droits réservés ${new Date().getFullYear()}</p>
</div>
</body></html>`;

      const tmpPath = path.join(app.getPath('temp'), `recu_${Date.now()}.html`);
      fs.writeFileSync(tmpPath, html);
      return { success: true, path: tmpPath, html };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('pdf:generateCateringSheet', async (_, data) => {
    try {
      const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; }
  .header { text-align: center; background: #1a1a2e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .section { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 12px 0; }
  h2 { color: #6366f1; }
  ul { padding-left: 20px; line-height: 2; }
  .badge { background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; }
</style>
</head><body>
<div class="header">
  <div style="font-size:24px;font-weight:900;">🍽 FICHE CUISINE</div>
  <div style="margin-top:8px;font-size:14px;">${data.nom_salle || 'FESTIVA'}</div>
</div>
<h2>📋 Informations événement</h2>
<div class="section">
  <p><strong>Client:</strong> ${data.client_nom}</p>
  <p><strong>Événement:</strong> ${data.type_fete}</p>
  <p><strong>Date:</strong> ${data.date_evenement}</p>
  <p><strong>Invités:</strong> <span class="badge">${data.nombre_invites} personnes</span></p>
</div>
<h2>🍲 Menu: ${data.nom_menu || 'Menu Standard'}</h2>
<div class="section">
  <strong>Plats:</strong><ul>${(data.plats||'').split(',').map(p=>`<li>${p.trim()}</li>`).join('')}</ul>
  ${data.boissons ? `<strong>Boissons:</strong><ul>${data.boissons.split(',').map(b=>`<li>${b.trim()}</li>`).join('')}</ul>` : ''}
  ${data.desserts ? `<strong>Desserts:</strong><ul>${data.desserts.split(',').map(d=>`<li>${d.trim()}</li>`).join('')}</ul>` : ''}
</div>
${data.notes ? `<h2>⚠️ Notes spéciales</h2><div class="alert">${data.notes}</div>` : ''}
<div class="section" style="margin-top:20px;">
  <strong>Prix par personne:</strong> ${Number(data.prix_par_personne||0).toLocaleString('fr-DZ')} DA<br>
  <strong>Total catering:</strong> <span style="font-size:18px;font-weight:bold;color:#6366f1;">${Number((data.prix_par_personne||0)*(data.nombre_personnes||0)).toLocaleString('fr-DZ')} DA</span>
</div>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><strong>Visa Chef Cuisinier</strong><br><br><br><div style="border-top:1px solid #999;width:150px;"></div></div>
  <div><strong>Visa Direction</strong><br><br><br><div style="border-top:1px solid #999;width:150px;"></div></div>
</div>
</body></html>`;
      return { success: true, html };
    } catch(e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('pdf:print', async (_, html) => {
    try {
      const { BrowserWindow } = require('electron');
      const win = new BrowserWindow({ show: false });
      await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      await win.webContents.print({}, (success) => { win.close(); });
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  });
};
