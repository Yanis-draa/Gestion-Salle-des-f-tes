const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(app.getPath('userData'), 'festiva.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    runMigrations();
  }
  return db;
}

function runMigrations() {
  // ─── reservations ───
  const rescols = db.prepare("PRAGMA table_info(reservations)").all().map(c => c.name);
  if (!rescols.includes('periode')) db.exec("ALTER TABLE reservations ADD COLUMN periode TEXT DEFAULT 'Soir'");
  if (!rescols.includes('pack_id')) db.exec("ALTER TABLE reservations ADD COLUMN pack_id INTEGER DEFAULT NULL");
  if (!rescols.includes('total_paye')) {
    db.exec("ALTER TABLE reservations ADD COLUMN total_paye REAL DEFAULT 0");
    db.exec("UPDATE reservations SET total_paye = COALESCE(avance, 0)");
  }

  // ─── employees ───
  const cols = db.prepare("PRAGMA table_info(employees)").all().map(c => c.name);
  if (!cols.includes('adresse')) db.exec("ALTER TABLE employees ADD COLUMN adresse TEXT DEFAULT ''");
  if (!cols.includes('date_recrutement')) db.exec("ALTER TABLE employees ADD COLUMN date_recrutement DATE");
  if (!cols.includes('photo_path')) db.exec("ALTER TABLE employees ADD COLUMN photo_path TEXT DEFAULT ''");

  // ─── reservation_employees ───
  const recols = db.prepare("PRAGMA table_info(reservation_employees)").all().map(c => c.name);
  if (!recols.includes('role')) db.exec("ALTER TABLE reservation_employees ADD COLUMN role TEXT DEFAULT ''");
  if (!recols.includes('total_price')) db.exec("ALTER TABLE reservation_employees ADD COLUMN total_price REAL DEFAULT 0");


  // ─── catering ───
  const cateringCols = db.prepare("PRAGMA table_info(catering)").all().map(c => c.name);
  if (!cateringCols.includes('menu_template_id'))
    db.exec("ALTER TABLE catering ADD COLUMN menu_template_id INTEGER DEFAULT NULL");
  if (!cateringCols.includes('personnalisation'))
    db.exec("ALTER TABLE catering ADD COLUMN personnalisation TEXT DEFAULT ''");
  if (!cateringCols.includes('entrees'))
    db.exec("ALTER TABLE catering ADD COLUMN entrees TEXT DEFAULT ''");
  if (!cateringCols.includes('cafe'))
    db.exec("ALTER TABLE catering ADD COLUMN cafe TEXT DEFAULT ''");
  if (!cateringCols.includes('collation'))
    db.exec("ALTER TABLE catering ADD COLUMN collation TEXT DEFAULT ''");

  // ─── menu_templates ───
  const templateCols = db.prepare("PRAGMA table_info(menu_templates)").all().map(c => c.name);
  if (!templateCols.includes('actif'))
    db.exec("ALTER TABLE menu_templates ADD COLUMN actif INTEGER DEFAULT 1");
  if (!templateCols.includes('entrees'))
    db.exec("ALTER TABLE menu_templates ADD COLUMN entrees TEXT DEFAULT ''");
  if (!templateCols.includes('cafe'))
    db.exec("ALTER TABLE menu_templates ADD COLUMN cafe TEXT DEFAULT ''");
  if (!templateCols.includes('collation'))
    db.exec("ALTER TABLE menu_templates ADD COLUMN collation TEXT DEFAULT ''");

}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'reception',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      type_fete TEXT NOT NULL,
      salle TEXT DEFAULT 'Salle A',
      date_evenement DATE NOT NULL,
      heure_debut TEXT DEFAULT '15:00',
      heure_fin TEXT DEFAULT '23:00',
      nombre_invites INTEGER DEFAULT 0,
      prix_total REAL DEFAULT 0,
      avance REAL DEFAULT 0,
      statut TEXT DEFAULT 'pending',
      notes TEXT,
      periode TEXT DEFAULT 'Soir',
      pack_id INTEGER DEFAULT NULL,
      total_paye REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      montant REAL NOT NULL,
      methode TEXT DEFAULT 'Espèces',
      type_paiement TEXT DEFAULT 'Avance',
      reference TEXT,
      notes TEXT,
      date_paiement DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT DEFAULT '',
      poste TEXT NOT NULL,
      grade TEXT DEFAULT 'Standard',
      prix_par_jour REAL DEFAULT 0,
      disponible INTEGER DEFAULT 1,
      date_recrutement DATE,
      photo_path TEXT DEFAULT '',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservation_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      role TEXT DEFAULT '',
      cout REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id),
      FOREIGN KEY(employee_id) REFERENCES employees(id),
      UNIQUE(reservation_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS reservation_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      categorie TEXT NOT NULL,
      description TEXT,
      montant REAL DEFAULT 0,
      date_depense DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );

    CREATE TABLE IF NOT EXISTS monthly_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categorie TEXT NOT NULL,
      description TEXT,
      montant REAL DEFAULT 0,
      mois INTEGER NOT NULL,
      annee INTEGER NOT NULL,
      date_depense DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catering (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      menu_template_id INTEGER DEFAULT NULL,
      nom_menu TEXT NOT NULL,
      type_repas TEXT DEFAULT 'Complet',
      nombre_personnes INTEGER DEFAULT 0,
      prix_par_personne REAL DEFAULT 0,
      total_catering REAL DEFAULT 0,
      plats TEXT DEFAULT '',
      boissons TEXT DEFAULT '',
      desserts TEXT DEFAULT '',
      entrees TEXT DEFAULT '',
      cafe TEXT DEFAULT '',
      collation TEXT DEFAULT '',
      personnalisation TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id),
      FOREIGN KEY(menu_template_id) REFERENCES menu_templates(id)
    );

    CREATE TABLE IF NOT EXISTS menu_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type_repas TEXT DEFAULT 'Complet',
      prix_par_personne REAL DEFAULT 0,
      description TEXT DEFAULT '',
      plats TEXT DEFAULT '',
      boissons TEXT DEFAULT '',
      desserts TEXT DEFAULT '',
      entrees TEXT DEFAULT '',
      cafe TEXT DEFAULT '',
      collation TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      actif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prix REAL DEFAULT 0,
      menu_template_id INTEGER DEFAULT NULL,
      services TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      actif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(menu_template_id) REFERENCES menu_templates(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nom_salle TEXT DEFAULT '',
      telephone TEXT DEFAULT '',
      adresse TEXT DEFAULT '',
      logo_path TEXT DEFAULT '',
      theme TEXT DEFAULT 'dark',
      accent_color TEXT DEFAULT '#6366f1',
      backup_interval TEXT DEFAULT '2h',
      last_backup DATETIME
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (count.c === 0) {
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare("INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)").run('Administrateur', 'admin', hash, 'admin');
    // seedSampleData();
  }
}

