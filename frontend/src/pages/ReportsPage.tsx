// src/pages/ReportsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [tipo, setTipo] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', tipo, date],
    queryFn: () => {
      const d = new Date(date);
      if (tipo === 'monthly') return api.get(`/reports/monthly?year=${d.getFullYear()}&month=${d.getMonth() + 1}`).then(r => r.data);
      return api.get(`/reports/${tipo}?date=${date}`).then(r => r.data);
    },
    enabled: false,
  });

  return (
    <div className="p-8 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Relatórios</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Período</label>
            <div className="flex gap-2">
              {['daily','weekly','monthly'].map(t => (
                <button key={t} onClick={() => setTipo(t as any)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-900'}`}>
                  {t === 'daily' ? 'Diário' : t === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Data referência</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <button onClick={() => refetch()} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
            Gerar relatório
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Gerando relatório...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              ['Entradas', data.resumo?.entradas, 'text-green-700'],
              ['Saídas', data.resumo?.saidas, 'text-red-600'],
              ['Saldo', data.resumo?.saldo, 'text-gray-900'],
              ['Transações', data.transacoes?.length, 'text-gray-900'],
            ].map(([l, v, c]) => (
              <div key={l as string} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{l}</p>
                <p className={`text-xl font-bold ${c}`}>{typeof v === 'number' && l !== 'Transações' ? fmt(v) : v}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Tipo','Categoria','Valor','Descrição','Operador','Data/hora'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.transacoes?.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-xs">{t.type}</td>
                    <td className="px-4 py-2">{t.category}</td>
                    <td className="px-4 py-2 font-medium">{fmt(t.amount)}</td>
                    <td className="px-4 py-2 text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{t.user?.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
