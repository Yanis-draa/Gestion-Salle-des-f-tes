import React, { useState, useEffect } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../utils';

import Dashboard from '../../pages/Dashboard';
import CalendarPage from '../../pages/CalendarPage';
import ReservationsPage from '../../pages/ReservationsPage';
import ClientsPage from '../../pages/ClientsPage';
import PaymentsPage from '../../pages/PaymentsPage';
import EmployeesPage from '../../pages/EmployeesPage';
import PacksPage from '../../pages/PacksPage';
import CateringPage from '../../pages/CateringPage';
import ExpensesPage from '../../pages/ExpensesPage';
import FinancePage from '../../pages/FinancePage';
import StatsPage from '../../pages/StatsPage';
import ReceiptsPage from '../../pages/ReceiptsPage';
import SettingsPage from '../../pages/SettingsPage';

import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Tableau de bord', section: 'Principal' },
  { id: 'calendar', icon: '📅', label: 'Calendrier', section: null },

  { id: 'reservations', icon: '🎉', label: 'Réservations', section: 'Gestion' },
  { id: 'clients', icon: '👥', label: 'Clients', section: null },
  { id: 'payments', icon: '💳', label: 'Paiements', section: null },
  { id: 'employees', icon: '👔', label: 'Employés', section: null },
  { id: 'packs', icon: '📦', label: 'Packs', section: null },

  { id: 'catering', icon: '🍽', label: 'Catering', section: 'Finances' },
  { id: 'expenses', icon: '📉', label: 'Dépenses de la salle', section: null },
  { id: 'finance', icon: '📈', label: 'Finances', section: null },
  { id: 'stats', icon: '📋', label: 'Statistiques', section: null },

  { id: 'receipts', icon: '🧾', label: 'Reçus & Factures', section: 'Système' },
  { id: 'settings', icon: '⚙️', label: 'Paramètres', section: null },
];

const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  calendar: CalendarPage,
  reservations: ReservationsPage,
  clients: ClientsPage,
  payments: PaymentsPage,
  employees: EmployeesPage,
  packs: PacksPage,
  catering: CateringPage,
  expenses: ExpensesPage,
  finance: FinancePage,
  stats: StatsPage,
  receipts: ReceiptsPage,
  settings: SettingsPage,
};

export default function Layout() {
  const [activePage, setActivePage] = useState('dashboard');

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('festiva-theme') !== 'light';
  });

  const { user, logout } = useAuthStore();
  const { settings } = useAppStore();

  const today = new Date();

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light');
      localStorage.setItem('festiva-theme', 'dark');
    } else {
      document.body.classList.add('light');
      localStorage.setItem('festiva-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    toast.success('Déconnexion réussie');
  };

  const handleBackup = async () => {
    const res = await api.backup.export();

    if (res.success) {
      toast.success('Sauvegarde exportée');
    } else {
      toast.error(res.error || 'Erreur sauvegarde');
    }
  };

  const PageComponent = PAGE_COMPONENTS[activePage] || Dashboard;

  const pageLabel =
    NAV_ITEMS.find(item => item.id === activePage)?.label ||
    'Tableau de bord';

  const sectionSeen = new Set();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏛</span>

          <div>
            <div className="logo-name">
              {settings.nom_salle || 'Ma Salle'}
            </div>

            <div className="logo-sub">
              Gestion Salle des Fêtes
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const showSection =
              item.section && !sectionSeen.has(item.section);

            if (item.section) {
              sectionSeen.add(item.section);
            }

            return (
              <React.Fragment key={item.id}>
                {showSection && (
                  <div className="nav-section">
                    {item.section}
                  </div>
                )}

                <button
                  className={`nav-item ${
                    activePage === item.id ? 'active' : ''
                  }`}
                  onClick={() => setActivePage(item.id)}
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(user?.nom || 'A')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="user-details">
              <div className="user-name">
                {user?.nom || 'Administrateur'}
              </div>

              <div className="user-role">
                {user?.role || 'admin'}
              </div>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Déconnexion"
          >
            ⏻
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <h1 className="page-title">
            {pageLabel}
          </h1>

          <div className="topbar-actions">
            <span className="topbar-date">
              {today.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>

            {/* <span className="status-badge">
              ● Hors ligne (local)
            </span> */}

            <button
              onClick={toggleTheme}
              title={
                isDark
                  ? 'Passer en mode clair'
                  : 'Passer en mode sombre'
              }
              style={{
                background: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(79,70,229,0.1)',
                border: `1px solid ${
                  isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(79,70,229,0.2)'
                }`,
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 13,
                color: isDark
                  ? '#e2e8f0'
                  : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {isDark
                ? '☀️ Clair'
                : '🌙 Sombre'}
            </button>

            {/* <button
              className="btn btn-ghost btn-sm"
              onClick={handleBackup}
            >
              💾 Sauvegarder
            </button> */}
          </div>
        </header>

        <main className="page-content">
          <PageComponent
            onNavigate={setActivePage}
          />
        </main>
      </div>
    </div>
  );
}