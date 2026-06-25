import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA } from '../utils';
import toast from 'react-hot-toast';

const SERVICES_SUGGESTIONS = [
  'DJ', 'Décoration', 'Éclairage', 'Photographe', 'Vidéaste',
  'Sonorisation', 'Fleurs', 'Voiture mariée', 'Feu d\'artifice',
  'Animation enfants', 'Karaoké', 'Sécurité', 'Parking'
];

const PACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

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

function PackFormModal({ editData, templates, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', prix: '', menu_template_id: '', services: [], description: '' });
  const [serviceInput, setServiceInput] = useState('');

  useEffect(() => {
    if (editData) setForm({ ...editData, menu_template_id: editData.menu_template_id || '', prix: editData.prix || '' });
  }, [editData]);

  const addService = (s) => {
    const val = s || serviceInput.trim();
    if (!val) return;
    if (!form.services.includes(val)) setForm(f => ({ ...f, services: [...f.services, val] }));
    setServiceInput('');
  };

  const removeService = (s) => setForm(f => ({ ...f, services: f.services.filter(x => x !== s) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prix) { toast.error('Nom et prix obligatoires'); return; }
    const res = editData
      ? await api.packs.update(editData.id, form)
      : await api.packs.create(form);
    if (res.success) { toast.success(editData ? 'Pack modifié' : 'Pack créé'); onSaved(); }
    else toast.error(res.error);
  };

  const selectedTemplate = templates.find(t => String(t.id) === String(form.menu_template_id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <h3 className="modal-title">{editData ? '✏ Modifier pack' : '📦 Nouveau pack'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nom du pack *</label>
              <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Pack Gold, Pack Premium..." required />
            </div>
            <div className="form-group">
              <label>Prix (DA) *</label>
              <input className="input" type="number" value={form.prix} onChange={e => setForm({...form, prix: e.target.value})} placeholder="800000" required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description du pack..." />
          </div>
          <div className="form-group">
            <label>🍽 Catering inclus</label>
            <select className="input" value={form.menu_template_id} onChange={e => setForm({...form, menu_template_id: e.target.value})}>
              <option value="">— Aucun catering —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.nom} — {formatDA(t.prix_par_personne)}/pers.</option>
              ))}
            </select>
            {selectedTemplate && (
              <div style={{ marginTop: 8, background: '#6366f111', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                <span style={{ color: '#6366f1', fontWeight: 600 }}>{selectedTemplate.nom}</span>
                {selectedTemplate.plats && <div style={{ color: '#64748b', marginTop: 3 }}>🍛 {selectedTemplate.plats}</div>}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>✨ Services inclus</label>
            {form.services.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {form.services.map(s => (
                  <span key={s} style={{ background: '#10b98122', color: '#10b981', border: '1px solid #10b98133', borderRadius: 20, padding: '3px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s}
                    <button type="button" onClick={() => removeService(s)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} value={serviceInput}
                onChange={e => setServiceInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                placeholder="Saisir un service ou choisir ci-dessous..." />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addService()}>+ Ajouter</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {SERVICES_SUGGESTIONS.filter(s => !form.services.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => addService(s)}
                  style={{ background: '#ffffff08', border: '1px solid #ffffff11', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Créer le pack'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([api.packs.getAll(), api.catering.getTemplates()]);
    if (pRes.success) setPacks(pRes.data);
    if (tRes.success) setTemplates(tRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = packs.filter(p =>
    !search || p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (p) => {
    setConfirm({
      message: `Supprimer le pack "${p.nom}" ?`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.packs.delete(p.id);
        if (res.success) { toast.success('Pack supprimé'); load(); }
        else toast.error(res.error);
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <input className="search-input" style={{ width: 280 }} placeholder="🔍 Rechercher un pack..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          {packs.length > 0 && (
            <button className="btn btn-danger" onClick={() => setConfirm({
              message: '⚠️ Supprimer TOUS les packs ?\n\nCette action est irréversible !',
              onConfirm: async () => {
                setConfirm(null);
                await Promise.all(packs.map(p => api.packs.delete(p.id)));
                toast.success('Tous les packs supprimés');
                load();
              }
            })}>🗑 Tout supprimer</button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>+ Nouveau pack</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{search ? 'Aucun pack trouvé' : 'Aucun pack créé'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            Créez des packs pour simplifier la création de réservations
          </div>
          {!search && <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>+ Créer un pack</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => {
            const color = PACK_COLORS[i % PACK_COLORS.length];
            return (
              <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${color}33` }}>
                <div style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, padding: '20px 20px 16px', borderBottom: `1px solid ${color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>📦 {p.nom}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>{formatDA(p.prix)}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>prix fixe</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  {p.catering_nom ? (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>🍽 Catering</div>
                      <div style={{ background: '#6366f111', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: '#6366f1' }}>{p.catering_nom}</span>
                        {p.catering_prix_pers > 0 && <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>{formatDA(p.catering_prix_pers)}/pers.</span>}
                        {p.plats && <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 3 }}>🍛 {p.plats}</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12, color: 'var(--muted)', fontSize: 12 }}>🍽 Aucun catering inclus</div>
                  )}
                  {p.services?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>✨ Services</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.services.map(s => (
                          <span key={s} style={{ background: color + '11', color, border: `1px solid ${color}33`, borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setEditData(p); setShowForm(true); }}>✏ Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <PackFormModal editData={editData} templates={templates} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
