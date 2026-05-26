// src/components/Layout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const navItems = [
  { to: '/',            label: 'Dashboard',   icon: '📊', adminOnly: false },
  { to: '/caixa',       label: 'Caixa',        icon: '💰', adminOnly: false },
  { to: '/transacoes',  label: 'Transações',   icon: '📋', adminOnly: false },
  { to: '/pendencias',  label: 'Pendências',   icon: '⏳', adminOnly: false },
  { to: '/relatorios',  label: 'Relatórios',   icon: '📈', adminOnly: true  },
  { to: '/usuarios',    label: 'Usuários',     icon: '👥', adminOnly: true  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold tracking-widest uppercase opacity-80">CentralTech</h1>
          <p className="text-xs opacity-40 mt-1">PagFácil</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'ADMIN')
            .map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                   ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
                }
              >
                <span>{item.icon}</span> {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-1 truncate">{user?.name}</p>
          <p className="text-xs text-gray-600 mb-3">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
          <button
            onClick={logout}
            className="w-full text-xs text-gray-400 hover:text-white py-1.5 border border-gray-700 rounded hover:border-gray-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
