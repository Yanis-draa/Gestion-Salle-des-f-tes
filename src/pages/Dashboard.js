import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { api, formatDA, MONTHS_FR } from '../utils';
import toast from 'react-hot-toast';

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [todayRes, setTodayRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, monthRes, dayRes] = await Promise.all([
          api.finance.getSummary(m, y),
          api.finance.getMonthlySummary(y),
          api.reservations.getByDate(today),
        ]);
        if (sumRes.success) setSummary(sumRes.data);
        if (monthRes.success) setMonthlyData(monthRes.data.map(d => ({
          name: MONTHS_FR[d.mois].slice(0, 3),
          revenus: Math.round(d.revenus / 1000),
          depenses: Math.round(d.depenses / 1000),
          profit: Math.round(d.profit / 1000),
        })));
        if (dayRes.success) setTodayRes(dayRes.data);
      } catch (e) { toast.error('Erreur chargement'); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading-page">Chargement...</div>;

  const STATUS_COLORS = { confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', done: '#6366f1' };
  const STATUS_LABELS = { confirmed: 'Confirmée', pending: 'En attente', cancelled: 'Annulée', done: 'Terminée' };

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-label">Revenus du mois</div>
          <div className="kpi-value">{formatDA(summary?.revenus)}</div>
          <div className="kpi-sub">{MONTHS_FR[m]} {y}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Dépenses du mois</div>
          <div className="kpi-value">{formatDA(summary?.depenses)}</div>
          <div className="kpi-sub">Toutes catégories</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label">Profit net</div>
          <div className="kpi-value">{formatDA(summary?.profit)}</div>
          <div className="kpi-sub">Marge: {summary?.revenus ? Math.round((summary.profit / summary.revenus) * 100) : 0}%</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Réservations</div>
          <div className="kpi-value">{summary?.nb_reservations || 0}</div>
          <div className="kpi-sub">Ce mois-ci</div>
        </div>
      </div>

      {/* Charts + Today */}
      <div className="dashboard-grid">
        {/* Revenue chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Évolution financière {y}</h3>
            <span className="chip">en milliers DA</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e2538', border: '1px solid #2d3748', borderRadius: 8 }} formatter={(v) => [`${v}k DA`]} />
              <Bar dataKey="revenus" fill="#6366f1" radius={[3, 3, 0, 0]} name="Revenus" />
              <Bar dataKey="depenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Dépenses" opacity={0.7} />
              <Bar dataKey="profit" fill="#10b981" radius={[3, 3, 0, 0]} name="Profit" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's reservations */}
        <div className="card">
          <div className="card-header">
            <h3>Événements aujourd'hui</h3>
            <button className="btn-link" onClick={() => onNavigate('reservations')}>Voir tout →</button>
          </div>
          {todayRes.length === 0 ? (
            <div className="empty-state">Aucun événement aujourd'hui</div>
          ) : (
            <div className="event-list">
              {todayRes.map(r => (
                <div key={r.id} className="event-item">
                  <div className="event-line" style={{ background: STATUS_COLORS[r.statut] }}></div>
                  <div className="event-info">
                    <div className="event-name">{r.client_nom} — {r.type_fete}</div>
                    <div className="event-meta">{r.heure_debut} · {r.nombre_invites} invités · {r.salle}</div>
                    <span className={`status-badge status-${r.statut}`}>{STATUS_LABELS[r.statut]}</span>
                  </div>
                  <div className="event-amount">
                    <div className="amount-total">{formatDA(r.prix_total)}</div>
                    <div className="amount-rest" style={{ color: '#f59e0b' }}>Reste: {formatDA(r.prix_total - (r.total_paye || 0))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <h3>Accès rapide</h3>
        <div className="action-grid">
          {[
            { icon: '🎉', label: 'Nouvelle réservation', page: 'reservations' },
            { icon: '👥', label: 'Ajouter client', page: 'clients' },
            { icon: '💳', label: 'Enregistrer paiement', page: 'payments' },
            { icon: '📉', label: 'Ajouter dépense', page: 'expenses' },
            { icon: '🧾', label: 'Générer reçu', page: 'receipts' },
            { icon: '📅', label: 'Voir calendrier', page: 'calendar' },
          ].map(a => (
            <button key={a.page} className="action-btn" onClick={() => onNavigate(a.page)}>
              <span className="action-icon">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
