import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const useAppStore = create((set, get) => ({
  // Settings
  settings: { nom_salle: '', telephone: '', adresse: '', theme: 'dark', accent_color: '#6366f1' },
  setSettings: (settings) => set({ settings }),

  // Clients
  clients: [],
  setClients: (clients) => set({ clients }),

  // Reservations
  reservations: [],
  setReservations: (reservations) => set({ reservations }),

  // Employees
  employees: [],
  setEmployees: (employees) => set({ employees }),

  // Payments
  payments: [],
  setPayments: (payments) => set({ payments }),

  // Expenses
  generalExpenses: [],
  setGeneralExpenses: (generalExpenses) => set({ generalExpenses }),

  // Finance summary
  financeSummary: null,
  setFinanceSummary: (financeSummary) => set({ financeSummary }),

  monthlySummary: [],
  setMonthlySummary: (monthlySummary) => set({ monthlySummary }),

  // Current filters
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  setCurrentMonth: (m) => set({ currentMonth: m }),
  setCurrentYear: (y) => set({ currentYear: y }),
}));
