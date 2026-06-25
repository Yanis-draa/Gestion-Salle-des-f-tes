const { getDb } = require('../../database/db');
const bcrypt = require('bcryptjs');

module.exports = function(ipcMain) {
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return { success: false, error: 'Utilisateur introuvable' };
      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) return { success: false, error: 'Mot de passe incorrect' };
      db.prepare("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)").run(user.id, 'login', `Connexion: ${email}`);
      const { password: _, ...safeUser } = user;
      return { success: true, user: safeUser };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('auth:register', async (_, { nom, email, password, role }) => {
    try {
      const db = getDb();
      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)').run(nom, email, hash, role || 'reception');
      return { success: true, id: result.lastInsertRowid };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('auth:getUsers', async () => {
    try {
      const db = getDb();
      const users = db.prepare('SELECT id, nom, email, role, created_at FROM users').all();
      return { success: true, data: users };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('auth:logout', async () => ({ success: true }));
};
