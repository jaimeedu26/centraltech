// src/pages/CashPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';

const CATEGORIAS_ENTRADA = [
  'Pagamento de contas', 'PIX', 'Assistência técnica',
  'Venda de acessórios', 'Impressão', 'Xerox', 'Recarga', 'Outros',
];
const CATEGORIAS_SAIDA = ['Fornecedor', 'Material', 'Lanche', 'Retirada', 'Motoboy', 'Outros'];
const FORMAS_PGTO = ['Dinheiro', 'PIX', 'Crédito', 'Débito', 'Outros'];

export default function CashPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'entrada' | 'saida' | 'sangria' | 'reforco'>('entrada');
  const [form, setForm] = useState<any>({ amount: '', category: '', paymentMethod: '', description: '' });
  const [closeForm, setCloseForm] = useState({ physicalAmount: '', closingNote: '' });
  const [openForm, setOpenForm] = useState({ openingAmount: '', openingNote: '' });
  const [msg, setMsg] = useState('');

  const { data: cash, isLoading } = useQuery({
    queryKey: ['cash-current'],
    queryFn: () => api.get('/cash/current').then(r => r.data),
  });

  const openMutation = useMutation({
    mutationFn: (data: any) => api.post('/cash/open', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-current'] }); setMsg('✅ Caixa aberto!'); },
    onError: (e: any) => setMsg('❌ ' + (e.response?.data?.message || 'Erro ao abrir caixa.')),
  });

  const transactionMutation = useMutation({
    mutationFn: (data: any) => api.post('/transactions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setForm({ amount: '', category: '', paymentMethod: '', description: '' });
      setMsg('✅ Registrado com sucesso!');
    },
    onError: (e: any) => setMsg('❌ ' + (e.response?.data?.message || 'Erro ao registrar.')),
  });

  const closeMutation = useMutation({
    mutationFn: (data: any) => api.post('/cash/close', data),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['cash-current'] });
      const d = r.data;
      setMsg(`✅ Caixa fechado! Esperado: ${fmt(d.summary?.expectedAmount)} | Físico: ${fmt(Number(d.physicalAmount))} | Diferença: ${fmt(d.summary?.differenceAmount)}`);
    },
    onError: (e: any) => setMsg('❌ ' + (e.response?.data?.message || 'Erro ao fechar caixa.')),
  });

  const typeMap: any = { entrada: 'INCOME', saida: 'EXPENSE', sangria: 'BLEED', reforco: 'REINFORCE' };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    transactionMutation.mutate({ ...form, type: typeMap[tab], amount: parseFloat(form.amount) });
  };

  if (isLoading) return <div className="p-8 text-gray-500">Carregando...</div>;

  // ── Caixa fechado: tela de abertura ──────────────────────────
  if (!cash) {
    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Abrir caixa</h2>
        {msg && <p className="mb-4 text-sm p-3 bg-gray-100 rounded-lg">{msg}</p>}
        <form onSubmit={e => { e.preventDefault(); openMutation.mutate({ ...openForm, openingAmount: parseFloat(openForm.openingAmount) || 0 }); }} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Valor inicial (troco) R$</label>
            <input type="number" min="0" step="0.01" value={openForm.openingAmount} onChange={e => setOpenForm(p => ({ ...p, openingAmount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="0,00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Observação (opcional)</label>
            <input type="text" value={openForm.openingNote} onChange={e => setOpenForm(p => ({ ...p, openingNote: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <button type="submit" disabled={openMutation.isPending} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {openMutation.isPending ? 'Abrindo...' : 'Abrir caixa'}
          </button>
        </form>
      </div>
    );
  }

  // ── Caixa aberto: operação ───────────────────────────────────
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Caixa aberto</h2>
          <p className="text-sm text-gray-500 mt-1">Aberto às {new Date(cash.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">● Aberto</span>
      </div>

      {msg && <p className="mb-4 text-sm p-3 bg-gray-100 rounded-lg">{msg}</p>}

      {/* Tabs de operação */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['entrada','Entrada','text-green-700'], ['saida','Saída','text-red-600'], ['sangria','Sangria','text-amber-600'], ['reforco','Reforço','text-blue-600']].map(([t, l, c]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${tab === t ? 'bg-gray-900 text-white border-gray-900' : `border-gray-300 ${c} hover:border-gray-900`}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Formulário de transação */}
      <form onSubmit={handleTransaction} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Valor (R$) *</label>
            <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm((p:any) => ({ ...p, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="0,00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Categoria *</label>
            <select required value={form.category} onChange={e => setForm((p:any) => ({ ...p, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900">
              <option value="">Selecione...</option>
              {(tab === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {tab === 'entrada' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Forma de pagamento</label>
            <select value={form.paymentMethod} onChange={e => setForm((p:any) => ({ ...p, paymentMethod: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900">
              <option value="">Selecione...</option>
              {FORMAS_PGTO.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Descrição {tab === 'saida' ? '*' : '(opcional)'}</label>
          <input type="text" value={form.description} onChange={e => setForm((p:any) => ({ ...p, description: e.target.value }))}
            required={tab === 'saida'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
        <button type="submit" disabled={transactionMutation.isPending}
          className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {transactionMutation.isPending ? 'Registrando...' : 'Registrar'}
        </button>
      </form>

      {/* Fechamento de caixa */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">⚠️ Fechar caixa</h3>
        <form onSubmit={e => {
          e.preventDefault();
          if (!confirm('Tem certeza? O fechamento é irreversível.')) return;
          closeMutation.mutate({ ...closeForm, physicalAmount: parseFloat(closeForm.physicalAmount) });
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Valor físico contado (R$) *</label>
            <input type="number" min="0" step="0.01" required value={closeForm.physicalAmount} onChange={e => setCloseForm(p => ({ ...p, physicalAmount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="0,00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Observação (obrigatória se houver diferença)</label>
            <input type="text" value={closeForm.closingNote} onChange={e => setCloseForm(p => ({ ...p, closingNote: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <button type="submit" disabled={closeMutation.isPending}
            className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {closeMutation.isPending ? 'Fechando...' : 'Fechar caixa'}
          </button>
        </form>
      </div>
    </div>
  );
}
