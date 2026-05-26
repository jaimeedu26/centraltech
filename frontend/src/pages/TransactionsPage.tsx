// src/pages/TransactionsPage.tsx
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const fmt = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const badges: any = {
  INCOME:   'bg-green-100 text-green-700',
  EXPENSE:  'bg-red-100 text-red-700',
  BLEED:    'bg-amber-100 text-amber-700',
  REINFORCE:'bg-blue-100 text-blue-700',
};
const typeLabel: any = { INCOME: 'Entrada', EXPENSE: 'Saída', BLEED: 'Sangria', REINFORCE: 'Reforço' };

export default function TransactionsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/transactions').then(r => r.data),
    refetchInterval: 15000,
  });

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Transações</h2>
      {isLoading ? <p className="text-gray-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tipo','Categoria','Forma pgto','Valor','Descrição','Data','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhuma transação no caixa atual.</td></tr>
              )}
              {data.map((t: any) => (
                <tr key={t.id} className={t.isCancelled ? 'opacity-40 line-through' : ''}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badges[t.type]}`}>{typeLabel[t.type]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.category}</td>
                  <td className="px-4 py-3 text-gray-500">{t.paymentMethod || '—'}</td>
                  <td className="px-4 py-3 font-medium">{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">{t.isCancelled ? <span className="text-red-500 text-xs">Cancelada</span> : <span className="text-green-600 text-xs">Ok</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
