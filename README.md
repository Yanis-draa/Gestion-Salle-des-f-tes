# 🏛 FESTIVA — Logiciel de Gestion de Salle des Fêtes

> Logiciel desktop professionnel pour la gestion complète d'une salle des fêtes en Algérie.  
> Fonctionne **100% hors ligne** sur Windows.

---

## 📋 Fonctionnalités

| Module | Description |
|--------|-------------|
| 📊 **Tableau de bord** | KPIs, graphiques revenus/dépenses/profit, événements du jour |
| 📅 **Calendrier** | Vue mois/semaine/jour, événements colorés par statut |
| 🎉 **Réservations** | CRUD complet, vérification conflits de dates, statuts |
| 👥 **Clients** | Gestion clients, historique, recherche instantanée |
| 💳 **Paiements** | Avances, compléments, historique, méthodes multiples |
| 👔 **Employés** | Affectation aux réservations, calcul coûts auto |
| 🍽 **Catering** | Menus, plats, calcul auto, fiche cuisine imprimable |
| 📉 **Dépenses** | Générales (eau, électricité…) + par réservation |
| 📈 **Finances** | Bilan mensuel/annuel, marges, tableaux détaillés |
| 📋 **Statistiques** | Réservations par type, clients fidèles, camemberts |
| 🧾 **Reçus & Factures** | Génération PDF professionnelle, impression directe |
| ⚙️ **Paramètres** | Infos salle, couleurs thème, sauvegarde auto |

---

## 🛠 Prérequis

- **Windows 10/11** (64 bits)
- **Node.js 18.x ou 20.x LTS** → [Télécharger ici](https://nodejs.org)
- **npm** (inclus avec Node.js)

---

## 🚀 Installation & Lancement

### Option 1 — Script automatique (recommandé)

```
Double-cliquer sur INSTALLER.bat
```

Ce script va :
1. Vérifier que Node.js est installé
2. Installer toutes les dépendances (`npm install`)
3. Lancer l'application automatiquement

### Option 2 — Manuel (ligne de commande)

```bash
# Installer les dépendances
npm install

# Lancer en mode développement (Electron + React)
npm run electron-dev
```

### Lancements suivants

```
Double-cliquer sur LANCER.bat
```

Ou en ligne de commande :
```bash
npm run electron-dev
```

---

## 📦 Créer un installateur Windows (.exe)

```
Double-cliquer sur BUILD_WINDOWS.bat
```

Ou :
```bash
npm run electron-build
```

L'installateur `.exe` sera généré dans le dossier `dist/`.

---

## 🔐 Connexion par défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin@festiva.dz` |
| Mot de passe | `admin123` |

> ⚠️ **Changez le mot de passe dès la première connexion** dans les Paramètres.

---

## 🗂 Structure du projet

```
festiva/
│
├── electron/                 # Processus principal Electron
│   ├── main.js              # Point d'entrée Electron
│   ├── preload.js           # Bridge sécurisé Renderer ↔ Main
│   └── ipc/                 # Handlers IPC (logique métier)
│       ├── database.js      # Auth & initialisation DB
│       ├── clients.js       # CRUD clients
│       ├── reservations.js  # CRUD réservations
│       ├── payments.js      # Gestion paiements
│       ├── employees.js     # Gestion employés
│       ├── expenses.js      # Gestion dépenses
│       ├── finance.js       # Statistiques financières
│       ├── settings.js      # Paramètres
│       ├── pdf.js           # Génération reçus PDF
│       └── backup.js        # Sauvegarde/restauration
│
├── database/
│   └── db.js               # SQLite, schéma, données initiales
│
├── src/                     # Frontend React
│   ├── index.js            # Point d'entrée React
│   ├── App.js              # Composant racine
│   ├── index.css           # Design system global
│   │
│   ├── pages/              # Pages principales
│   │   ├── Dashboard.js
│   │   ├── CalendarPage.js
│   │   ├── ReservationsPage.js
│   │   ├── ClientsPage.js
│   │   ├── PaymentsPage.js
│   │   ├── EmployeesPage.js
│   │   ├── CateringPage.js
│   │   ├── ExpensesPage.js
│   │   ├── FinancePage.js
│   │   ├── StatsPage.js
│   │   ├── ReceiptsPage.js
│   │   ├── SettingsPage.js
│   │   └── LoginPage.js
│   │
│   ├── components/
│   │   └── layout/
│   │       └── Layout.js   # Sidebar + Topbar
│   │
│   ├── store/
│   │   └── index.js        # Zustand (état global)
│   │
│   └── utils/
│       └── index.js        # Formatage, constantes, API bridge
│
├── public/
│   └── index.html
│
├── INSTALLER.bat            # Installation + lancement (1er démarrage)
├── LANCER.bat               # Lancement rapide
├── BUILD_WINDOWS.bat        # Créer installateur .exe
└── package.json
```

---

## 💾 Base de données

- **SQLite** via `better-sqlite3`
- Fichier DB stocké dans : `%APPDATA%\festiva\festiva.db`
- Sauvegarde automatique configurable (1h, 2h, quotidienne)
- Export/import du fichier `.db` depuis les Paramètres

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs et rôles |
| `clients` | Clients de la salle |
| `reservations` | Réservations d'événements |
| `payments` | Paiements liés aux réservations |
| `employees` | Employés (serveurs, DJ, cuisine…) |
| `reservation_employees` | Affectation employés ↔ réservations |
| `reservation_expenses` | Dépenses par réservation |
| `monthly_expenses` | Dépenses générales mensuelles |
| `catering` | Services traiteur |
| `settings` | Configuration du logiciel |
| `logs` | Historique des actions |

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- Isolation Renderer/Main via **contextBridge**
- Accès DB uniquement depuis le processus principal
- Sessions utilisateurs par rôle (Admin, Réception, Caissier, Manager)

---

## 🎨 Technologies

| Couche | Technologie |
|--------|-------------|
| Desktop | Electron 29 |
| Frontend | React 18 + CSS custom |
| État | Zustand |
| Base de données | SQLite + better-sqlite3 |
| Graphiques | Recharts |
| PDF | Impression native Electron |
| Build | electron-builder (NSIS) |

---

## 📞 Support

Pour toute question ou personnalisation, contactez le développeur.

---

*FESTIVA v1.0.0 — Made in Algeria 🇩🇿*
