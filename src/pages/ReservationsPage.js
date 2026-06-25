import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA, formatDate, PARTY_TYPES, getInitials } from '../utils';
import toast from 'react-hot-toast';

const STATUS_LABELS = { confirmed: 'Confirmée', pending: 'En attente' };
const POSTE_COLORS = {
  'Serveur': '#6366f1', 'DJ': '#ec4899', 'Cuisinier': '#f59e0b',
  'Nettoyage': '#14b8a6', 'Décoration': '#8b5cf6', 'Sécurité': '#ef4444',
  'Photographe': '#3b82f6', 'Manager': '#10b981', 'Autres': '#64748b',
};

const ITEMS_PER_PAGE = 7;

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


// ─── DATE PICKER WITH AVAILABILITY ───────────────────────────
function DatePickerWithAvailability({ value, salle, editId, onChange }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? parseInt(value.split('-')[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? parseInt(value.split('-')[1]) - 1 : today.getMonth());
  const [busyDates, setBusyDates] = useState([]);

  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  useEffect(() => {
    api.reservations.getAll().then(res => {
      if (res.success) {
        const busy = res.data
          .filter(r => r.statut !== 'cancelled' && r.id !== editId)
          .map(r => r.date_evenement);
        setBusyDates(busy);
      }
    });
  }, [editId]);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };

  const formatDateStr = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = today.toISOString().slice(0,10);

  return (
    <div style={{ background: '#ffffff08', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={prevMonth}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={nextMonth}>›</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#2dad34', marginRight: 4 }}></span>Disponible</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#ef4444', marginRight: 4 }}></span>Réservé</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#6366f1', marginRight: 4 }}></span>Sélectionné</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#64748b', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDateStr(viewYear, viewMonth, day);
          const isBusy = busyDates.includes(dateStr);
          const isSelected = value === dateStr;
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={day}
              type="button"
              disabled={isBusy || isPast}
              onClick={() => !isBusy && !isPast && onChange(dateStr)}
              style={{
                padding: '6px 2px', borderRadius: 8, border: 'none', cursor: isBusy || isPast ? 'not-allowed' : 'pointer',
                background: isSelected ? '#6366f1' : isBusy ? '#ef444422' : isPast ? 'transparent' : '#16b91011',
                color: isSelected ? '#fff' : isBusy ? '#ef4444' : isPast ? '#648b69' : '#2dad34',
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize: 13,
                outline: isToday && !isSelected ? '2px solid #6366f1' : 'none',
                opacity: isPast ? 0.5 : 1,
                transition: 'all 0.1s',
              }}
              title={isBusy ? `${salle} réservée ce jour` : isPast ? 'Date passée' : 'Disponible'}
            >
              {isBusy ? '✕' : day}
            </button>
          );
        })}
      </div>

      {value && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#6366f122', borderRadius: 8, fontSize: 13, color: '#6366f1', fontWeight: 600, textAlign: 'center' }}>
          ✓ Sélectionné : {new Date(value + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}

// ─── EMPLOYEE SELECTOR ────────────────────────────────────────
function EmployeeSelector({ reservationId, onClose, onUpdated }) {
  const [allEmployees, setAllEmployees] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [search, setSearch] = useState('');
  const [filterPoste, setFilterPoste] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    const [allRes, assignedRes] = await Promise.all([
      api.employees.getAll(),
      api.employees.getByReservation(reservationId),
    ]);
    if (allRes.success) setAllEmployees(allRes.data);
    if (assignedRes.success) setAssigned(assignedRes.data);
    setLoading(false);
  }, [reservationId]);

  useEffect(() => { load(); }, [load]);

  const isAssigned = (id) => assigned.some(a => a.id === id);

  const handleToggle = async (emp) => {
    setSaving(emp.id);
    if (isAssigned(emp.id)) {
      const res = await api.employees.removeFromReservation(emp.id, reservationId);
      if (res.success) {
        toast.success(`${emp.nom} retiré`);
        await load();
        onUpdated();
      } else toast.error(res.error);
    } else {
      const res = await api.employees.assignToReservation({
        reservation_id: reservationId,
        employee_id: emp.id,
        role: emp.poste,
        cout: emp.prix_par_jour,
      });
      if (res.success) {
        toast.success(`${emp.nom} affecté`);
        await load();
        onUpdated();
      } else toast.error(res.error);
    }
    setSaving(null);
  };

  const postes = [...new Set(allEmployees.map(e => e.poste))];
  const filtered = allEmployees.filter(e => {
    const matchSearch = !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.poste.toLowerCase().includes(search.toLowerCase());
    const matchPoste = filterPoste === 'all' || e.poste === filterPoste;
    return matchSearch && matchPoste;
  });

  const totalCout = assigned.reduce((s, e) => s + (e.cout || e.prix_par_jour || 0), 0);

  const byPoste = assigned.reduce((acc, e) => {
    if (!acc[e.poste]) acc[e.poste] = [];
    acc[e.poste].push(e);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={ev => ev.stopPropagation()} style={{ maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>👔 Affecter des employés</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Fermer</button>
        </div>

        {assigned.length > 0 && (
          <div style={{ background: '#ffffff08', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>ÉQUIPE AFFECTÉE ({assigned.length} employé{assigned.length > 1 ? 's' : ''})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {Object.entries(byPoste).map(([poste, emps]) => (
                <div key={poste} style={{ background: (POSTE_COLORS[poste] || '#6366f1') + '22', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>
                  <span style={{ color: POSTE_COLORS[poste] || '#6366f1', fontWeight: 600 }}>{emps.length}×</span>
                  <span style={{ marginLeft: 4 }}>{poste}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: -6 }}>
                {assigned.slice(0, 8).map(e => (
                  <div key={e.id} title={e.nom} style={{ width: 28, height: 28, borderRadius: 8, background: (POSTE_COLORS[e.poste] || '#6366f1') + '33', color: POSTE_COLORS[e.poste] || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: 4, border: '2px solid #1a2035' }}>
                    {getInitials(e.nom)}
                  </div>
                ))}
                {assigned.length > 8 && <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ffffff11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#64748b' }}>+{assigned.length - 8}</div>}
              </div>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 15 }}>
                Coût total : {formatDA(totalCout)}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input className="search-input" style={{ flex: 1, minWidth: 160 }} placeholder="🔍 Chercher un employé..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" style={{ width: 'auto' }} value={filterPoste} onChange={e => setFilterPoste(e.target.value)}>
            <option value="all">Tous les postes</option>
            {postes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div className="empty-state">Chargement...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(emp => {
                const assigned_ = isAssigned(emp.id);
                const color = POSTE_COLORS[emp.poste] || '#6366f1';
                const isSaving = saving === emp.id;
                return (
                  <div key={emp.id}
                    onClick={() => !isSaving && handleToggle(emp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderRadius: 12, cursor: isSaving ? 'wait' : 'pointer',
                      border: `2px solid ${assigned_ ? color : '#ffffff11'}`,
                      background: assigned_ ? color + '11' : '#ffffff05',
                      transition: 'all 0.15s', opacity: isSaving ? 0.6 : 1,
                    }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(emp.nom)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nom}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{emp.poste} · {formatDA(emp.prix_par_jour)}/j</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {!emp.disponible && <span style={{ fontSize: 10, color: '#ef4444', background: '#ef444422', borderRadius: 4, padding: '2px 5px' }}>Occupé</span>}
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: assigned_ ? color : '#ffffff11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {isSaving ? '⌛' : assigned_ ? '✓' : '+'}
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
          <button className="btn btn-primary" onClick={onClose}>✅ Valider ({assigned.length} employé{assigned.length > 1 ? 's' : ''})</button>
        </div>
      </div>
    </div>
  );
}

// ─── RESERVATION DETAIL MODAL ─────────────────────────────────
function ReservationDetailModal({ reservationId, onClose, onEdit, onRefreshList }) {
  const [data, setData] = useState(null);
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const [rRes, fRes] = await Promise.all([
      api.reservations.getById(reservationId),
      api.reservations.getFinancialDetails(reservationId),
    ]);
    if (rRes.success) setData(rRes.data);
    if (fRes.success) setFinances(fRes.data);
    setLoading(false);
  }, [reservationId]);

  useEffect(() => { load(); }, [load]);

  const handleRemoveEmployee = (empId, empNom) => {
    setConfirm({
      message: `Retirer ${empNom} de cette réservation ?`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.employees.removeFromReservation(empId, reservationId);
        if (res.success) { toast.success(`${empNom} retiré`); load(); }
        else toast.error(res.error);
      }
    });
  };

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="loading-page">Chargement...</div>
      </div>
    </div>
  );
  if (!data) return null;

  const totalEmployees = data.employees?.reduce((s, e) => s + (e.cout || 0), 0) || 0;
  const byPoste = (data.employees || []).reduce((acc, e) => {
    if (!acc[e.poste || e.role]) acc[e.poste || e.role] = [];
    acc[e.poste || e.role].push(e);
    return acc;
  }, {});

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '88vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>🎉</span>
                <h2 style={{ margin: 0, fontSize: 20 }}>{data.type_fete} — {data.client_nom}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="chip">{data.salle}</span>
                <span className="chip">{formatDate(data.date_evenement)}</span>
                <span className="chip">{data.heure_debut} → {data.heure_fin}</span>
                {data.periode && <span className="chip">{data.periode === 'Matin' ? '🌅 Matin' : data.periode === 'Journée complète' ? '☀️ Journée' : '🌙 Soir'}</span>}
                <span className={`status-badge status-${data.statut}`}>{STATUS_LABELS[data.statut]}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(data)}>✏ Modifier</button>
          </div>

          {finances && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              <div className="kpi-card blue" style={{ padding: '10px 14px' }}>
                <div className="kpi-label">Prix total</div>
                <div className="kpi-value" style={{ fontSize: 16 }}>{formatDA(finances.prix_total)}</div>
              </div>
              <div className="kpi-card green" style={{ padding: '10px 14px' }}>
                <div className="kpi-label">Total payé</div>
                <div className="kpi-value" style={{ fontSize: 16 }}>{formatDA(finances.total_paye)}</div>
              </div>
              <div className="kpi-card amber" style={{ padding: '10px 14px' }}>
                <div className="kpi-label">Reste à payer</div>
                <div className="kpi-value" style={{ fontSize: 16 }}>{formatDA(finances.reste)}</div>
              </div>
              <div className={`kpi-card ${finances.profit >= 0 ? 'green' : ''}`} style={{ padding: '10px 14px', background: finances.profit < 0 ? '#ef444411' : undefined }}>
                <div className="kpi-label">Profit</div>
                <div className="kpi-value" style={{ fontSize: 16, color: finances.profit >= 0 ? '#10b981' : '#ef4444' }}>{formatDA(finances.profit)}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>👔 Équipe ({data.employees?.length || 0})</span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowEmployeeSelector(true)}>
                  + Gérer équipe
                </button>
              </div>

              {data.employees?.length === 0 ? (
                <div style={{ background: '#ffffff05', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👔</div>
                  Aucun employé affecté
                  <br />
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setShowEmployeeSelector(true)}>
                    + Affecter des employés
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {Object.entries(byPoste).map(([poste, emps]) => (
                      <span key={poste} style={{ background: (POSTE_COLORS[poste] || '#6366f1') + '22', color: POSTE_COLORS[poste] || '#6366f1', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        {emps.length}× {poste}
                      </span>
                    ))}
                  </div>
                  {data.employees.map(emp => (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#ffffff05', borderRadius: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: (POSTE_COLORS[emp.poste] || '#6366f1') + '22', color: POSTE_COLORS[emp.poste] || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {getInitials(emp.nom)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.nom}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{emp.poste}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>{formatDA(emp.cout)}</div>
                      <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => handleRemoveEmployee(emp.id, emp.nom)}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#ef444411', borderRadius: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Coût total employés</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatDA(totalEmployees)}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💳 Paiements</div>
                {data.payments?.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 12, padding: '10px 0' }}>Aucun paiement enregistré</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {data.payments?.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff05', borderRadius: 8 }}>
                        <div>
                          <span className={`status-badge status-${p.type_paiement === 'Avance' ? 'pending' : 'confirmed'}`} style={{ fontSize: 11 }}>{p.type_paiement}</span>
                          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{formatDate(p.date_paiement)}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>{formatDA(p.montant)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📉 Dépenses</div>
                {data.expenses?.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 12, padding: '10px 0' }}>Aucune dépense</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {data.expenses?.map(exp => (
                      <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff05', borderRadius: 8 }}>
                        <div>
                          <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{exp.categorie}</span>
                          {exp.description && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{exp.description.replace(/\s\[emp_id:\d+\]/, '')}</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 13 }}>{formatDA(exp.montant)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: '#ffffff05', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-muted">Invités</span><span>{data.nombre_invites}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-muted">Dépenses totales</span>
                  <span style={{ color: '#ef4444' }}>{formatDA(finances?.total_depenses)}</span>
                </div>
                {data.notes && (
                  <div style={{ marginTop: 8, color: '#64748b', fontStyle: 'italic' }}>{data.notes}</div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
            <button className="btn btn-primary" onClick={() => setShowEmployeeSelector(true)}>👔 Gérer l'équipe</button>
          </div>
        </div>
      </div>

      {showEmployeeSelector && (
        <EmployeeSelector
          reservationId={reservationId}
          onClose={() => setShowEmployeeSelector(false)}
          onUpdated={() => { load(); onRefreshList && onRefreshList(); }}
        />
      )}

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </>
  );
}

// ─── RESERVATION FORM MODAL ───────────────────────────────────
function ReservationFormModal({ editData, clients, onClose, onSaved, onNavigateToPacks }) {
  const [form, setForm] = useState({
    client_id: '', type_fete: 'Mariage',
    date_evenement: '', periode: 'Soir', heure_debut: '15:00', heure_fin: '23:00',
    nombre_invites: '', prix_total: '', avance: '', statut: 'pending', notes: ''
  });
  const [typeRes, setTypeRes] = useState('normale');
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingPacks, setLoadingPacks] = useState(false);

  useEffect(() => {
    if (editData) setForm({ ...editData, periode: editData.periode || 'Soir' });
  }, [editData]);

  useEffect(() => {
    if (typeRes === 'pack') {
      setLoadingPacks(true);
      api.packs.getAll().then(res => {
        if (res.success) setPacks(res.data);
        setLoadingPacks(false);
      });
    }
  }, [typeRes]);

  useEffect(() => {
    if (!editData && typeRes === 'normale') {
      const avance = Number(form.avance || 0);
      const total = Number(form.prix_total || 0);
      if (total > 0 && avance >= total) {
        setForm(f => ({ ...f, statut: 'confirmed' }));
      } else {
        setForm(f => ({ ...f, statut: 'pending' }));
      }
    }
  }, [form.avance, form.prix_total]);

  const handlePackSelect = (pack) => {
    setSelectedPack(pack);
    setForm(f => ({ ...f, prix_total: String(pack.prix) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.date_evenement || !form.prix_total) {
      toast.error('Remplissez les champs obligatoires'); return;
    }
    if (!editData && Number(form.avance) > Number(form.prix_total)) {
      toast.error("L'avance ne peut pas dépasser le prix total"); return;
    }
    if (!editData) {
      const conflict = await api.reservations.checkConflict(form.date_evenement);
      if (conflict.conflict) { toast.error('Cette salle est déjà réservée à cette date !'); return; }
    }
    const res = editData
      ? await api.reservations.update(editData.id, form)
      : await api.reservations.create({ ...form, pack_id: selectedPack?.id || null });

    if (res.success) {
      if (!editData && selectedPack?.menu_template_id && res.id) {
        const catRes = await api.catering.applyTemplate(res.id, selectedPack.menu_template_id);
        if (catRes.success) {
          await api.catering.save(res.id, {
            ...catRes.data,
            nombre_personnes: Number(form.nombre_invites) || 0,
            total_catering: (Number(form.nombre_invites) || 0) * catRes.data.prix_par_personne,
          });
        }
      }
      toast.success(editData ? 'Réservation modifiée' : 'Réservation créée');
      onSaved(res.id);
    } else toast.error(res.error || 'Erreur');
  };

  const PACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <h3 className="modal-title">{editData ? 'Modifier réservation' : 'Nouvelle réservation'}</h3>
        <form onSubmit={handleSubmit}>

          {!editData && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Type de réservation</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button"
                  onClick={() => { setTypeRes('normale'); setSelectedPack(null); setForm(f => ({ ...f, prix_total: '' })); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${typeRes === 'normale' ? '#6366f1' : '#ffffff11'}`,
                    background: typeRes === 'normale' ? '#6366f122' : '#ffffff05',
                    color: typeRes === 'normale' ? '#6366f1' : '#94a3b8',
                    fontWeight: typeRes === 'normale' ? 700 : 400, fontSize: 14,
                  }}>
                  🎉 Réservation normale
                </button>
                <button type="button"
                  onClick={() => setTypeRes('pack')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${typeRes === 'pack' ? '#10b981' : '#ffffff11'}`,
                    background: typeRes === 'pack' ? '#10b98122' : '#ffffff05',
                    color: typeRes === 'pack' ? '#10b981' : '#94a3b8',
                    fontWeight: typeRes === 'pack' ? 700 : 400, fontSize: 14,
                  }}>
                  📦 Choisir un pack
                </button>
              </div>
            </div>
          )}

          {typeRes === 'pack' && !editData && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Sélectionner un pack</label>
              {loadingPacks ? (
                <div style={{ color: '#64748b', padding: '10px 0' }}>Chargement...</div>
              ) : packs.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13, padding: '10px 0' }}>
                  Aucun pack disponible — <button type="button" className="btn btn-ghost btn-sm" onClick={() => { onClose(); onNavigateToPacks && onNavigateToPacks(); }} style={{ color: '#6366f1' }}>→ Aller créer un pack</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {packs.map((p, i) => {
                    const color = PACK_COLORS[i % PACK_COLORS.length];
                    const isSelected = selectedPack?.id === p.id;
                    return (
                      <div key={p.id} onClick={() => handlePackSelect(p)}
                        style={{
                          padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isSelected ? color : '#ffffff11'}`,
                          background: isSelected ? color + '11' : '#ffffff05',
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>📦 {p.nom}</div>
                          <div style={{ fontWeight: 800, color, fontSize: 14 }}>{formatDA(p.prix)}</div>
                        </div>
                        {p.catering_nom && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>🍽 {p.catering_nom}</div>
                        )}
                        {p.services?.length > 0 && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            ✨ {p.services.join(', ')}
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ marginTop: 6, fontSize: 11, color, fontWeight: 600 }}>✓ Sélectionné</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPack && (
                <div style={{ marginTop: 10, background: '#10b98111', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 4 }}>✅ Pack sélectionné : {selectedPack.nom}</div>
                  <div style={{ color: '#64748b' }}>Prix total rempli automatiquement : <strong>{formatDA(selectedPack.prix)}</strong></div>
                  {selectedPack.catering_nom && <div style={{ color: '#64748b' }}>Catering inclus : <strong>{selectedPack.catering_nom}</strong> (sera appliqué automatiquement)</div>}
                  {selectedPack.services?.length > 0 && <div style={{ color: '#64748b' }}>Services : {selectedPack.services.join(', ')}</div>}
                </div>
              )}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label>Client *</label>
              <select className="input" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}{c.telephone ? ` — ${c.telephone}` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Type de fête *</label>
              <select className="input" value={form.type_fete} onChange={e => setForm({...form, type_fete: e.target.value})}>
                {PARTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Date de l'événement *</label>
              <DatePickerWithAvailability
                value={form.date_evenement}
                salle={form.salle}
                editId={editData?.id}
                onChange={date => setForm({...form, date_evenement: date})}
              />
            </div>
            <div className="form-group">
              <label>Période</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Matin', 'Soir', 'Journée complète'].map(p => (
                  <button key={p} type="button"
                    onClick={() => {
                      const heures = p === 'Matin' ? { heure_debut: '08:00', heure_fin: '14:00' }
                        : p === 'Soir' ? { heure_debut: '15:00', heure_fin: '23:00' }
                        : { heure_debut: '08:00', heure_fin: '23:00' };
                      setForm({...form, periode: p, ...heures});
                    }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8,
                      border: `2px solid ${form.periode === p ? '#6366f1' : '#ffffff11'}`,
                      background: form.periode === p ? '#6366f122' : '#ffffff05',
                      color: form.periode === p ? '#6366f1' : '#94a3b8',
                      fontWeight: form.periode === p ? 700 : 400, cursor: 'pointer', fontSize: 13
                    }}>
                    {p === 'Matin' ? '🌅 Matin' : p === 'Soir' ? '🌙 Soir' : '☀️ Journée'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Heure début</label>
              <input className="input" type="time" value={form.heure_debut} onChange={e => setForm({...form, heure_debut: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Heure fin</label>
              <input className="input" type="time" value={form.heure_fin} onChange={e => setForm({...form, heure_fin: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Nombre d'invités</label>
              <input className="input" type="number" value={form.nombre_invites} onChange={e => setForm({...form, nombre_invites: e.target.value})} placeholder="Nombre d'invités" />
            </div>
            <div className="form-group">
              <label>Prix total (DA) *{selectedPack ? ' — issu du pack' : ''}</label>
              <input className="input" type="number" value={form.prix_total}
                onChange={e => setForm({...form, prix_total: e.target.value})}
                placeholder="Entrez le prix total" required
                style={selectedPack ? { color: '#10b981', fontWeight: 700 } : {}} />
            </div>
            <div className="form-group">
              <label style={{ color: editData ? '#64748b' : undefined }}>
                Avance (DA){editData ? ' — via Paiements' : ''}
              </label>
              {editData ? (
                <input className="input" readOnly
                  value={form.avance ? Number(form.avance).toLocaleString('fr-DZ') + ' DA' : '0 DA'}
                  style={{ background: '#ffffff08', color: '#10b981', fontWeight: 700, cursor: 'default' }} />
              ) : (
                <input className="input" type="number" value={form.avance}
                  onChange={e => setForm({...form, avance: e.target.value})} placeholder="Entrez l'avance de client" />
              )}
            </div>
            <div className="form-group">
              <label style={{ color: '#64748b' }}>Reste à payer</label>
              <input className="input" readOnly
                value={(form.prix_total !== '' && form.prix_total != null)
                  ? (Number(form.prix_total || 0) - Number(form.avance || 0)).toLocaleString('fr-DZ') + ' DA'
                  : '—'}
                style={{ background: '#ffffff08', color: '#f59e0b', fontWeight: 700, cursor: 'default' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="input" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes supplémentaires..."></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PAGINATION COMPONENT ─────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #ffffff0d', marginTop: 4 }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>
        {from}–{to} sur {totalItems} réservation{totalItems > 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Précédent */}
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ minWidth: 32, opacity: currentPage === 1 ? 0.35 : 1 }}
        >‹</button>

        {/* Numéros de pages */}
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} style={{ padding: '0 4px', color: '#64748b', fontSize: 13 }}>…</span>
            : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${p === currentPage ? '#6366f1' : '#ffffff22'}`,
                  background: p === currentPage ? '#6366f1' : 'transparent',
                  color: p === currentPage ? '#fff' : undefined,
                  fontWeight: p === currentPage ? 700 : 400,
                  fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >{p}</button>
            )
        )}

        {/* Suivant */}
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ minWidth: 32, opacity: currentPage === totalPages ? 0.35 : 1 }}
        >›</button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function ReservationsPage({ onNavigate }) {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([api.reservations.getAll(), api.clients.getAll()]);
    if (rRes.success) setReservations(rRes.data);
    if (cRes.success) setClients(cRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditData(null); setShowForm(true); };
  const openEdit = (r) => { setEditData(r); setDetailId(null); setShowForm(true); };

  const handleFilterChange = (v) => { setFilter(v); setCurrentPage(1); };
  const handleSearchChange = (v) => { setSearch(v); setCurrentPage(1); };

  const handleSaved = async (id) => {
    setShowForm(false);
    await load();
    if (id && !editData) {
      setDetailId(id);
      toast('💡 Vous pouvez maintenant affecter des employés à cette réservation', { icon: '👔', duration: 4000 });
    }
  };

  const handleCancel = (id) => {
    setConfirm({
      message: 'Annuler cette réservation ?',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.reservations.cancel(id);
        if (res.success) { toast.success('Réservation annulée'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const handleDelete = (id) => {
    setConfirm({
      message: 'Supprimer définitivement cette réservation ?\nTous les paiements, dépenses et affectations seront supprimés.',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.reservations.delete(id);
        if (res.success) { toast.success('Réservation supprimée'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirm({
      message: '⚠️ Supprimer TOUTES les réservations ?\nTous les paiements, dépenses et affectations seront supprimés.\n\nCette action est irréversible !',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.reservations.deleteAll();
        if (res.success) { toast.success('Toutes les réservations supprimées'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const filtered = reservations.filter(r => {
    const matchFilter = filter === 'all' || r.statut === filter;
    const matchSearch = !search || r.client_nom?.toLowerCase().includes(search.toLowerCase()) || r.type_fete?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="page-container">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="filter-tabs">
          {[['all','Toutes'],['confirmed','Confirmées'],['pending','En attente']].map(([v,l]) => (
            <button key={v} className={`tab ${filter===v?'active':''}`} onClick={() => handleFilterChange(v)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {reservations.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑 Tout supprimer</button>
          )}
          <button className="btn btn-primary" onClick={openNew}>+ Nouvelle réservation</button>
        </div>
      </div>

      <div className="card">
        <input
          className="search-input"
          style={{ marginBottom: 12 }}
          placeholder="🔍 Rechercher par client, type..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />

        {loading ? <div className="loading-page">Chargement...</div> : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Période</th>
                  <th>Invités</th>
                  <th>Prix total</th>
                  <th>Payé</th>
                  <th>Reste</th>
                  <th>Équipe</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(r.id)}>
                    <td className="text-muted text-sm">R{String(r.id).padStart(3,'0')}</td>
                    <td><span className="fw-bold">{r.client_nom}</span></td>
                    <td><span className="chip">{r.type_fete}</span></td>
                    <td>{formatDate(r.date_evenement)}</td>
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {r.periode === 'Matin' ? '🌅 Matin' : r.periode === 'Journée complète' ? '☀️ Journée' : '🌙 Soir'}
                      </span>
                    </td>
                    <td>{r.nombre_invites}</td>
                    <td className="fw-bold">{formatDA(r.prix_total)}</td>
                    <td className="text-green">{formatDA(r.total_paye)}</td>
                    <td className="text-amber">{formatDA(r.prix_total - (r.total_paye || 0))}</td>
                    <td>
                      {r.nb_employees > 0
                        ? <span className="chip chip-accent">👔 {r.nb_employees}</span>
                        : <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td><span className={`status-badge status-${r.statut}`}>{STATUS_LABELS[r.statut]}</span></td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="btn btn-ghost btn-sm" title="Voir détails" onClick={() => setDetailId(r.id)}>👁</button>
                        <button className="btn btn-ghost btn-sm" title="Modifier" onClick={() => openEdit(r)}>✏</button>
                        <button className="btn btn-danger btn-sm" title="Supprimer" onClick={() => handleDelete(r.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Pagination ── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {filtered.length === 0 && !loading && <div className="empty-state">Aucune réservation trouvée</div>}
      </div>

      {/* Form modal */}
      {showForm && (
        <ReservationFormModal
          editData={editData}
          clients={clients}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          onNavigateToPacks={() => { setShowForm(false); onNavigate && onNavigate('packs'); }}
        />
      )}

      {/* Detail modal */}
      {detailId && !showForm && (
        <ReservationDetailModal
          reservationId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(r) => { setDetailId(null); openEdit(r); }}
          onRefreshList={load}
        />
      )}

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}