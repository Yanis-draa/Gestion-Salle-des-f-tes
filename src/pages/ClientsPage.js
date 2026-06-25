import React, { useEffect, useState } from 'react';
import { api, formatDA, getInitials } from '../utils';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 7;

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <h3 className="modal-title">⚠️ Confirmation</h3>
        <p style={{ margin: '12px 0 24px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

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
        {from}–{to} sur {totalItems} client{totalItems > 1 ? 's' : ''}
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

export function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', notes: '' });
  const [confirm, setConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    const res = await api.clients.getAll();
    if (res.success) setClients(res.data);
  };
  useEffect(() => { load(); }, []);

  const handleSearch = async (q) => {
    setSearch(q);
    setCurrentPage(1);
    if (q.length > 1) {
      const res = await api.clients.search(q);
      if (res.success) setClients(res.data);
    } else { load(); }
  };

  const openNew = () => { setEditData(null); setForm({ nom: '', telephone: '', adresse: '', notes: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditData(c); setForm({ nom: c.nom, telephone: c.telephone, adresse: c.adresse, notes: c.notes }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est obligatoire'); return; }
    const res = editData ? await api.clients.update(editData.id, form) : await api.clients.create(form);
    if (res.success) { toast.success(editData ? 'Client modifié' : 'Client ajouté'); setShowModal(false); load(); }
    else toast.error(res.error);
  };

  const handleDelete = (id) => {
    setConfirm({
      message: 'Supprimer ce client et toutes ses réservations/paiements associés ?\n\nCette action est irréversible !',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.clients.delete(id);
        if (res.success) { toast.success('Client supprimé'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirm({
      message: '⚠️ Supprimer TOUS les clients et toutes leurs réservations/paiements associés ?\n\nCette action est irréversible !',
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.clients.deleteAll();
        if (res.success) { toast.success('Tous les clients supprimés'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const avatarColors = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#14b8a6'];

  const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE);
  const paginated = clients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {clients.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteAll}>🗑 Tout supprimer</button>
          )}
          <button className="btn btn-primary" onClick={openNew}>+ Nouveau client</button>
        </div>
      </div>
      <div className="card">
        <div className="search-bar">
          <input className="search-input" placeholder="🔍  Rechercher par nom ou téléphone..." value={search} onChange={e => handleSearch(e.target.value)} />
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Client</th><th>Téléphone</th><th>Adresse</th><th>Réservations</th><th>Total payé</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {paginated.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <div className="client-cell">
                    <div className="avatar" style={{ background: avatarColors[c.id % avatarColors.length] + '33', color: avatarColors[c.id % avatarColors.length] }}>{getInitials(c.nom)}</div>
                    <span className="fw-bold">{c.nom}</span>
                  </div>
                </td>
                <td>{c.telephone}</td>
                <td className="text-muted">{c.adresse}</td>
                <td><span className="chip chip-accent">{c.nb_reservations || 0}</span></td>
                <td className="text-green fw-bold">{formatDA(c.total_paye)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <div className="empty-state">Aucun client trouvé</div>}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={clients.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modale formulaire */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editData ? 'Modifier client' : 'Nouveau client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Nom complet *</label><input className="input" required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Nom de client" required /></div>
              <div className="form-group"><label>Téléphone</label><input className="input" required value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="Numéro de téléphone ex: 0661 234 567" /></div>
              <div className="form-group"><label>Adresse</label><input className="input" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Adresse de client" /></div>
              <div className="form-group"><label>Notes</label><textarea className="input" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..."></textarea></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale confirmation */}
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

export default ClientsPage;