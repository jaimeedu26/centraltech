// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth.store';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CashPage from './pages/CashPage';
import TransactionsPage from './pages/TransactionsPage';
import PendingPage from './pages/PendingPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

// Protege rotas — redireciona para login se não autenticado
function PrivateRoute() {
  const token = localStorage.getItem('access_token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

// Protege rotas exclusivas de admin
function AdminRoute() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const loadMe = useAuthStore(s => s.loadMe);

  useEffect(() => { loadMe(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/caixa" element={<CashPage />} />
              <Route path="/transacoes" element={<TransactionsPage />} />
              <Route path="/pendencias" element={<PendingPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
