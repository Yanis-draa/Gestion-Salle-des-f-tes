export const formatDA = (n) => {
  if (n == null) return '0 DA';
  return Number(n).toLocaleString('fr-DZ') + ' DA';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const STATUS_CONFIG = {
  confirmed: { label: 'Confirmée', class: 'status-confirmed', color: '#10b981' },
  pending: { label: 'En attente', class: 'status-pending', color: '#f59e0b' },
  cancelled: { label: 'Annulée', class: 'status-cancelled', color: '#ef4444' },
  done: { label: 'Terminée', class: 'status-done', color: '#6366f1' },
};

export const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const EXPENSE_CATEGORIES = [
  'Électricité', 'Eau', 'Internet', 'Salaires', 'Maintenance',
  'Produits', 'Transport', 'Loyer', 'Impôts', 'Divers'
];

export const EMPLOYEE_TYPES = [
  'Serveur', 'DJ', 'Cuisinier', 'Nettoyage', 'Décoration', 'Sécurité', 'Photographe', 'Manager', 'Autres'
];

export const PARTY_TYPES = [
  'Mariage',
  'Fiançailles',
  'Circoncision',
  'Naissance',
  'Anniversaire',
  'Diplôme / Réussite',
  'Séminaire',
  'Fête d\'entreprise',
  'Réunion familiale',
  'Autre'
];

export const api = window.api || {
  clients: {
    getAll: async () => ({ success: true, data: [] }),
    getById: async () => ({ success: true, data: {} }),
    create: async () => ({ success: true }),
    update: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    deleteAll: async () => ({ success: true }),
    search: async () => ({ success: true, data: [] }),
  },
  reservations: {
    getAll: async () => ({ success: true, data: [] }),
    getById: async () => ({ success: true, data: {} }),
    getByDate: async () => ({ success: true, data: [] }),
    create: async () => ({ success: true }),
    update: async () => ({ success: true }),
    cancel: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    deleteAll: async () => ({ success: true }),
    checkConflict: async () => ({ success: true, conflict: false }),
    getFinancialDetails: async () => ({ success: true, data: {} }),
  },
  payments: {
    getAll: async () => ({ success: true, data: [] }),
    getByReservation: async () => ({ success: true, data: [] }),
    search: async () => ({ success: true, data: [] }),
    create: async () => ({ success: true }),
    update: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    deleteByReservation: async () => ({ success: true }),
    getReceiptData: async () => ({ success: true, data: {} }),
    getStats: async () => ({ success: true, data: { totalGlobal: 0, totalMois: 0, byMethode: [], nbPaiements: 0 } }),
  },
  employees: {
    getAll: async () => ({ success: true, data: [] }),
    getById: async () => ({ success: true, data: {} }),
    create: async () => ({ success: true }),
    update: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    deleteAll: async () => ({ success: true }),
    search: async () => ({ success: true, data: [] }),
    getStats: async () => ({ success: true, data: { total: 0, disponibles: 0, occupes: 0, byPoste: [], topActif: [], coutMensuel: 0 } }),
    getHistory: async () => ({ success: true, data: [] }),
    getByReservation: async () => ({ success: true, data: [] }),
    assignToReservation: async () => ({ success: true }),
    removeFromReservation: async () => ({ success: true }),
  },
  packs: {
    getAll: async () => ({ success: true, data: [] }),
    getById: async () => ({ success: true, data: {} }),
    create: async () => ({ success: true }),
    update: async () => ({ success: true }),
    delete: async () => ({ success: true }),
  },
  catering: {
    getTemplates: async () => ({ success: true, data: [] }),
    createTemplate: async () => ({ success: true }),
    updateTemplate: async () => ({ success: true }),
    deleteTemplate: async () => ({ success: true }),
    getByReservation: async () => ({ success: true, data: null }),
    applyTemplate: async () => ({ success: true, data: {} }),
    save: async () => ({ success: true, total: 0 }),
    delete: async () => ({ success: true }),
    getFicheData: async () => ({ success: true, data: {} }),
    getStats: async () => ({ success: true, data: { totalCA: 0, nbMenus: 0, topMenu: [], templates: 0 } }),
  },
  expenses: {
    getGeneral: async () => ({ success: true, data: [] }),
    getByReservation: async () => ({ success: true, data: [] }),
    createGeneral: async () => ({ success: true }),
    createForReservation: async () => ({ success: true }),
    update: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    deleteAll: async () => ({ success: true }),
  },
  finance: {
    getSummary: async () => ({ success: true, data: {} }),
    getMonthlySummary: async () => ({ success: true, data: [] }),
    getAnnualSummary: async () => ({ success: true, data: {} }),
    getStats: async () => ({ success: true, data: {} }),
  },
  settings: {
    get: async () => ({ success: true, data: { nom_salle: 'FESTIVA', telephone: '', adresse: '', theme: 'dark' } }),
    update: async () => ({ success: true }),
  },
  pdf: {
    generateReceipt: async () => ({ success: true }),
    generateCateringSheet: async () => ({ success: true }),
    print: async () => ({ success: true }),
  },
  backup: {
    export: async () => ({ success: true }),
    import: async () => ({ success: true }),
  },
  auth: {
    login: async () => ({ success: true, user: { nom: 'Admin', role: 'admin' } }),
    logout: async () => ({ success: true }),
    register: async () => ({ success: true }),
  },
  
};
