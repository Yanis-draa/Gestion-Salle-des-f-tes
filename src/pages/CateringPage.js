import React, { useEffect, useState, useCallback } from 'react';
import { api, formatDA, formatDate, getInitials } from '../utils';
import toast from 'react-hot-toast';

const TYPE_REPAS = ['Complet', 'Sans boissons', 'Sans desserts', 'Entrées seulement', 'Personnalisé'];

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

// ─── MENU TEMPLATE FORM ───────────────────────────────────────
function MenuTemplateForm({ editData, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: '', description: '', prix_par_personne: '',
    type_repas: 'Complet',
    entrees: '', plats: '', boissons: '', desserts: '', cafe: '', collation: '',
    notes: ''
  });

  useEffect(() => { if (editData) setForm({ ...editData }); }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est obligatoire'); return; }
    const res = editData
      ? await api.catering.updateTemplate(editData.id, form)
      : await api.catering.createTemplate(form);
    if (res.success) { toast.success(editData ? 'Menu modifié' : 'Menu créé'); onSaved(); }
    else toast.error(res.error);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h3 className="modal-title">{editData ? '✏ Modifier menu' : '🍽 Nouveau menu modèle'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nom du menu *</label>
              <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Menu " required />
            </div>
            <div className="form-group">
              <label>Prix / personne (DA) *</label>
              <input className="input" type="number" value={form.prix_par_personne} onChange={e => setForm({...form, prix_par_personne: e.target.value})} placeholder="Prix par personne" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Entrées + Plat principal + Desserts + Boissons" />
            </div>
            <div className="form-group">
              <label>Type de repas</label>
              <select className="input" value={form.type_repas} onChange={e => setForm({...form, type_repas: e.target.value})}>
                {TYPE_REPAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
            <div className="form-group">
              <label>🥗 Entrées / Hors-d'œuvre</label>
              <textarea
                className="input" rows="3"
                value={form.entrees}
                onChange={e => setForm({ ...form, entrees: e.target.value })}
                placeholder="Chorba, Salades variées, Brick, Salade méchouia..."
              />
            </div>
            <div className="form-group">
              <label>🍛 Plats</label>
              <textarea
                className="input" rows="3"
                value={form.plats}
                onChange={e => setForm({ ...form, plats: e.target.value })}
                placeholder="Couscous royal, Poulet rôti, Mechoui..."
              />
            </div>
            <div className="form-group">
              <label>🥤 Boissons</label>
              <textarea
                className="input" rows="3"
                value={form.boissons}
                onChange={e => setForm({ ...form, boissons: e.target.value })}
                placeholder="Jus de fruits, Eau minérale, Soda..."
              />
            </div>
            <div className="form-group">
              <label>🍮 Desserts</label>
              <textarea
                className="input" rows="3"
                value={form.desserts}
                onChange={e => setForm({ ...form, desserts: e.target.value })}
                placeholder="Baklawa, Tarte, Glace..."
              />
            </div>
            <div className="form-group">
              <label>☕ Café / Thé</label>
              <textarea
                className="input" rows="3"
                value={form.cafe}
                onChange={e => setForm({ ...form, cafe: e.target.value })}
                placeholder="Café, Thé, Lait, Infusion..."
              />
            </div>
            <div className="form-group">
              <label>🥪 Collation / Cocktail</label>
              <textarea
                className="input" rows="3"
                value={form.collation}
                onChange={e => setForm({ ...form, collation: e.target.value })}
                placeholder="Mini sandwichs, petits fours, snacks, jus..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="input" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes pour le chef, recommandations..." />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ {editData ? 'Modifier' : 'Créer le menu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CATERING RESERVATION FORM ────────────────────────────────
function CateringReservationForm({ reservation, templates, onClose, onSaved }) {
  const [form, setForm] = useState({
    menu_template_id: '',
    nom_menu: '', type_repas: 'Complet',
    nombre_personnes: reservation?.nombre_invites || 0,
    prix_par_personne: 0,
    entrees: '', plats: '', boissons: '', desserts: '',
    cafe: '', collation: '',
    personnalisation: '', notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.catering.getByReservation(reservation.id).then(res => {
      if (res.success && res.data) {
        setForm({ ...res.data });
        setTotal((res.data.nombre_personnes || 0) * (res.data.prix_par_personne || 0));
      }
      setLoading(false);
    });
  }, [reservation.id]);

  useEffect(() => {
    setTotal((form.nombre_personnes || 0) * (form.prix_par_personne || 0));
  }, [form.nombre_personnes, form.prix_par_personne]);

  const applyTemplate = async (templateId) => {
    if (!templateId) {
      setForm(f => ({
        ...f,
        menu_template_id: '', nom_menu: '',
        entrees: '', plats: '', boissons: '', desserts: '',
        cafe: '', collation: '',
        prix_par_personne: 0
      }));
      return;
    }
    const res = await api.catering.applyTemplate(reservation.id, templateId);
    if (res.success) {
      setForm(f => ({ ...f, ...res.data }));
      toast.success('Menu appliqué — modifiez si nécessaire');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom_menu) { toast.error('Choisissez un menu'); return; }
    const res = await api.catering.save(reservation.id, form);
    if (res.success) {
      toast.success(`Catering enregistré — Total : ${formatDA(res.total)}`);
      onSaved();
    } else toast.error(res.error);
  };

  const handleDelete = async () => {
    const res = await api.catering.delete(reservation.id);
    if (res.success) { toast.success('Catering supprimé'); onSaved(); }
    else toast.error(res.error);
  };

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="loading-page">Chargement...</div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>🍽 Catering — {reservation.client_nom}</h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {reservation.type_fete} · {formatDate(reservation.date_evenement)} · {reservation.nombre_invites} invités
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ÉTAPE 1 : Choisir un menu modèle */}
          <div style={{ background: '#6366f111', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, marginBottom: 10 }}>
              ÉTAPE 1 — Choisir un menu modèle
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {templates.map(t => (
                <div key={t.id}
                  onClick={() => applyTemplate(String(t.id))}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${String(form.menu_template_id) === String(t.id) ? '#6366f1' : '#ffffff11'}`,
                    background: String(form.menu_template_id) === String(t.id) ? '#6366f122' : '#ffffff05',
                    transition: 'all 0.15s'
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.nom}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.description}</div>
                  <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, marginTop: 4 }}>{formatDA(t.prix_par_personne)} / pers.</div>
                  {t.nb_utilisations > 0 && <div style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>Utilisé {t.nb_utilisations} fois</div>}
                </div>
              ))}
            </div>
          </div>

          {/* ÉTAPE 2 : Personnalisation */}
          <div style={{ background: '#10b98111', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginBottom: 12 }}>
              ÉTAPE 2 — Personnaliser
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Nom du menu *</label>
                <input className="input" value={form.nom_menu} onChange={e => setForm({...form, nom_menu: e.target.value})} placeholder="Menu Royal personnalisé" required />
              </div>
              <div className="form-group">
                <label>Type de repas</label>
                <select className="input" value={form.type_repas} onChange={e => setForm({...form, type_repas: e.target.value})}>
                  {TYPE_REPAS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Prix / personne (DA)</label>
                <input className="input" type="number" value={form.prix_par_personne} onChange={e => setForm({...form, prix_par_personne: Number(e.target.value)})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>🥗 Entrées</label>
                <textarea className="input" rows="3" value={form.entrees} onChange={e => setForm({...form, entrees: e.target.value})} placeholder="Chorba, Salades..." />
              </div>
              <div className="form-group">
                <label>🍛 Plats</label>
                <textarea className="input" rows="3" value={form.plats} onChange={e => setForm({...form, plats: e.target.value})} placeholder="Chorba, Couscous..." />
              </div>
              <div className="form-group">
                <label>🥤 Boissons</label>
                <textarea className="input" rows="3" value={form.boissons} onChange={e => setForm({...form, boissons: e.target.value})} placeholder="Jus, Eau..." />
              </div>
              <div className="form-group">
                <label>🍮 Desserts</label>
                <textarea className="input" rows="3" value={form.desserts} onChange={e => setForm({...form, desserts: e.target.value})} placeholder="Baklawa..." />
              </div>
              <div className="form-group">
                <label>☕ Café / Thé</label>
                <textarea className="input" rows="3" value={form.cafe} onChange={e => setForm({...form, cafe: e.target.value})} placeholder="Café, Thé..." />
              </div>
              <div className="form-group">
                <label>🥪 Collation</label>
                <textarea className="input" rows="3" value={form.collation} onChange={e => setForm({...form, collation: e.target.value})} placeholder="Mini sandwichs..." />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Personnalisation / demandes spéciales</label>
              <textarea className="input" rows="2" value={form.personnalisation} onChange={e => setForm({...form, personnalisation: e.target.value})} placeholder="Ex: Sans boissons alcoolisées, Desserts VIP ajoutés..." />
            </div>
          </div>

          {/* ÉTAPE 3 : Calcul automatique */}
          <div style={{ background: '#f59e0b11', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 10 }}>
              ÉTAPE 3 — Calcul automatique
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{form.nombre_personnes} personnes</span>
                <span style={{ margin: '0 8px', color: '#64748b' }}>×</span>
                <span style={{ color: '#64748b' }}>{formatDA(form.prix_par_personne)} / pers.</span>
                <span style={{ margin: '0 8px', color: '#64748b' }}>=</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{formatDA(total)}</div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              ✅ Ce montant sera automatiquement ajouté aux dépenses de la réservation
            </div>
          </div>

          <div className="modal-actions">
            {form.id && (
              <button type="button" className="btn btn-danger" onClick={handleDelete}>🗑 Supprimer catering</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">✅ Enregistrer — {formatDA(total)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── FICHE CUISINE ────────────────────────────────────────────
function FicheCuisine({ data, onClose }) {
  const { reservation, catering, settings } = data;

  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>🖨 Fiche Cuisine</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 Imprimer</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        <div id="fiche-cuisine" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: 24, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{settings?.nom_salle || 'FESTIVA'}</div>
            <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>FICHE CUISINE</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
            <div><strong>Client :</strong> {reservation?.client_nom}</div>
            <div><strong>Téléphone :</strong> {reservation?.client_tel}</div>
            <div><strong>Événement :</strong> {reservation?.type_fete}</div>
            <div><strong>Date :</strong> {formatDate(reservation?.date_evenement)}</div>
            <div><strong>Heure :</strong> {reservation?.heure_debut} → {reservation?.heure_fin}</div>
            <div><strong>Période :</strong> {reservation?.periode === 'Matin' ? '🌅 Matin' : reservation?.periode === 'Journée complète' ? '☀️ Journée complète' : '🌙 Soir'}</div>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              🍽 {catering?.nom_menu}
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              <strong>{catering?.nombre_personnes} personnes</strong> · {catering?.type_repas}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {catering?.entrees && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🥗 ENTRÉES</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.entrees.split(',').map((e, i) => <div key={i}>• {e.trim()}</div>)}
                </div>
              </div>
            )}
            {catering?.plats && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🍛 PLATS</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.plats.split(',').map((p, i) => <div key={i}>• {p.trim()}</div>)}
                </div>
              </div>
            )}
            {catering?.boissons && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🥤 BOISSONS</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.boissons.split(',').map((b, i) => <div key={i}>• {b.trim()}</div>)}
                </div>
              </div>
            )}
            {catering?.desserts && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🍮 DESSERTS</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.desserts.split(',').map((d, i) => <div key={i}>• {d.trim()}</div>)}
                </div>
              </div>
            )}
            {catering?.cafe && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>☕ CAFÉ / THÉ</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.cafe.split(',').map((c, i) => <div key={i}>• {c.trim()}</div>)}
                </div>
              </div>
            )}
            {catering?.collation && (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🥪 COLLATION</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {catering.collation.split(',').map((c, i) => <div key={i}>• {c.trim()}</div>)}
                </div>
              </div>
            )}
          </div>

          {catering?.personnalisation && (
            <div style={{ border: '2px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 16, background: '#fffbeb' }}>
              <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 4 }}>⚠️ PERSONNALISATION / DEMANDES SPÉCIALES</div>
              <div style={{ fontSize: 13 }}>{catering.personnalisation}</div>
            </div>
          )}

          {catering?.notes && (
            <div style={{ fontSize: 12, color: '#666', borderTop: '1px solid #ddd', paddingTop: 10 }}>
              <strong>Notes :</strong> {catering.notes}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 24, paddingTop: 16, borderTop: '1px solid #ddd', fontSize: 12 }}>
            <div>Signature Chef :<br /><br /><br />___________________</div>
            <div>Signature Responsable :<br /><br /><br />___________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function CateringPage() {
  const [tab, setTab] = useState('menus');
  const [templates, setTemplates] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [cateringRes, setCateringRes] = useState(null);
  const [ficheData, setFicheData] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── NOUVEAU : state de recherche ──
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [tRes, rRes, sRes] = await Promise.all([
      api.catering.getTemplates(),
      api.reservations.getAll(),
      api.catering.getStats(),
    ]);
    if (tRes.success) setTemplates(tRes.data);
    if (rRes.success) setReservations(rRes.data.filter(r => r.statut !== 'cancelled'));
    if (sRes.success) setStats(sRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteTemplate = (id, nom) => {
    setConfirm({
      message: `Supprimer le menu "${nom}" ?\nIl ne sera plus disponible pour les nouvelles réservations.\n ⚠️ Les packs utilisant ce menu seront également supprimés.`,
      onConfirm: async () => {
        setConfirm(null);
        const res = await api.catering.deleteTemplate(id);
        if (res.success) { toast.success('Menu supprimé'); load(); }
        else toast.error(res.error);
      }
    });
  };

  const handleFiche = async (resId) => {
    const res = await api.catering.getFicheData(resId);
    if (res.success && res.data.catering) setFicheData(res.data);
    else toast.error('Aucun catering configuré pour cette réservation');
  };

  // ── NOUVEAU : réservations filtrées ──
  const filteredReservations = reservations.filter(r =>
    r.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.type_fete?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="kpi-card green">
            <div className="kpi-label">Dépenses Catering total</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>{formatDA(stats.totalCA)}</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-label">Réservations avec menu</div>
            <div className="kpi-value">{stats.nbMenus}</div>
          </div>
          <div className="kpi-card amber">
            <div className="kpi-label">Menus modèles</div>
            <div className="kpi-value">{stats.templates}</div>
          </div>
          <div className="kpi-card" style={{ background: '#ec489911' }}>
            <div className="kpi-label">Menu le plus populaire</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: '#ec4899' }}>
              {stats.topMenu?.[0]?.nom_menu || '—'}
            </div>
          </div>
        </div>
      )}

      <div className="page-toolbar">
        <div className="filter-tabs">
          <button className={`tab ${tab === 'menus' ? 'active' : ''}`} onClick={() => setTab('menus')}>
            🍽 Menus modèles ({templates.length})
          </button>
          <button className={`tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
            📋 Réservations
          </button>
        </div>
        {tab === 'menus' && (
          <button className="btn btn-primary" onClick={() => { setEditTemplate(null); setShowMenuForm(true); }}>
            + Nouveau menu
          </button>
        )}
      </div>

      {/* ── TAB : RÉSERVATIONS ── */}
      {tab === 'reservations' && (
        <>
          {/* ── NOUVEAU : Barre de recherche ── */}
          <div style={{ marginBottom: 12 }}>
            <input
              className="input"
              style={{ maxWidth: 360 }}
              placeholder="🔍 Rechercher par client ou type de fête..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Réservation</th>
                  <th>Date</th>
                  <th>Invités</th>
                  <th>Menu choisi</th>
                  <th>Prix/pers.</th>
                  <th>Total catering</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map(r => (
                  <ReservationCateringRow
                    key={`${r.id}-${refreshKey}`}
                    reservation={r}
                    templates={templates}
                    onEdit={() => setCateringRes(r)}
                    onFiche={() => handleFiche(r.id)}
                    onDeleted={() => { load(); setRefreshKey(k => k + 1); }}
                  />
                ))}
              </tbody>
            </table>
            {reservations.length === 0 && (
              <div className="empty-state">Aucune réservation active</div>
            )}
            {reservations.length > 0 && filteredReservations.length === 0 && (
              <div className="empty-state">Aucun résultat pour « {search} »</div>
            )}
          </div>
        </>
      )}

      {/* ── TAB : MENUS MODÈLES ── */}
      {tab === 'menus' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #6366f122, #8b5cf622)', padding: '16px 20px', borderBottom: '1px solid #ffffff0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>🍽 {t.nom}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{t.type_repas}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>{formatDA(t.prix_par_personne)}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>par personne</div>
                  </div>
                </div>
                {t.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' }}>{t.description}</div>}
              </div>

              <div style={{ padding: '12px 20px' }}>
                {t.entrees && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🥗 ENTRÉES</div>
                    <div style={{ fontSize: 12 }}>{t.entrees}</div>
                  </div>
                )}
                {t.plats && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🍛 PLATS</div>
                    <div style={{ fontSize: 12 }}>{t.plats}</div>
                  </div>
                )}
                {t.boissons && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🥤 BOISSONS</div>
                    <div style={{ fontSize: 12 }}>{t.boissons}</div>
                  </div>
                )}
                {t.desserts && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🍮 DESSERTS</div>
                    <div style={{ fontSize: 12 }}>{t.desserts}</div>
                  </div>
                )}
                {t.cafe && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>☕ CAFÉ / THÉ</div>
                    <div style={{ fontSize: 12 }}>{t.cafe}</div>
                  </div>
                )}
                {t.collation && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🥪 COLLATION</div>
                    <div style={{ fontSize: 12 }}>{t.collation}</div>
                  </div>
                )}
                {t.nb_utilisations > 0 && (
                  <div style={{ fontSize: 11, color: '#6366f1', marginTop: 8 }}>
                    ✓ Utilisé {t.nb_utilisations} fois · {formatDA(t.prix_moyen)}/pers. en moyenne
                  </div>
                )}
              </div>

              <div style={{ padding: '10px 20px', borderTop: '1px solid #ffffff0a', display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setEditTemplate(t); setShowMenuForm(true); }}>✏ Modifier</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTemplate(t.id, t.nom)}>🗑</button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              Aucun menu modèle — Cliquez sur "+ Nouveau menu" pour commencer
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showMenuForm && (
        <MenuTemplateForm
          editData={editTemplate}
          onClose={() => setShowMenuForm(false)}
          onSaved={() => { setShowMenuForm(false); load(); }}
        />
      )}

      {cateringRes && (
        <CateringReservationForm
          reservation={cateringRes}
          templates={templates}
          onClose={() => setCateringRes(null)}
          onSaved={() => { setCateringRes(null); load(); setRefreshKey(k => k + 1); }}
        />
      )}

      {ficheData && (
        <FicheCuisine
          data={ficheData}
          onClose={() => setFicheData(null)}
        />
      )}

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── LIGNE RÉSERVATION (avec chargement catering) ─────────────
function ReservationCateringRow({ reservation, templates, onEdit, onFiche, onDeleted }) {
  const [cat, setCat] = useState(null);

  useEffect(() => {
    api.catering.getByReservation(reservation.id).then(res => {
      if (res.success) setCat(res.data);
    });
  }, [reservation.id]);

  const handleDelete = async () => {
    const res = await api.catering.delete(reservation.id);
    if (res.success) {
      toast.success('Catering supprimé');
      setCat(null);
      if (onDeleted) onDeleted();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <tr>
      <td>
        <div className="fw-bold">{reservation.client_nom}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{reservation.type_fete}</div>
      </td>
      <td className="text-muted">{formatDate(reservation.date_evenement)}</td>
      <td>{reservation.nombre_invites}</td>
      <td>
        {cat
          ? <span className="chip chip-accent">🍽 {cat.nom_menu}</span>
          : <span style={{ color: '#64748b', fontSize: 12 }}>— Non configuré</span>
        }
      </td>
      <td>{cat ? <span className="fw-bold">{formatDA(cat.prix_par_personne)}</span> : '—'}</td>
      <td>{cat ? <span className="fw-bold text-green">{formatDA(cat.total_catering)}</span> : '—'}</td>
      <td>
        <div className="action-buttons">
          {cat && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Supprimer catering</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onEdit}>
            {cat ? '✏ Modifier' : '+ Configurer'}
          </button>
          {cat && (
            <button className="btn btn-ghost btn-sm" onClick={onFiche} title="Fiche cuisine">🖨 Imprimer le catering</button>
          )}
        </div>
      </td>
    </tr>
  );
}