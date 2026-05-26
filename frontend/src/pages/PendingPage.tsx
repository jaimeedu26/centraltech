// src/pages/PendingPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const fmt = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PendingPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ clientName: '', amount: '', reason: '' });
  const [msg, setMsg] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['pending'],
    queryFn: () => api.get('/pending').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/pending', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending'] }); setForm({ clientName: '', amount: '', reason: '' }); setMsg('✅ Pendência registrada!'); },
    onError: (e: any) => setMsg('❌ ' + (e.response?.data?.message || 'Erro.')),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/pending/${id}/resolve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending'] }); setMsg('✅ Pendência resolvida e entrada registrada!'); },
    onError: (e: any) => setMsg('❌ ' + (e.response?.data?.message || 'Erro.')),
  });

  const statusBadge: any = {
    PENDING:   'bg-amber-100 text-amber-700',
    RESOLVED:  'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  const statusLabel: any = { PENDING: 'Pendente', RESOLVED: 'Resolvida', CANCELLED: 'Cancelada' };

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Pendências</h2>
      {msg && <p className="mb-4 text-sm p-3 bg-gray-100 rounded-lg">{msg}</p>}

      {/* Formulário */}
      <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, amount: parseFloat(form.amount) }); }}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Nova pendência</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Cliente (opcional)</label>
            <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Valor (R$) *</label>
            <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="0,00" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Motivo *</label>
          <input required value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
            placeholder="ex: PIX não compensado, boleto aguardando..." />
        </div>
        <button type="submit" disabled={createMutation.isPending} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {createMutation.isPending ? 'Registrando...' : 'Registrar pendência'}
        </button>
      </form>

      {/* Lista */}
      {isLoading ? <p className="text-gray-500">Carregando...</p> : (
        <div className="space-y-3">
          {data.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Nenhuma pendência registrada.</p>}
          {data.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge[p.status]}`}>{statusLabel[p.status]}</span>
                  {p.clientName && <span className="text-xs text-gray-500">{p.clientName}</span>}
                </div>
                <p className="text-sm text-gray-700">{p.reason}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{fmt(p.amount)}</p>
                {p.status === 'PENDING' && (
                  <button onClick={() => resolveMutation.mutate(p.id)}
                    className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