function seedSampleData() {
  const insertClient = db.prepare('INSERT INTO clients (nom, telephone, adresse) VALUES (?, ?, ?)');
  [
    ['Karim Boudiaf', '0661 234 567', 'Alger Centre'],
    ['Sara Mansouri', '0770 891 234', 'Bab El Oued, Alger'],
    ['Ahmed Kaci', '0555 678 901', 'Hydra, Alger'],
    ['Fatima Bensalem', '0661 345 678', 'Bir Mourad Raïs, Alger'],
    ['Omar Hadjadj', '0770 123 456', 'Hussein Dey, Alger'],
    ['Lina Hadj', '0661 987 654', 'El Biar, Alger'],
  ].forEach(c => insertClient.run(...c));

  const insertEmp = db.prepare('INSERT INTO employees (nom, telephone, poste, prix_par_jour, date_recrutement) VALUES (?, ?, ?, ?, ?)');
  [
    ['Youcef Amrani', '0661 111 222', 'Serveur', 3000, '2024-01-15'],
    ['Rachid Benali', '0770 333 444', 'DJ', 8000, '2024-03-01'],
    ['Khadija Moulai', '0555 555 666', 'Cuisinier', 6000, '2023-06-10'],
    ['Mohamed Saadi', '0661 777 888', 'Nettoyage', 2500, '2024-02-20'],
    ['Nour Brahimi', '0770 999 000', 'Décoration', 5000, '2023-11-05'],
    ['Ali Cherif', '0555 123 456', 'Sécurité', 4000, '2024-04-01'],
    ['Samira Hadj', '0661 654 321', 'Photographe', 7000, '2023-09-15'],
  ].forEach(e => insertEmp.run(...e));

  const insertRes = db.prepare('INSERT INTO reservations (client_id, type_fete, salle, date_evenement, nombre_invites, prix_total, avance, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertRes.run(1, 'Mariage', 'Salle A', '2026-05-13', 250, 180000, 140000, 'confirmed');
  insertRes.run(2, 'Fiançailles', 'Salle B', '2026-05-15', 120, 95000, 30000, 'pending');
  insertRes.run(3, 'Anniversaire', 'Salle A', '2026-05-20', 80, 65000, 65000, 'done');
  insertRes.run(4, 'Mariage', 'Salle A', '2026-06-01', 300, 220000, 100000, 'confirmed');
  insertRes.run(5, 'Baptême', 'Salle B', '2026-06-05', 60, 45000, 0, 'cancelled');

  const insertPay = db.prepare('INSERT INTO payments (reservation_id, montant, methode, type_paiement, date_paiement) VALUES (?, ?, ?, ?, ?)');
  insertPay.run(1, 100000, 'Virement', 'Avance', '2026-04-01');
  insertPay.run(1, 40000, 'Espèces', 'Complément', '2026-05-10');
  insertPay.run(2, 30000, 'Espèces', 'Avance', '2026-04-15');
  insertPay.run(3, 65000, 'Chèque', 'Complet', '2026-05-08');
  insertPay.run(4, 100000, 'Virement', 'Avance', '2026-05-01');

  db.prepare('INSERT OR IGNORE INTO reservation_employees (reservation_id, employee_id, role, cout) VALUES (?, ?, ?, ?)').run(1, 1, 'Serveur', 3000);
  db.prepare('INSERT OR IGNORE INTO reservation_employees (reservation_id, employee_id, role, cout) VALUES (?, ?, ?, ?)').run(1, 2, 'DJ', 8000);
  db.prepare('INSERT OR IGNORE INTO reservation_employees (reservation_id, employee_id, role, cout) VALUES (?, ?, ?, ?)').run(1, 3, 'Cuisinier', 6000);
  db.prepare('INSERT OR IGNORE INTO reservation_employees (reservation_id, employee_id, role, cout) VALUES (?, ?, ?, ?)').run(3, 1, 'Serveur', 3000);
  db.prepare('INSERT OR IGNORE INTO reservation_employees (reservation_id, employee_id, role, cout) VALUES (?, ?, ?, ?)').run(3, 7, 'Photographe', 7000);

  const insertExp = db.prepare('INSERT INTO monthly_expenses (categorie, description, montant, mois, annee, date_depense) VALUES (?, ?, ?, ?, ?, ?)');
  insertExp.run('Électricité', 'Facture Sonelgaz — Mai 2026', 85000, 5, 2026, '2026-05-01');
  insertExp.run('Salaires', 'Paie mensuelle employés fixes', 220000, 5, 2026, '2026-05-03');
  insertExp.run('Loyer', 'Loyer mensuel salle', 120000, 5, 2026, '2026-05-05');
  insertExp.run('Eau', 'Facture ADE — Mai 2026', 12000, 5, 2026, '2026-05-08');
  insertExp.run('Maintenance', 'Réparation système audio', 35000, 5, 2026, '2026-05-10');
  insertExp.run('Produits', 'Produits entretien', 15000, 5, 2026, '2026-05-12');
}

module.exports = { getDb };