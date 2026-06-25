import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA, formatDate, EXPENSE_CATEGORIES, EMPLOYEE_TYPES, MONTHS_FR, getInitials } from '../utils';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 6;

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
        {from}–{to} sur {totalItems} dépense{totalItems > 1 ? 's' : ''}
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

// ─── MAIN PAGE ────────────────────────────────────────────────
function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    categorie: 'Électricité',
    description: '',
    montant: '',
    date_depense: new Date().toISOString().slice(0, 10)
  });

  // ── LOAD ──────────────────────────────────────────────────
  const load = async () => {
    const res = await api.expenses.getGeneral(month, year);
    if (res.success) {
      setAllExpenses(res.data);
      setExpenses(res.data);
    }
  };

  useEffect(() => {
    load();
    setSearch('');
    setFilterCat('all');
    setCurrentPage(1);
  }, [month, year]);

  // ── FILTERS ───────────────────────────────────────────────
  useEffect(() => {
    let filtered = allExpenses;
    if (filterCat !== 'all') {
      filtered = filtered.filter(e => e.categorie === filterCat);
    }
    if (search) {
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.categorie?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setExpenses(filtered);
    setCurrentPage(1);
  }, [filterCat, search, allExpenses]);

  // ── TOTAL ─────────────────────────────────────────────────
  const totalDepenses = expenses.reduce((a, e) => a + (e.montant || 0), 0);

  // ── OPEN MODALS ───────────────────────────────────────────
  const openNew = () => {
    setEditData(null);
    setForm({
      categorie: 'Électricité',
      description: '',
      montant: '',
      date_depense: new Date().toISOString().slice(0, 10)
    });
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditData(expense);
    setForm({
      categorie: expense.categorie,
      description: expense.description,
      montant: expense.montant,
      date_depense: expense.date_depense
    });
    setShowModal(true);
  };

  // ── SUBMIT ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = editData
      ? await api.expenses.update(editData.id, form)
      : await api.expenses.createGeneral({ ...form, mois: month, annee: year });
    if (res.success) {
      toast.success(editData ? 'Dépense modifiée' : 'Dépense ajoutée');
      setShowModal(false);
      load();
    } else {
      toast.error(res.error);
    }
  };

  // ── DELETE ONE ────────────────────────────────────────────
  const handleDelete = (id) => {
    setConfirm({
      message: 'Supprimer cette dépense ?',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.expenses.delete(id);
        if (res.success) { toast.success('Dépense supprimée'); load(); }
        else toast.error(res.error);
      }
    });
  };

  // ── DELETE ALL ────────────────────────────────────────────
  const handleDeleteAll = () => {
    setConfirm({
      message: `⚠️ Supprimer TOUTES les dépenses de ${MONTHS_FR[month]} ${year} ?\n\nIrréversible !`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.expenses.deleteAll(month, year);
        if (res.success) { toast.success('Toutes les dépenses supprimées'); load(); }
        else toast.error(res.error);
      }
    });
  };

  // ── PAGINATION ────────────────────────────────────────────
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginated = expenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="input" style={{ width: 130 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS_FR.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select className="input" style={{ width: 90 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <div style={{ width: 1, height: 28, background: '#ffffff11' }} />
          <select className="input" style={{ width: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">Toutes les catégories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {allExpenses.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteAll}>🗑 Tout supprimer</button>
          )}
          <button className="btn btn-primary" onClick={openNew}>+ Ajouter dépense</button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card">
        <input
          className="search-input"
          style={{ marginBottom: 12 }}
          placeholder="🔍 Description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(expense => (
              <tr key={expense.id}>
                <td className="text-muted">{formatDate(expense.date_depense)}</td>
                <td><span className="chip">{expense.categorie}</span></td>
                <td>{expense.description}</td>
                <td className="text-red fw-bold">{formatDA(expense.montant)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(expense)}>✏</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {expenses.length === 0 && <div className="empty-state">Aucune dépense trouvée</div>}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={expenses.length}
          onPageChange={setCurrentPage}
        />

        {/* FOOTER TOTAL */}
        <div className="table-footer">
          <span>Total — {MONTHS_FR[month]} {year}{filterCat !== 'all' ? ` / ${filterCat}` : ''}</span>
          <span className="text-red fw-bold">{formatDA(totalDepenses)}</span>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editData ? '✏ Modifier dépense' : '+ Ajouter dépense'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Catégorie</label>
                <select className="input" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Détail de la dépense..."
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Montant (DA) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="Montant"
                    value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date_depense}
                    onChange={e => setForm({ ...form, date_depense: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

    </div>
  );
}

export default ExpensesPage;