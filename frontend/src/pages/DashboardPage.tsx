// src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Card({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/today').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="p-8 text-gray-500">Carregando...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card label="Entradas" value={fmt(data?.entradas || 0)} color="text-green-700" />
        <Card label="Saídas" value={fmt(data?.saidas || 0)} color="text-red-600" />
        <Card label="Saldo do dia" value={fmt(data?.saldo || 0)} />
        <Card label="Pendências abertas" value={data?.pendenciasAbertas || 0} color={data?.pendenciasAbertas > 0 ? 'text-amber-600' : 'text-gray-900'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoria */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Entradas por categoria</h3>
          {data?.porCategoria && Object.keys(data.porCategoria).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.porCategoria).map(([cat, val]: any) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-medium">{fmt(val)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Nenhuma entrada hoje.</p>}
        </div>

        {/* Por forma de pagamento */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Por forma de pagamento</h3>
          {data?.porFormaPgto && Object.keys(data.porFormaPgto).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.porFormaPgto).map(([forma, val]: any) => (
                <div key={forma} className="flex justify-between text-sm">
                  <span className="text-gray-600">{forma}</span>
                  <span className="font-medium">{fmt(val)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Nenhum dado disponível.</p>}
        </div>
      </div>
    </div>
  );
}
