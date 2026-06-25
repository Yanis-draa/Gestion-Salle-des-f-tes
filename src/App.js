import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useAppStore } from './store';
import { api } from './utils';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { isAuthenticated, login } = useAuthStore();
  const { setSettings } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings
    const loadSettings = async () => {
      try {
        const res = await api.settings.get();
        if (res.success && res.data) setSettings(res.data);
      } catch(e) {}
      setLoading(false);
    };
    loadSettings();
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">🏛 FESTIVA</div>
      <div className="loading-sub">Chargement...</div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e2538', color: '#e2e8f0', border: '1px solid #2d3748' } }} />
      {isAuthenticated ? <Layout /> : <LoginPage />}
    </>
  );
}
