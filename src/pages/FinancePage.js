import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { api, formatDA, MONTHS_FR } from '../utils';
import { useAppStore } from '../store';
import toast from 'react-hot-toast';
import { formatDate } from '../utils';

// ===================== FINANCE =====================
export function FinancePage() {
  const [annual, setAnnual] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  

  useEffect(() => {
    const load = async () => {
      const [aRes, mRes] = await Promise.all([api.finance.getAnnualSummary(year), api.finance.getMonthlySummary(year)]);
      if (aRes.success) setAnnual(aRes.data);
      if (mRes.success) setMonthly(mRes.data);
    };
    load();
  }, [year]);

  const chartData = monthly.map(d => ({
    name: MONTHS_FR[d.mois].slice(0,3),
    revenus: Math.round((d.revenus||0)/1000),
    depenses: Math.round((d.depenses||0)/1000),
    profit: Math.round((d.profit||0)/1000),
  }));

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div></div>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-label">Revenus {year}</div><div className="kpi-value">{formatDA(annual?.revenus)}</div></div>
        <div className="kpi-card red"><div className="kpi-label">Dépenses {year}</div><div className="kpi-value">{formatDA(annual?.depenses)}</div></div>
        <div className="kpi-card accent"><div className="kpi-label">Profit {year}</div><div className="kpi-value">{formatDA(annual?.profit)}</div></div>
        <div className="kpi-card blue"><div className="kpi-label">Réservations</div><div className="kpi-value">{annual?.nb_reservations || 0}</div></div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>Bilan mensuel {year}</h3><span className="chip">en milliers DA</span></div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e2538', border: '1px solid #2d3748', borderRadius: 8 }} formatter={v => [`${v}k DA`]} />
            <Bar dataKey="revenus" fill="#6366f1" radius={[3,3,0,0]} name="Revenus" />
            <Bar dataKey="depenses" fill="#ef4444" radius={[3,3,0,0]} name="Dépenses" opacity={0.7} />
            <Bar dataKey="profit" fill="#10b981" radius={[3,3,0,0]} name="Profit" opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Tableau mensuel détaillé</h3>
        <table className="data-table">
          <thead><tr><th>Mois</th><th>Revenus</th><th>Dépenses</th><th>Profit</th><th>Réservations</th><th>Marge</th></tr></thead>
          <tbody>
            {monthly.map(d => (
              <tr key={d.mois}>
                <td className="fw-bold">{MONTHS_FR[d.mois]}</td>
                <td className="text-green fw-bold">{formatDA(d.revenus)}</td>
                <td className="text-red">{formatDA(d.depenses)}</td>
                <td className="text-green fw-bold">{formatDA(d.profit)}</td>
                <td className="text-accent">{d.nb_reservations}</td>
                <td>{d.revenus > 0 ? Math.round((d.profit/d.revenus)*100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

// ===================== STATS =====================
export function StatsPage() {
  const [stats, setStats] = useState(null);
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

  useEffect(() => {
    api.finance.getStats().then(r => { if (r.success) setStats(r.data); });
  }, []);

  const pieData = stats?.byType?.map(t => ({ name: t.type_fete, value: t.count })) || [];

  return (
    <div className="page-container">
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Réservations par type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e2538', border: '1px solid #2d3748', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Clients les plus fidèles</h3>
          <table className="data-table">
            <thead><tr><th>Client</th><th>Réservations</th><th>Total DA</th></tr></thead>
            <tbody>
              {(stats?.topClients || []).map((c, i) => (
                <tr key={i}>
                  <td className="fw-bold">{c.nom}</td>
                  <td className="text-accent">{c.nb}</td>
                  <td className="text-green fw-bold">{formatDA(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===================== CATERING =====================
export function CateringPage() {
  const [reservations, setReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ reservation_id: '', nom_menu: 'Menu Royal', type_repas: 'Complet', nombre_personnes: '', prix_par_personne: '', plats: '', boissons: '', desserts: '', notes: '' });
  const { settings } = useAppStore();

  useEffect(() => {
    api.reservations.getAll().then(r => { if (r.success) setReservations(r.data.filter(r => r.statut !== 'cancelled')); });
  }, []);

  const total = (Number(form.nombre_personnes) || 0) * (Number(form.prix_par_personne) || 0);

  const handlePrint = () => {
    const res = reservations.find(r => r.id === Number(form.reservation_id));
    api.pdf.generateCateringSheet({ ...form, client_nom: res?.client_nom || '', type_fete: res?.type_fete || '', date_evenement: res?.date_evenement || '', nom_salle: settings.nom_salle }).then(r => {
      if (r.success && r.html) {
        const w = window.open('', '_blank');
        w.document.write(r.html);
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <h3>Gestion Catering / Traiteur</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouveau catering</button>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Saisie catering</h3>
          <div className="form-group"><label>Réservation</label>
            <select className="input" value={form.reservation_id} onChange={e => setForm({...form, reservation_id: e.target.value})}>
              <option value="">Sélectionner une réservation...</option>
              {reservations.map(r => <option key={r.id} value={r.id}>{r.client_nom} — {r.type_fete} ({r.date_evenement})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Nom du menu</label><input className="input" value={form.nom_menu} onChange={e => setForm({...form, nom_menu: e.target.value})} /></div>
          <div className="form-grid-2">
            <div className="form-group"><label>Nombre de personnes</label><input className="input" type="number" value={form.nombre_personnes} onChange={e => setForm({...form, nombre_personnes: e.target.value})} /></div>
            <div className="form-group"><label>Prix/personne (DA)</label><input className="input" type="number" value={form.prix_par_personne} onChange={e => setForm({...form, prix_par_personne: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Plats (séparés par virgule)</label><textarea className="input" rows="2" value={form.plats} onChange={e => setForm({...form, plats: e.target.value})} placeholder="Couscous, Poulet rôti, Salade..." /></div>
          <div className="form-group"><label>Boissons</label><input className="input" value={form.boissons} onChange={e => setForm({...form, boissons: e.target.value})} placeholder="Jus, Eau, Café..." /></div>
          <div className="form-group"><label>Desserts</label><input className="input" value={form.desserts} onChange={e => setForm({...form, desserts: e.target.value})} placeholder="Gâteaux, Fruits..." /></div>
          <div className="form-group"><label>Notes spéciales</label><input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Tables VIP, régimes alimentaires..." /></div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total catering:</span>
              <span style={{ color: '#10b981' }}>{formatDA(total)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => toast.success('Catering enregistré')}>✅ Enregistrer</button>
            <button className="btn btn-ghost" onClick={handlePrint}>🖨 Fiche cuisine</button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Aperçu fiche cuisine</h3>
          <div style={{ background: '#fff', color: '#1a1a1a', borderRadius: 10, padding: 20, fontSize: 13 }}>
            <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #6366f1', paddingBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1' }}>🍽 FICHE CUISINE</div>
              <div style={{ fontSize: 12, color: '#666' }}>{settings.nom_salle}</div>
            </div>
            {form.reservation_id && (
              <div>
                <div style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                  <div><b>Menu:</b> {form.nom_menu}</div>
                  <div><b>Personnes:</b> {form.nombre_personnes}</div>
                </div>
                {form.plats && <div><b>Plats:</b><ul style={{ paddingLeft: 20, lineHeight: 2 }}>{form.plats.split(',').map((p,i) => <li key={i}>{p.trim()}</li>)}</ul></div>}
                {form.boissons && <div><b>Boissons:</b> {form.boissons}</div>}
                {form.desserts && <div><b>Desserts:</b> {form.desserts}</div>}
                {form.notes && <div style={{ marginTop: 8, padding: 8, background: '#fff3cd', borderRadius: 6 }}><b>⚠️ Notes:</b> {form.notes}</div>}
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15, color: '#6366f1' }}>Total: {formatDA(total)}</div>
              </div>
            )}
            {!form.reservation_id && <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>Sélectionnez une réservation...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== RECEIPTS =====================
export function ReceiptsPage() {
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);
  const { settings } = useAppStore();

  useEffect(() => {
    api.reservations.getAll().then(r => { if (r.success) setReservations(r.data); });
  }, []);

  const handlePrint = async () => {
    if (!selected) { toast.error('Sélectionnez une réservation'); return; }
    const res = await api.pdf.generateReceipt({ ...selected, nom_salle: settings.nom_salle, adresse: settings.adresse, telephone: settings.telephone, numero: `${new Date().getFullYear()}-${String(selected.id).padStart(3,'0')}` });
    if (res.success && res.html) {
      const w = window.open('', '_blank');
      w.document.write(res.html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Sélectionner une réservation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
            {reservations.map(r => (
              <div key={r.id} className={`event-item ${selected?.id === r.id ? 'selected' : ''}`} style={{ cursor: 'pointer', border: selected?.id === r.id ? '1px solid #6366f1' : '1px solid transparent', borderRadius: 10, padding: 12 }} onClick={() => setSelected(r)}>
                <div className="fw-bold">{r.client_nom} — {r.type_fete}</div>
                <div style={{ fontSize: 12, color: '#718096' }}>{r.date_evenement} · {r.salle}</div>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, marginTop: 4 }}>{formatDA(r.prix_total)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Aperçu reçu</h3>
          <div style={{ background: '#fff', color: '#1a1a1a', borderRadius: 10, padding: 24, fontSize: 12 }}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #6366f1', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>🏛 {settings.nom_salle || 'Ma Salle'}</div>
              <div style={{ color: '#666' }}>{settings.adresse || ''}</div>
              <div style={{ color: '#666' }}>{settings.telephone || ''}</div>
            </div>
            {selected ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span><b>REÇU N° {new Date().getFullYear()}-{String(selected.id).padStart(3,'0')}</b></span>
                  <span>{new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                  <div><b>Client:</b> {selected.client_nom}</div>
                  <div><b>Tél:</b> {selected.client_tel || '—'}</div>
                  <div><b>Événement:</b> {selected.type_fete}</div>
                  <div><b>Date:</b> {formatDate(selected.date_evenement)}</div>
                  {/* <div><b>Invités:</b> {selected.nombre_invites} invités</div> */}
                  <div><b>Invités:</b> {selected.nombre_invites} invités</div>
                  <div><b>Période:</b> {selected.periode === 'Matin' ? '🌅 Matin' : selected.periode === 'Journée complète' ? '☀️ Journée complète' : '🌙 Soir'}</div>
                  <div><b>Horaire:</b> {selected.heure_debut} → {selected.heure_fin}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <tr style={{ background: '#f0f0f0' }}><th style={{ padding: 8, textAlign: 'left' }}>Description</th><th style={{ padding: 8, textAlign: 'right' }}>Montant</th></tr>
                  <tr><td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{selected.type_fete}</td><td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee' }}>{formatDA(selected.prix_total)}</td></tr>
                  <tr><td style={{ padding: 8, borderBottom: '1px solid #eee' }}>Avance versée</td><td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee', color: 'green' }}>{formatDA(selected.avance)}</td></tr>
                  <tr style={{ fontWeight: 700, fontSize: 14 }}><td style={{ padding: 8 }}>RESTE À PAYER</td><td style={{ padding: 8, textAlign: 'right', color: '#6366f1' }}>{formatDA((selected.prix_total||0)-(selected.avance||0))}</td></tr>
                </table>
                {/* <div style={{ textAlign: 'center', color: '#6366f1', fontStyle: 'italic' }}>Merci pour votre confiance</div> */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd', fontSize: 11 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Signature client</div>
                    <div style={{ borderBottom: '1px solid #999', marginTop: 32 }}></div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Cachet & Signature {settings?.nom_salle || 'Salle'}</div>
                    <div style={{ borderBottom: '1px solid #999', marginTop: 32 }}></div>
                  </div>
                </div>
              </div>
            ) : <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>Sélectionnez une réservation pour prévisualiser le reçu</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>🖨 Imprimer reçu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== SETTINGS =====================
export function SettingsPage() {
  const { settings, setSettings } = useAppStore();

  const [form, setForm] = useState({ ...settings });
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const [pdfNom, setPdfNom] = useState(
    localStorage.getItem('festiva-modalites-nom') || ''
  );

  const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // Libellé période (Tous les mois / Mois précis)
  const periodeLabel = exportMonth === 'all' ? `Année ${exportYear}` : `${MOIS[exportMonth]} ${exportYear}`;

  const handleSave = async () => {
    const res = await api.settings.update(form);
    if (res.success) { setSettings(form); toast.success('Paramètres sauvegardés'); }
    else toast.error(res.error);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [resRes, clientsRes, settingsRes] = await Promise.all([
        api.reservations.getAll(),
        api.clients.getAll(),
        api.settings.get(),
      ]);

      const reservations = resRes.success ? resRes.data.filter(r => {
        const d = new Date(r.date_evenement);
        const matchMonth = exportMonth === 'all' || (d.getMonth() + 1 === Number(exportMonth));
        return matchMonth && d.getFullYear() === exportYear;
      }) : [];

      const clientIds = new Set(reservations.map(r => r.client_id));
      const clients = clientsRes.success ? clientsRes.data.filter(c => clientIds.has(c.id)) : [];
      const salle = settingsRes.success ? (settingsRes.data.nom_salle || 'Ma Salle') : '';
      const adresse = settingsRes.success ? (settingsRes.data.adresse || '') : '';
      const telephone = settingsRes.success ? (settingsRes.data.telephone || '') : '';

      const totalRevenu = reservations.reduce((s, r) => s + (r.prix_total || 0), 0);
      const totalPaye = reservations.reduce((s, r) => s + (r.total_paye || 0), 0);
      const totalReste = totalRevenu - totalPaye;

      const formatDA_local = (n) => Number(n || 0).toLocaleString('fr-DZ') + ' DA';
      const formatDate_local = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

      const statusColor = (s) => s === 'confirmed' ? '#059669' : s === 'pending' ? '#d97706' : s === 'done' ? '#4f46e5' : '#dc2626';
      const statusLabel = (s) => s === 'confirmed' ? 'Confirmée' : s === 'pending' ? 'En attente' : s === 'done' ? 'Terminée' : 'Annulée';

      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Ma Salle — ${periodeLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left h1 { font-size: 22px; color: #4f46e5; font-weight: 800; }
    .header-left p { color: #6b7280; font-size: 12px; margin-top: 4px; }
    .header-right { text-align: right; color: #6b7280; font-size: 12px; }
    .header-right strong { font-size: 15px; color: #111; display: block; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { background: #f4f6fb; border-radius: 10px; padding: 12px 16px; border-left: 4px solid #4f46e5; }
    .kpi.green { border-left-color: #059669; }
    .kpi.amber { border-left-color: #d97706; }
    .kpi.red { border-left-color: #dc2626; }
    .kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .kpi-value { font-size: 16px; font-weight: 800; color: #111; }
    .section-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #4f46e5; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .num { text-align: right; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🏛 ${salle}</h1>
      <p>${adresse}${telephone ? ' · Tél : ' + telephone : ''}</p>
    </div>
    <div class="header-right">
      <strong>Rapport — ${periodeLabel}</strong>
      Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Réservations</div><div class="kpi-value">${reservations.length}</div></div>
    <div class="kpi green"><div class="kpi-label">Revenu total</div><div class="kpi-value">${formatDA_local(totalRevenu)}</div></div>
    <div class="kpi"><div class="kpi-label">Total encaissé</div><div class="kpi-value">${formatDA_local(totalPaye)}</div></div>
    <div class="kpi amber"><div class="kpi-label">Reste à encaisser</div><div class="kpi-value">${formatDA_local(totalReste)}</div></div>
  </div>

  <div class="section-title">👥 Clients (${clients.length})</div>
  <table>
    <thead><tr><th>#</th><th>Nom</th><th>Téléphone</th><th>Adresse</th><th>Réservations</th></tr></thead>
    <tbody>
      ${clients.map((c, i) => {
        const nb = reservations.filter(r => r.client_id === c.id).length;
        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${c.nom}</strong></td>
          <td>${c.telephone || '—'}</td>
          <td>${c.adresse || '—'}</td>
          <td style="text-align:center"><strong>${nb}</strong></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="section-title">🎉 Réservations (${reservations.length})</div>
  <table>
    <thead>
      <tr>
        <th>N°</th><th>Client</th><th>Type</th><th>Date</th><th>Salle</th><th>Période</th>
        <th style="text-align:right">Invités</th><th style="text-align:right">Prix Total</th>
        <th style="text-align:right">Payé</th><th style="text-align:right">Reste</th><th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${reservations.map(r => {
        const reste = r.prix_total - (r.total_paye || 0);
        return `<tr>
          <td>R${String(r.id).padStart(3,'0')}</td>
          <td><strong>${r.client_nom}</strong></td>
          <td>${r.type_fete}</td>
          <td>${formatDate_local(r.date_evenement)}</td>
          <td>${r.salle}</td>
          <td>${r.periode || 'Soir'}</td>
          <td class="num">${r.nombre_invites || 0}</td>
          <td class="num">${formatDA_local(r.prix_total)}</td>
          <td class="num" style="color:#059669">${formatDA_local(r.total_paye)}</td>
          <td class="num" style="color:${reste > 0 ? '#d97706' : '#059669'}">${formatDA_local(reste)}</td>
          <td><span class="badge" style="background:${statusColor(r.statut)}22;color:${statusColor(r.statut)}">${statusLabel(r.statut)}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    Logiciel de gestion salle des fêtes · Made in Algeria 🇩🇿
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();

      toast.success(`PDF ${periodeLabel} — ${reservations.length} réservations, ${clients.length} clients`);
    } catch(e) {
      toast.error("Erreur lors de l'export");
    }
    setExporting(false);
  };

  return (
    <div className="page-container">
      <div className="settings-grid">
        {/* Colonne gauche — Infos salle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Informations de la salle</h3>
            <div className="form-group"><label>Nom de la salle</label><input className="input" value={form.nom_salle||''} onChange={e => setForm({...form, nom_salle: e.target.value})} /></div>
            <div className="form-group"><label>Téléphone</label><input className="input" value={form.telephone||''} onChange={e => setForm({...form, telephone: e.target.value})} /></div>
            <div className="form-group"><label>Adresse</label><input className="input" value={form.adresse||''} onChange={e => setForm({...form, adresse: e.target.value})} /></div>
            <button className="btn btn-primary" onClick={handleSave}>💾 Sauvegarder</button>
          </div>
        </div>

        {/* Colonne droite — Export */}
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>📤 Exporter les données</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Exporte les réservations et les clients de la période sélectionnée en fichier PDF.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Mois</label>
              <select className="input" value={exportMonth} onChange={e => setExportMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                <option value="all">Tous les mois</option>
                {MOIS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 100, marginBottom: 0 }}>
              <label>Année</label>
              <select className="input" value={exportYear} onChange={e => setExportYear(Number(e.target.value))}>
                {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Le fichier contiendra :</div>
            <div style={{ color: 'var(--muted)', lineHeight: 2 }}>
              ✅ Liste des clients ayant une réservation sur la période<br/>
              ✅ Toutes les réservations (date, type, salle, période, invités)<br/>
              ✅ Montants : prix total, payé, reste à payer<br/>
              ✅ Statut de chaque réservation
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ width: '100%', justifyContent: 'center' }}>
            {exporting ? '⌛ Export en cours...' : `📥 Exporter ${periodeLabel}`}
          </button>
        </div>

        {/* Modalités de la salle */}
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>📄 Modalités de la salle</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Importez un PDF des modalités pour pouvoir l'imprimer depuis l'application.
          </p>

          <input type="file" accept=".pdf" id="pdf-modalites"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                localStorage.setItem('festiva-modalites-pdf', reader.result);
                localStorage.setItem('festiva-modalites-nom', file.name);
                toast.success('PDF importé : ' + file.name);
                setPdfNom(file.name);
              };
              reader.readAsDataURL(file);
            }}
          />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => document.getElementById('pdf-modalites').click()}>
              📂 Importer un PDF
            </button>
            {pdfNom && (
              <>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>📄 {pdfNom}</span>
                <button className="btn btn-primary" onClick={() => {
                  const data = localStorage.getItem('festiva-modalites-pdf');
                  if (!data) return;
                  const win = window.open('');
                  win.document.write(`<iframe src="${data}" width="100%" height="100%" style="border:none"></iframe>`);
                  win.document.close();
                  setTimeout(() => win.print(), 500);
                }}>
                  🖨 Imprimer
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => {
                  localStorage.removeItem('festiva-modalites-pdf');
                  localStorage.removeItem('festiva-modalites-nom');
                  setPdfNom('');
                  toast.success('PDF supprimé');
                }}>🗑</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ===================== CALENDAR =====================
export function CalendarPage() {
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.reservations.getAll().then(r => { if (r.success) setReservations(r.data); });
  }, []);

  const STATUS_COLORS = { confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', done: '#6366f1' };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getResForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return reservations.filter(r => r.date_evenement === dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div className="filter-tabs">
          {['Mois','Semaine','Jour'].map(v => <button key={v} className={`tab ${view === v.toLowerCase() ? 'active' : ''}`} onClick={() => setView(v.toLowerCase())}>{v}</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date(year, month-1, 1))}>◀</button>
          <span style={{ fontWeight: 700, minWidth: 160, textAlign: 'center' }}>{MOIS[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date(year, month+1, 1))}>▶</button>
        </div>
      </div>
      <div className="card">
        <div className="calendar-header">
          {JOURS.map(j => <div key={j} className="cal-dow">{j}</div>)}
        </div>
        <div className="calendar-grid">
          {days.map((day, i) => {
            const events = day ? getResForDay(day) : [];
            const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={i} className={`cal-cell ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}>
                {day && <span className="cal-day-num">{day}</span>}
                {events.map(e => (
                  <div key={e.id} className="cal-event" style={{ background: STATUS_COLORS[e.statut] + '33', color: STATUS_COLORS[e.statut], borderLeft: `3px solid ${STATUS_COLORS[e.statut]}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{e.client_nom}</div>
                    <div style={{ fontSize: 10 }}>{e.type_fete}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===================== LOGIN =====================


export function LoginPage() {
  const { login } = require('../store').useAuthStore();
  const [form, setForm] = useState({ email: 'admin', password: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nomSalle, setNomSalle] = useState('');

  useEffect(() => {
    api.settings.get().then(res => {
      if (res.success && res.data.nom_salle) setNomSalle(res.data.nom_salle);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await api.auth.login(form);
    if (res.success) { login(res.user); toast.success('Bienvenue !'); }
    else setError(res.error || 'Erreur de connexion');
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏛</div>
        <h1 className="login-title">{nomSalle || 'Ma Salle'}</h1>
        <p className="login-subtitle">Gestion Salle des Fêtes</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Identifiant</label><input className="input" type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div className="form-group"><label>Mot de passe</label><input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>{loading ? 'Connexion...' : '🔐 Se connecter'}</button>
        </form>
      </div>
    </div>
  );
}

export default FinancePage;
