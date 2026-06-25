import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA, formatDate, EXPENSE_CATEGORIES, EMPLOYEE_TYPES, MONTHS_FR, getInitials } from '../utils';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 7;
const METHODES = ['Espèces', 'CCP', 'Carte', 'Virement', 'Chèque'];

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

// ─── PAGINATION ───────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
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
        <button className="btn btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} style={{ minWidth: 32, opacity: currentPage === 1 ? 0.35 : 1 }}>‹</button>
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} style={{ padding: '0 4px', color: '#64748b', fontSize: 13 }}>…</span>
            : (
              <button key={p} onClick={() => onPageChange(p)} style={{
                minWidth: 32, height: 32, borderRadius: 8,
                border: `1px solid ${p === currentPage ? '#6366f1' : '#ffffff22'}`,
                background: p === currentPage ? '#6366f1' : 'transparent',
                color: p === currentPage ? '#fff' : undefined,
                fontWeight: p === currentPage ? 700 : 400,
                fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
              }}>{p}</button>
            )
        )}
        <button className="btn btn-ghost btn-sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} style={{ minWidth: 32, opacity: currentPage === totalPages ? 0.35 : 1 }}>›</button>
      </div>
    </div>
  );
}

// ─── REÇU MODAL ───────────────────────────────────────────────
function ReceiptModal({ paymentId, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.payments.getReceiptData(paymentId).then(res => {
      if (res.success) setData(res.data);
    });
  }, [paymentId]);

  if (!data) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="loading-page">Chargement...</div>
      </div>
    </div>
  );

  const { payment, settings, allPayments } = data;
  const reste = payment.prix_total - payment.total_paye;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>🧾 Reçu de paiement</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Imprimer</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ background: '#fff', color: '#111', borderRadius: 12, padding: 24, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{settings?.nom_salle || 'FESTIVA'}</div>
              {settings?.adresse && <div style={{ fontSize: 12, color: '#555' }}>{settings.adresse}</div>}
              {settings?.telephone && <div style={{ fontSize: 12, color: '#555' }}>Tél : {settings.telephone}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>REÇU N° {String(payment.id).padStart(4,'0')}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{formatDate(payment.date_paiement)}</div>
            </div>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div><strong>Client :</strong> {payment.client_nom}</div>
              <div><strong>Tél :</strong> {payment.client_tel}</div>
              <div><strong>Événement :</strong> {payment.type_fete}</div>
              <div><strong>Date événement :</strong> {formatDate(payment.date_evenement)}</div>
              <div><strong>Période :</strong> {payment.periode === 'Matin' ? '🌅 Matin' : payment.periode === 'Journée complète' ? '☀️ Journée complète' : '🌙 Soir'}</div>
              {payment.client_adresse && <div><strong>Adresse :</strong> {payment.client_adresse}</div>}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #ddd' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>
                  {payment.type_paiement} — {payment.methode}
                  {payment.notes && <div style={{ fontSize: 11, color: '#666' }}>{payment.notes}</div>}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 700, fontSize: 16 }}>
                  {formatDA(payment.montant)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666' }}>PRIX TOTAL</div>
              <div style={{ fontWeight: 700 }}>{formatDA(payment.prix_total)}</div>
            </div>
            <div style={{ border: '1px solid #10b981', borderRadius: 6, padding: '8px 12px', textAlign: 'center', background: '#f0fdf4' }}>
              <div style={{ fontSize: 11, color: '#10b981' }}>TOTAL PAYÉ</div>
              <div style={{ fontWeight: 700, color: '#10b981' }}>{formatDA(payment.total_paye)}</div>
            </div>
            <div style={{ border: `1px solid ${reste > 0 ? '#f59e0b' : '#10b981'}`, borderRadius: 6, padding: '8px 12px', textAlign: 'center', background: reste > 0 ? '#fffbeb' : '#f0fdf4' }}>
              <div style={{ fontSize: 11, color: reste > 0 ? '#f59e0b' : '#10b981' }}>RESTE</div>
              <div style={{ fontWeight: 700, color: reste > 0 ? '#f59e0b' : '#10b981' }}>{formatDA(reste)}</div>
            </div>
          </div>

          {allPayments.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Historique des paiements :</div>
              {allPayments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #eee', fontWeight: p.id === payment.id ? 700 : 400 }}>
                  <span>{formatDate(p.date_paiement)} — {p.type_paiement} ({p.methode}) {p.id === payment.id ? '← ce reçu' : ''}</span>
                  <span>{formatDA(p.montant)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 20, paddingTop: 16, borderTop: '1px solid #ddd', fontSize: 12 }}>
            <div>Signature client :<br /><br /><br />___________________</div>
            <div>Cachet & Signature :<br /><br /><br />___________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT FORM MODAL ───────────────────────────────────────
function PaymentFormModal({ editData, reservations, preselectedResId, onClose, onSaved }) {
  const [form, setForm] = useState({
    reservation_id: preselectedResId || '',
    montant: '', methode: 'Espèces', type_paiement: 'Complément',
    reference: '', notes: '',
    date_paiement: new Date().toISOString().slice(0,10)
  });
  const [resInfo, setResInfo] = useState(null);

  useEffect(() => {
    if (editData) setForm({ ...editData, reservation_id: String(editData.reservation_id) });
  }, [editData]);

  useEffect(() => {
    if (form.reservation_id) {
      const res = reservations.find(r => String(r.id) === String(form.reservation_id));
      setResInfo(res || null);
    } else setResInfo(null);
  }, [form.reservation_id, reservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reservation_id || !form.montant) { toast.error('Réservation et montant obligatoires'); return; }
    if (!editData && resInfo && Number(form.montant) > (resInfo.prix_total - (resInfo.total_paye || 0))) {
      toast.error("Le montant dépasse le reste à payer (" + formatDA(resInfo.prix_total - (resInfo.total_paye || 0)) + ")");
      return;
    }
    const res = editData
      ? await api.payments.update(editData.id, form)
      : await api.payments.create(form);
    if (res.success) {
      toast.success(editData ? 'Paiement modifié' : 'Paiement enregistré');
      onSaved();
    } else toast.error(res.error);
  };

  const reste = resInfo ? resInfo.prix_total - (resInfo.total_paye || 0) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3 className="modal-title">{editData ? '✏ Modifier paiement' : '💳 Nouveau paiement'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Réservation *</label>
            <select className="input" value={form.reservation_id}
              onChange={e => setForm({...form, reservation_id: e.target.value})} required disabled={!!editData}>
              <option value="">Sélectionner une réservation...</option>
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  R{String(r.id).padStart(3,'0')} — {r.client_nom} · {r.type_fete} · {formatDate(r.date_evenement)}
                </option>
              ))}
            </select>
          </div>

          {resInfo && (
            <div style={{ background: '#ffffff08', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Prix total</span>
                <span className="fw-bold">{formatDA(resInfo.prix_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Déjà payé</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatDA(resInfo.total_paye || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ffffff11', marginTop: 6, paddingTop: 6 }}>
                <span className="text-muted">Reste à payer</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{formatDA(reste)}</span>
              </div>
              {reste > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6, fontSize: 11 }}
                  onClick={() => setForm(f => ({ ...f, montant: String(reste) }))}>
                  Saisir le reste : {formatDA(reste)}
                </button>
              )}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label>Montant (DA) *</label>
              <input className="input" type="number" value={form.montant}
                onChange={e => setForm({...form, montant: e.target.value})} placeholder="Entrez le montant" required />
            </div>
            <div className="form-group">
              <label>Date paiement</label>
              <input className="input" type="date" value={form.date_paiement}
                onChange={e => setForm({...form, date_paiement: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Méthode</label>
              <select className="input" value={form.methode} onChange={e => setForm({...form, methode: e.target.value})}>
                {METHODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Référence / N° chèque</label>
            <input className="input" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} placeholder="N° chèque, référence virement..." />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="input" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..."></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ACCORDION ROW ────────────────────────────────────────────
function ReservationAccordionRow({ reservation, reservations, onEdit, onDelete, onReceipt, onAdded, METHODE_COLORS }) {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPayment, setEditPayment] = useState(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const res = await api.payments.getByReservation(reservation.id);
    if (res.success) setPayments(res.data);
    setLoading(false);
  }, [reservation.id]);

  useEffect(() => {
    if (open) loadPayments();
  }, [open, loadPayments]);

  const reste = reservation.prix_total - (reservation.total_paye || 0);
  const pct = Math.min(100, ((reservation.total_paye || 0) / reservation.prix_total) * 100);

  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', background: open ? '#ffffff08' : 'transparent' }}>
        <td style={{ width: 32, fontSize: 14, color: '#6366f1' }}>{open ? '▼' : '▶'}</td>
        <td className="fw-bold">{reservation.client_nom}</td>
        <td><span className="chip">{reservation.type_fete}</span></td>
        <td className="text-muted">{formatDate(reservation.date_evenement)}</td>
        <td className="fw-bold">{formatDA(reservation.prix_total)}</td>
        <td>
          <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>{formatDA(reservation.total_paye || 0)}</div>
          <div style={{ height: 4, background: '#ffffff11', borderRadius: 2, marginTop: 3, width: 80 }}>
            <div style={{ height: '100%', borderRadius: 2, background: pct >= 100 ? '#10b981' : '#6366f1', width: `${pct}%` }} />
          </div>
        </td>
        <td style={{ color: reste > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
          {reste > 0 ? formatDA(reste) : '✓ Soldé'}
        </td>
        <td><span className={`status-badge status-${reservation.statut}`}>{reservation.statut === 'confirmed' ? 'Confirmée' : reservation.statut === 'pending' ? 'En attente' : reservation.statut === 'done' ? 'Terminée' : 'Annulée'}</span></td>
        <td onClick={e => e.stopPropagation()}>
          {(reservation.total_paye || 0) < reservation.prix_total ? (
            <button className="btn btn-primary btn-sm" onClick={() => { setOpen(true); setShowAddForm(true); }}>+ Paiement</button>
          ) : (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Soldé</span>
          )}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={9} style={{ padding: 0, background: '#ffffff05' }}>
            <div style={{ padding: '8px 16px 12px 48px' }}>
              {loading && <div style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>Chargement...</div>}

              {!loading && payments.length === 0 && (
                <div style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>
                  Aucun paiement enregistré —{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(true)}>+ Ajouter</button>
                </div>
              )}

              {!loading && payments.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 14px', marginBottom: 6, borderRadius: 10,
                  background: '#ffffff08', border: '1px solid #ffffff0a'
                }}>
                  <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 13, minWidth: 24 }}>💳 {i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#10b981' }}>{formatDA(p.montant)}</span>
                    <span style={{ marginLeft: 10, background: (METHODE_COLORS[p.methode] || '#64748b') + '22', color: METHODE_COLORS[p.methode] || '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{p.methode}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>{formatDate(p.date_paiement)}</span>
                    {p.notes && <span style={{ marginLeft: 8, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{p.notes}</span>}
                  </div>
                  <div className="action-buttons">
                    <button className="btn btn-ghost btn-sm" title="Reçu" onClick={() => onReceipt(p.id)}>🧾</button>
                    <button className="btn btn-ghost btn-sm" title="Modifier" onClick={() => setEditPayment(p)}>✏</button>
                    <button className="btn btn-danger btn-sm" title="Supprimer" onClick={() => onDelete(p, () => loadPayments())}>🗑</button>
                  </div>
                </div>
              ))}

              {!loading && payments.length > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setShowAddForm(true)}>
                  + Ajouter un paiement
                </button>
              )}
            </div>
          </td>
        </tr>
      )}

      {editPayment && (
        <PaymentFormModal
          editData={editPayment}
          reservations={reservations}
          onClose={() => setEditPayment(null)}
          onSaved={() => { setEditPayment(null); loadPayments(); onAdded(); }}
        />
      )}

      {showAddForm && (
        <PaymentFormModal
          reservations={reservations}
          preselectedResId={reservation.id}
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); loadPayments(); onAdded(); }}
        />
      )}
    </>
  );
}

