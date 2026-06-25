import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA, formatDate, getInitials, EMPLOYEE_TYPES } from '../utils';
import toast from 'react-hot-toast';

const GRADES = ['Standard', 'Senior', 'Expert', 'Manager'];
const POSTE_COLORS = {
  'Serveur': '#6366f1', 'DJ': '#ec4899', 'Cuisinier': '#f59e0b',
  'Nettoyage': '#14b8a6', 'Décoration': '#8b5cf6', 'Sécurité': '#ef4444',
  'Photographe': '#3b82f6', 'Manager': '#10b981', 'Autres': '#64748b',
};

// ─── CONFIRM MODAL ────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 className="modal-title">⚠️ Confirmation</h3>
        <p style={{ margin: '12px 0 24px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE SELECTOR MODAL ──────────────────────────────────
function EmployeeSelectorModal({ reservation, onClose }) {
  const [allEmployees, setAllEmployees] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [search, setSearch] = useState('');
  const [filterPoste, setFilterPoste] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    const [allRes, assignedRes] = await Promise.all([
      api.employees.getAll(),
      api.employees.getByReservation(reservation.id),
    ]);
    if (allRes.success) setAllEmployees(allRes.data);
    if (assignedRes.success) setAssigned(assignedRes.data);
    setLoading(false);
  }, [reservation.id]);

  useEffect(() => { load(); }, [load]);

  const isAssigned = (id) => assigned.some(a => a.id === id);

  const handleToggle = async (emp) => {
    setSaving(emp.id);
    if (isAssigned(emp.id)) {
      const res = await api.employees.removeFromReservation(emp.id, reservation.id);
      if (res.success) { toast.success(`${emp.nom} retiré`); await load(); }
      else toast.error(res.error);
    } else {
      const res = await api.employees.assignToReservation({
        reservation_id: reservation.id,
        employee_id: emp.id,
        role: emp.poste,
        cout: emp.prix_par_jour,
      });
      if (res.success) { toast.success(`${emp.nom} affecté`); await load(); }
      else toast.error(res.error);
    }
    setSaving(null);
  };

  const postes = [...new Set(allEmployees.map(e => e.poste))];
  const filtered = allEmployees.filter(e => {
    const matchSearch = !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.poste.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterPoste === 'all' || e.poste === filterPoste);
  });

  const totalCout = assigned.reduce((s, e) => s + (e.cout || e.prix_par_jour || 0), 0);
  const byPoste = assigned.reduce((acc, e) => { if (!acc[e.poste]) acc[e.poste] = []; acc[e.poste].push(e); return acc; }, {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 className="modal-title" style={{ margin: 0 }}>👔 Équipe — {reservation.client_nom}</h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {reservation.type_fete} · {formatDate(reservation.date_evenement)} · {reservation.salle}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Fermer</button>
        </div>

        {/* Équipe actuelle */}
        {assigned.length > 0 && (
          <div style={{ background: '#ffffff08', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              ÉQUIPE AFFECTÉE ({assigned.length} employé{assigned.length > 1 ? 's' : ''})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {Object.entries(byPoste).map(([poste, emps]) => (
                <div key={poste} style={{ background: (POSTE_COLORS[poste] || '#6366f1') + '22', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>
                  <span style={{ color: POSTE_COLORS[poste] || '#6366f1', fontWeight: 600 }}>{emps.length}×</span>
                  <span style={{ marginLeft: 4 }}>{poste}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 14 }}>
                Coût total : {formatDA(totalCout)}
              </span>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="search-input" style={{ flex: 1 }} placeholder="🔍 Chercher un employé..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" style={{ width: 'auto' }} value={filterPoste} onChange={e => setFilterPoste(e.target.value)}>
            <option value="all">Tous les postes</option>
            {postes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div className="empty-state">Chargement...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(emp => {
                const isAss = isAssigned(emp.id);
                const color = POSTE_COLORS[emp.poste] || '#6366f1';
                const isSaving = saving === emp.id;
                return (
                  <div key={emp.id} onClick={() => !isSaving && handleToggle(emp)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderRadius: 12, cursor: isSaving ? 'wait' : 'pointer',
                      border: `2px solid ${isAss ? color : '#ffffff11'}`,
                      background: isAss ? color + '11' : '#ffffff05',
                      transition: 'all 0.15s', opacity: isSaving ? 0.6 : 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '22', color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(emp.nom)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nom}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{emp.poste} · {formatDA(emp.prix_par_jour)}/j</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {!emp.disponible && <span style={{ fontSize: 10, color: '#ef4444', background: '#ef444422', borderRadius: 4, padding: '2px 5px' }}>Occupé</span>}
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: isAss ? color : '#ffffff11',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {isSaving ? '⌛' : isAss ? '✓' : '+'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length === 0 && !loading && <div className="empty-state">Aucun employé trouvé</div>}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onClose}>
            ✅ Valider ({assigned.length} employé{assigned.length > 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AFFECTATIONS TAB ─────────────────────────────────────────
function AffectationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [configRes, setConfigRes] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.reservations.getAll().then(res => {
      if (res.success) setReservations(res.data.filter(r => r.statut !== 'cancelled'));
      setLoading(false);
    });
  }, [refreshKey]);

  const filtered = reservations.filter(r =>
    !search ||
    r.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.type_fete?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input className="search-input" style={{ width: 280 }}
          placeholder="🔍 Rechercher une réservation par client"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Type</th>
              <th>Date</th>
              {/* <th>Salle</th> */}
              <th>Invités</th>
              <th>Équipe</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-page">Chargement...</div></td></tr>
            ) : filtered.map(r => (
              <ReservationEmployeeRow
                key={`${r.id}-${refreshKey}`}
                reservation={r}
                onConfigure={() => setConfigRes(r)}
                onDeleted={() => setRefreshKey(k => k + 1)}  // ← ajouté
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && <div className="empty-state">Aucune réservation trouvée</div>}
      </div>

      {configRes && (
        <EmployeeSelectorModal
          reservation={configRes}
          onClose={() => { setConfigRes(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

// ─── LIGNE RÉSERVATION avec nb employés ───────────────────────
// ─── LIGNE RÉSERVATION avec nb employés ───────────────────────
function ReservationEmployeeRow({ reservation, onConfigure, onDeleted }) {
  const [assigned, setAssigned] = useState([]);

  useEffect(() => {
    api.employees.getByReservation(reservation.id).then(res => {
      if (res.success) setAssigned(res.data);
    });
  }, [reservation.id]);

  const handleDeleteAll = async () => {
    // Supprimer tous les employés affectés à cette réservation
    await Promise.all(
      assigned.map(emp => api.employees.removeFromReservation(emp.id, reservation.id))
    );
    toast.success('Équipe retirée');
    setAssigned([]);
    if (onDeleted) onDeleted();
  };

  const byPoste = assigned.reduce((acc, e) => { if (!acc[e.poste]) acc[e.poste] = []; acc[e.poste].push(e); return acc; }, {});

  return (
    <tr>
      <td className="fw-bold">{reservation.client_nom}</td>
      <td><span className="chip">{reservation.type_fete}</span></td>
      <td className="text-muted">{formatDate(reservation.date_evenement)}</td>
      {/* <td className="text-muted">{reservation.salle}</td> */}
      <td>{reservation.nombre_invites}</td>
      <td>
        {assigned.length === 0 ? (
          <span style={{ color: '#64748b', fontSize: 12 }}>— Non configuré</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(byPoste).map(([poste, emps]) => (
              <span key={poste} style={{
                background: (POSTE_COLORS[poste] || '#6366f1') + '22',
                color: POSTE_COLORS[poste] || '#6366f1',
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600
              }}>
                {emps.length}× {poste}
              </span>
            ))}
          </div>
        )}
      </td>
      <td>
        <span className={`status-badge status-${reservation.statut}`}>
          {reservation.statut === 'confirmed' ? 'Confirmée' : reservation.statut === 'pending' ? 'En attente' : 'Terminée'}
        </span>
      </td>
      <td>
        <div className="action-buttons">
          {assigned.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑 Supprimer</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onConfigure}>
            {assigned.length > 0 ? '✏ Modifier équipe' : '+ Configurer'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── EMPLOYEE FORM MODAL ──────────────────────────────────────
function EmployeeFormModal({ editData, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: '', telephone: '', adresse: '', poste: 'Serveur',
    grade: 'Standard', prix_par_jour: '', disponible: true,
    date_recrutement: '', notes: ''
  });

  useEffect(() => {
    if (editData) setForm({ ...editData, disponible: !!editData.disponible });
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est obligatoire'); return; }
    const res = editData
      ? await api.employees.update(editData.id, form)
      : await api.employees.create(form);
    if (res.success) { toast.success(editData ? 'Employé modifié' : 'Employé ajouté'); onSaved(); }
    else toast.error(res.error);
  };

  const color = POSTE_COLORS[form.poste] || '#6366f1';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
            {form.nom ? getInitials(form.nom) : '👔'}
          </div>
          <h3 className="modal-title" style={{ margin: 0 }}>{editData ? 'Modifier employé' : 'Nouvel employé'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group"><label>Nom complet *</label><input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Nom d'employé" required /></div>
            <div className="form-group"><label>Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="Numéro de téléphone" /></div>
            <div className="form-group"><label>Poste</label><select className="input" value={form.poste} onChange={e => setForm({...form, poste: e.target.value})}>{EMPLOYEE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label>Grade</label><select className="input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>{GRADES.map(g => <option key={g}>{g}</option>)}</select></div>
            <div className="form-group"><label>Prix par jour (DA)</label><input className="input" type="number" value={form.prix_par_jour} onChange={e => setForm({...form, prix_par_jour: e.target.value})} placeholder="Ex: 3000" /></div>
            <div className="form-group"><label>Date de recrutement</label><input className="input" type="date" value={form.date_recrutement || ''} onChange={e => setForm({...form, date_recrutement: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Adresse</label><input className="input" value={form.adresse || ''} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="L'adresse de l'employé" /></div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.disponible} onChange={e => setForm({...form, disponible: e.target.checked})} />
              <span>Disponible</span>
              <span className={`status-badge status-${form.disponible ? 'confirmed' : 'cancelled'}`} style={{ marginLeft: 8 }}>{form.disponible ? 'Disponible' : 'Occupé'}</span>
            </label>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="input" rows="2" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..."></textarea></div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EMPLOYEE DETAIL MODAL ────────────────────────────────────
function EmployeeDetailModal({ employeeId, onClose, onEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.employees.getById(employeeId).then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [employeeId]);

  if (loading) return (<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="loading-page">Chargement...</div></div></div>);
  if (!data) return null;
  const color = POSTE_COLORS[data.poste] || '#6366f1';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>{getInitials(data.nom)}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{data.nom}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span className="chip" style={{ background: color + '22', color }}>{data.poste}</span>
                <span className="chip">{data.grade}</span>
                <span className={`status-badge status-${data.disponible ? 'confirmed' : 'cancelled'}`}>{data.disponible ? 'Disponible' : 'Occupé'}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(data)}>✏ Modifier</button>
        </div>
        <div className="form-grid-2" style={{ marginBottom: 20 }}>
          {data.telephone && <div><span className="text-muted" style={{ fontSize: 12 }}>TÉLÉPHONE</span><div>{data.telephone}</div></div>}
          {data.adresse && <div><span className="text-muted" style={{ fontSize: 12 }}>ADRESSE</span><div>{data.adresse}</div></div>}
          {data.date_recrutement && <div><span className="text-muted" style={{ fontSize: 12 }}>RECRUTÉ LE</span><div>{formatDate(data.date_recrutement)}</div></div>}
          <div><span className="text-muted" style={{ fontSize: 12 }}>PRIX / JOUR</span><div className="fw-bold text-green">{formatDA(data.prix_par_jour)}</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="kpi-card blue" style={{ padding: '12px 16px' }}><div className="kpi-label">Réservations</div><div className="kpi-value" style={{ fontSize: 28 }}>{data.stats?.total_reservations || 0}</div></div>
          <div className="kpi-card green" style={{ padding: '12px 16px' }}><div className="kpi-label">Total gagné</div><div className="kpi-value" style={{ fontSize: 22 }}>{formatDA(data.stats?.total_gagne || 0)}</div></div>
          <div className="kpi-card amber" style={{ padding: '12px 16px' }}><div className="kpi-label">Moy. / événement</div><div className="kpi-value" style={{ fontSize: 22 }}>{formatDA(Math.round(data.stats?.avg_cout || 0))}</div></div>
        </div>
        {data.byType?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>TYPES D'ÉVÉNEMENTS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.byType.map(t => <span key={t.type_fete} className="chip">{t.type_fete} <strong>×{t.count}</strong></span>)}
            </div>
          </div>
        )}
        <div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>HISTORIQUE ({data.history?.length || 0})</div>
          {data.history?.length === 0 ? <div className="empty-state" style={{ padding: '20px 0' }}>Aucun événement travaillé</div> : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Client</th><th>Événement</th><th>Rôle</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {data.history.map(h => (
                  <tr key={h.id}>
                    <td className="text-muted">{formatDate(h.date_evenement)}</td>
                    <td className="fw-bold">{h.client_nom}</td>
                    <td><span className="chip">{h.type_fete}</span></td>
                    <td className="text-muted">{h.role || data.poste}</td>
                    <td className="text-green fw-bold">{formatDA(h.cout)}</td>
                    <td><span className={`status-badge status-${h.statut}`}>{h.statut === 'confirmed' ? 'Confirmé' : h.statut === 'done' ? 'Terminé' : h.statut === 'cancelled' ? 'Annulé' : 'En attente'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export function EmployeesPage() {
  const [tab, setTab] = useState('employes'); // 'employes' | 'affectations'
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPoste, setFilterPoste] = useState('all');
  const [filterDispo, setFilterDispo] = useState('all');
  const [sortBy, setSortBy] = useState('nom');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const [empRes, statRes] = await Promise.all([
      api.employees.getAll(),
      api.employees.getStats ? api.employees.getStats() : Promise.resolve({ success: false })
    ]);
    if (empRes.success) setEmployees(empRes.data);
    if (statRes.success) setStats(statRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length > 1) { const res = await api.employees.search(q); if (res.success) setEmployees(res.data); }
    else load();
  };

  const openNew = () => { setEditData(null); setShowForm(true); };
  const openEdit = (e) => { setEditData(e); setDetailId(null); setShowForm(true); };

  const handleDelete = (id, nom) => {
    setConfirm({
      message: `Supprimer l'employé "${nom}" ?\nSon historique sera également supprimé.`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.employees.delete(id);
        if (res.success) { toast.success('Employé supprimé'); load(); } else toast.error(res.error);
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirm({
      message: "⚠️ Supprimer TOUS les employés ?\n\nCette action est irréversible !",
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.employees.deleteAll();
        if (res.success) { toast.success('Tous les employés supprimés'); load(); } else toast.error(res.error);
      }
    });
  };

  let filtered = employees.filter(e => {
    const matchPoste = filterPoste === 'all' || e.poste === filterPoste;
    const matchDispo = filterDispo === 'all' || (filterDispo === 'dispo' ? e.disponible : !e.disponible);
    return matchPoste && matchDispo;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'nom') return a.nom.localeCompare(b.nom);
    if (sortBy === 'prix') return b.prix_par_jour - a.prix_par_jour;
    if (sortBy === 'reservations') return (b.nb_reservations || 0) - (a.nb_reservations || 0);
    if (sortBy === 'gains') return (b.total_gagne || 0) - (a.total_gagne || 0);
    return 0;
  });

  return (
    <div className="page-container">

      {/* KPI */}
      {stats && tab === 'employes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="kpi-card blue"><div className="kpi-label">Total employés</div><div className="kpi-value">{stats.total}</div></div>
          <div className="kpi-card green"><div className="kpi-label">Disponibles</div><div className="kpi-value">{stats.disponibles}</div></div>
          <div className="kpi-card amber"><div className="kpi-label">Occupés</div><div className="kpi-value">{stats.occupes}</div></div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #6366f122, #6366f133)' }}><div className="kpi-label">Coûts ce mois</div><div className="kpi-value" style={{ fontSize: 18 }}>{formatDA(stats.coutMensuel)}</div></div>
        </div>
      )}

      {/* Postes */}
      {stats?.byPoste?.length > 0 && tab === 'employes' && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: 12 }}>POSTES :</span>
            {stats.byPoste.map(p => (
              <button key={p.poste} onClick={() => setFilterPoste(filterPoste === p.poste ? 'all' : p.poste)}
                style={{ background: filterPoste === p.poste ? (POSTE_COLORS[p.poste] || '#6366f1') + '33' : 'transparent', color: POSTE_COLORS[p.poste] || '#6366f1', border: `1px solid ${POSTE_COLORS[p.poste] || '#6366f1'}44`, borderRadius: 20, padding: '3px 12px', cursor: 'pointer', fontSize: 13 }}>
                {p.poste} <strong>{p.count}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top actif */}
      {stats?.topActif?.length > 0 && tab === 'employes' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ padding: '12px 16px 8px' }}><span style={{ fontSize: 13, fontWeight: 600 }}>🏆 Employés les plus actifs</span></div>
          <div style={{ display: 'flex', gap: 10, padding: '0 16px 12px', flexWrap: 'wrap' }}>
            {stats.topActif.map((e, i) => (
              <div key={e.nom} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff08', borderRadius: 10, padding: '6px 12px' }}>
                <span style={{ color: i === 0 ? '#f59e0b' : '#64748b', fontWeight: 700 }}>{i + 1}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: (POSTE_COLORS[e.poste] || '#6366f1') + '22', color: POSTE_COLORS[e.poste] || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{getInitials(e.nom)}</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.nom}</div><div style={{ fontSize: 11, color: '#64748b' }}>{e.nb} événements · {formatDA(e.gains)}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="page-toolbar">
        <div className="filter-tabs">
          <button className={`tab ${tab === 'employes' ? 'active' : ''}`} onClick={() => setTab('employes')}>👔 Employés</button>
          <button className={`tab ${tab === 'affectations' ? 'active' : ''}`} onClick={() => setTab('affectations')}>📋 Affectations réservations</button>
        </div>
        {tab === 'employes' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {employees.length > 0 && <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑 Tout supprimer</button>}
            <button className="btn btn-primary" onClick={openNew}>+ Ajouter employé</button>
          </div>
        )}
      </div>

      {/* ── TAB EMPLOYÉS ── */}
      {tab === 'employes' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input className="search-input" style={{ width: 220 }} placeholder="🔍 Nom, téléphone, poste..." value={search} onChange={e => handleSearch(e.target.value)} />
            <select className="input" style={{ width: 'auto', height: 40 }} value={filterDispo} onChange={e => setFilterDispo(e.target.value)}>
              <option value="all">Tous</option>
              <option value="dispo">Disponibles</option>
              <option value="occupe">Occupés</option>
            </select>
          </div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr><th>Employé</th><th>Poste</th><th>Contact</th><th>Prix / jour</th><th>Réservations</th><th>Total gagné</th><th>Disponibilité</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const color = POSTE_COLORS[e.poste] || '#6366f1';
                  return (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(e.id)}>
                      <td>
                        <div className="client-cell">
                          <div className="avatar" style={{ background: color + '22', color }}>{getInitials(e.nom)}</div>
                          <div><div className="fw-bold">{e.nom}</div>{e.grade !== 'Standard' && <div style={{ fontSize: 11, color: '#64748b' }}>{e.grade}</div>}</div>
                        </div>
                      </td>
                      <td><span className="chip" style={{ background: color + '22', color }}>{e.poste}</span></td>
                      <td className="text-muted">{e.telephone}</td>
                      <td className="fw-bold">{formatDA(e.prix_par_jour)}</td>
                      <td><span className="chip chip-accent">{e.nb_reservations || 0}</span></td>
                      <td className="text-green fw-bold">{formatDA(e.total_gagne)}</td>
                      <td><span className={`status-badge status-${e.disponible ? 'confirmed' : 'cancelled'}`}>{e.disponible ? 'Disponible' : 'Occupé'}</span></td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <div className="action-buttons">
                          <button className="btn btn-ghost btn-sm" title="Voir" onClick={() => setDetailId(e.id)}>👁</button>
                          <button className="btn btn-ghost btn-sm" title="Modifier" onClick={() => openEdit(e)}>✏</button>
                          <button className="btn btn-danger btn-sm" title="Supprimer" onClick={() => handleDelete(e.id, e.nom)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state">Aucun employé trouvé</div>}
          </div>
        </>
      )}

      {/* ── TAB AFFECTATIONS ── */}
      {tab === 'affectations' && <AffectationsTab />}

      {/* Modals */}
      {showForm && <EmployeeFormModal editData={editData} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {detailId && !showForm && <EmployeeDetailModal employeeId={detailId} onClose={() => setDetailId(null)} onEdit={(emp) => { setDetailId(null); openEdit(emp); }} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export default EmployeesPage;