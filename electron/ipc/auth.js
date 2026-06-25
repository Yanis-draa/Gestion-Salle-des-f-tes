const { getDb } = require('../../database/db');
const bcrypt = require('bcryptjs');

module.exports = function(ipcMain) {

  // ── LOGIN ──────────────────────────────────────────────────
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return { success: false, error: 'Email ou mot de passe incorrect' };

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) return { success: false, error: 'Email ou mot de passe incorrect' };

      // Log the login
      db.prepare("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)")
        .run(user.id, 'login', `Connexion de ${user.nom}`);

      const { password: _, ...safeUser } = user;
      return { success: true, user: safeUser };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── LOGOUT ─────────────────────────────────────────────────
  ipcMain.handle('auth:logout', async (_, userId) => {
    try {
      const db = getDb();
      if (userId) {
        db.prepare("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)")
          .run(userId, 'logout', 'Déconnexion');
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── GET ALL USERS ──────────────────────────────────────────
  ipcMain.handle('auth:getUsers', async () => {
    try {
      const db = getDb();
      const users = db.prepare('SELECT id, nom, email, role, created_at FROM users ORDER BY nom').all();
      return { success: true, data: users };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── CREATE USER ────────────────────────────────────────────
  ipcMain.handle('auth:createUser', async (_, data) => {
    try {
      const db = getDb();
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
      if (existing) return { success: false, error: 'Cet email est déjà utilisé' };

      const hash = bcrypt.hashSync(data.password, 10);
      const r = db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)')
        .run(data.nom, data.email, hash, data.role || 'reception');
      return { success: true, id: r.lastInsertRowid };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── UPDATE USER ────────────────────────────────────────────
  ipcMain.handle('auth:updateUser', async (_, id, data) => {
    try {
      const db = getDb();
      if (data.password) {
        const hash = bcrypt.hashSync(data.password, 10);
        db.prepare('UPDATE users SET nom=?, email=?, password=?, role=? WHERE id=?')
          .run(data.nom, data.email, hash, data.role || 'reception', id);
      } else {
        db.prepare('UPDATE users SET nom=?, email=?, role=? WHERE id=?')
          .run(data.nom, data.email, data.role || 'reception', id);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── DELETE USER ────────────────────────────────────────────
  ipcMain.handle('auth:deleteUser', async (_, id) => {
    try {
      const db = getDb();
      // Empêcher la suppression du dernier admin
      const admins = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get();
      const user = db.prepare('SELECT role FROM users WHERE id=?').get(id);
      if (user?.role === 'admin' && admins.c <= 1) {
        return { success: false, error: 'Impossible de supprimer le dernier administrateur' };
      }
      db.prepare('DELETE FROM users WHERE id=?').run(id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── CHANGE PASSWORD ────────────────────────────────────────
  ipcMain.handle('auth:changePassword', async (_, { userId, oldPassword, newPassword }) => {
    try {
      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
      if (!user) return { success: false, error: 'Utilisateur introuvable' };

      const valid = bcrypt.compareSync(oldPassword, user.password);
      if (!valid) return { success: false, error: 'Ancien mot de passe incorrect' };

      const hash = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, userId);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

};