// ─── MAIN PAYMENTS PAGE ───────────────────────────────────────
export function PaymentsPage() {
  const [reservations, setReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMethode, setFilterMethode] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    const [rRes, sRes] = await Promise.all([
      api.reservations.getAll(),
      api.payments.getStats ? api.payments.getStats() : Promise.resolve({ success: false }),
    ]);
    if (rRes.success) {
      const active = rRes.data.filter(r => r.statut !== 'cancelled');
      setReservations(active);
      setAllReservations(active);
    }
    if (sRes.success) setStats(sRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (q) => {
    setSearch(q);
    setCurrentPage(1);
    if (q.length > 1) {
      setReservations(allReservations.filter(r =>
        r.client_nom?.toLowerCase().includes(q.toLowerCase()) ||
        r.type_fete?.toLowerCase().includes(q.toLowerCase()) ||
        r.date_evenement?.includes(q)
      ));
    } else setReservations(allReservations);
  };

  const openNew = () => { setEditData(null); setShowForm(true); };

  const handleDelete = (p, onDone) => {
    setConfirm({
      message: `Supprimer ce paiement de ${formatDA(p.montant)} ?\nLe total payé sera recalculé.`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.payments.delete(p.id);
        if (res.success) { toast.success('Paiement supprimé'); load(); if (onDone) onDone(); }
        else toast.error(res.error);
      }
    });
  };

  const METHODE_COLORS = { 'Espèces': '#10b981', 'CCP': '#6366f1', 'Carte': '#3b82f6', 'Virement': '#f59e0b', 'Chèque': '#ec4899' };

  const filtered = reservations;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="page-container">
      {/* KPI */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="kpi-card green">
            <div className="kpi-label">Total encaissé</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>{formatDA(stats.totalGlobal)}</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-label">Ce mois</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>{formatDA(stats.totalMois)}</div>
          </div>
          <div className="kpi-card amber">
            <div className="kpi-label">Nb paiements</div>
            <div className="kpi-value">{stats.nbPaiements}</div>
          </div>
          <div className="kpi-card" style={{ background: '#6366f111', padding: '12px 16px' }}>
            <div className="kpi-label" style={{ marginBottom: 8 }}>Par méthode</div>
            {stats.byMethode?.slice(0,3).map(m => (
              <div key={m.methode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: METHODE_COLORS[m.methode] || '#64748b' }}>● {m.methode}</span>
                <span>{formatDA(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="search-input" style={{ width: 260 }}
            placeholder="🔍 Client, type fête, date..."
            value={search} onChange={e => handleSearch(e.target.value)} />
          <select className="input" style={{ width: 'auto', height: 40 }} value={filterMethode} onChange={e => setFilterMethode(e.target.value)}>
            <option value="all">Toutes méthodes</option>
            {METHODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Enregistrer paiement</button>
      </div>

      {/* Accordion */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Client</th>
              <th>Type</th>
              <th>Date événement</th>
              <th>Prix total</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(r => (
              <ReservationAccordionRow
                key={r.id}
                reservation={r}
                reservations={allReservations}
                onEdit={openNew}
                onDelete={handleDelete}
                onReceipt={setReceiptId}
                onAdded={load}
                METHODE_COLORS={METHODE_COLORS}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">Aucune réservation trouvée</div>}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <PaymentFormModal
          editData={editData}
          reservations={allReservations}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
      {receiptId && <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export default PaymentsPage;