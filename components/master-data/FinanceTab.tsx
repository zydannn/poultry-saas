'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Pencil, Trash2, X, Loader2, ArrowUpRight, ArrowDownRight, Package, AlertTriangle } from 'lucide-react';

interface FinanceRow {
  id: string;
  sourceTable: 'finance_income' | 'finance_expenses';
  date: string;
  category: string;
  notes: string;
  amount: number;
  cost_type?: string;
  // Income specific fields needed for edit
  quantity?: number;
  price_per_unit?: number;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function FinanceTab() {
  const [data, setData] = useState<FinanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FinanceRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: incomeData } = await supabase.from('finance_income').select('*');
    const { data: expenseData } = await supabase.from('finance_expenses').select('*');

    const combined: FinanceRow[] = [];

    if (incomeData) {
      incomeData.forEach(i => {
        combined.push({
          id: i.id,
          sourceTable: 'finance_income',
          date: i.date,
          category: i.category,
          notes: i.description || i.buyer_name || 'Penjualan',
          amount: Number(i.total_revenue),
          quantity: Number(i.quantity),
          price_per_unit: Number(i.price_per_unit)
        });
      });
    }

    if (expenseData) {
      expenseData.forEach(e => {
        combined.push({
          id: e.id,
          sourceTable: 'finance_expenses',
          date: e.date,
          category: e.category,
          notes: e.description || e.category,
          amount: Number(e.amount),
          cost_type: e.cost_type,
        });
      });
    }

    combined.sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
    setData(combined);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string, sourceTable: string) => {
    setConfirmDeleteId(null);
    setIsDeleting(id);
    await supabase.from(sourceTable).delete().eq('id', id);
    setIsDeleting(null);
    fetchData();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsUpdating(true);
    setUpdateError(null);

    try {
      if (editing.sourceTable === 'finance_income') {
        const payload = {
          date: editing.date,
          category: editing.category,
          description: editing.notes,
          quantity: editing.quantity,
          price_per_unit: editing.price_per_unit,
        };
        const { error } = await supabase.from('finance_income').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const payload = {
          date: editing.date,
          category: editing.category,
          description: editing.notes,
          amount: editing.amount
        };
        const { error } = await supabase.from('finance_expenses').update(payload).eq('id', editing.id);
        if (error) throw error;
      }
      setEditing(null);
      fetchData();
    } catch (error: any) {
      setUpdateError(error?.message ?? 'Gagal memperbarui data.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (data.length === 0) return <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-xl text-sm">Belum ada riwayat keuangan.</div>;

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5">Kategori / Asal</th>
                <th className="px-6 py-3.5">Keterangan</th>
                <th className="px-6 py-3.5 text-right">Nominal (Rp)</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {data.map((item, index) => {
                const isInventaris = item.sourceTable === 'finance_expenses' && item.cost_type === 'Inventaris';
                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-3 font-medium text-zinc-800">
                      <div className="flex items-center gap-2">
                        {item.sourceTable === 'finance_income' ? (
                          <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600"><ArrowUpRight className="w-3.5 h-3.5" /></div>
                        ) : isInventaris ? (
                          <div className="p-1.5 rounded-full bg-amber-50 text-amber-600"><Package className="w-3.5 h-3.5" /></div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-rose-50 text-rose-600"><ArrowDownRight className="w-3.5 h-3.5" /></div>
                        )}
                        <span>{item.category}</span>
                        {isInventaris && (
                          <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase">Aset</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600 truncate max-w-[250px]">{item.notes}</td>
                    <td className={`px-6 py-3 text-right font-bold whitespace-nowrap ${
                      item.sourceTable === 'finance_income' ? 'text-emerald-600' :
                      isInventaris ? 'text-amber-700' : 'text-zinc-900'
                    }`}>
                      {item.sourceTable === 'finance_income' ? '+' : '-'}{formatRupiah(item.amount)}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5 items-center">
                        <button onClick={() => { setEditing(item); setUpdateError(null); setConfirmDeleteId(null); }}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded-md transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors">Batal</button>
                            <button onClick={() => handleDelete(item.id, item.sourceTable)} disabled={isDeleting === item.id}
                              className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60">
                              {isDeleting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              Hapus
                            </button>
                          </>
                        ) : (
                          <button disabled={isDeleting === item.id} onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                            {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 leading-tight">Sunting Keuangan</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-0.5">
                  {editing.sourceTable === 'finance_income' ? 'PEMASUKAN' : 'PENGELUARAN'}
                </p>
              </div>
              <button disabled={isUpdating} onClick={() => setEditing(null)} className="text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Tanggal</label>
                <input type="date" value={editing.date} onChange={(e) => setEditing({...editing, date: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
              </div>

              {editing.sourceTable === 'finance_income' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Kuantitas</label>
                    <input type="number" value={editing.quantity || 0} onChange={(e) => setEditing({...editing, quantity: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Harga Satuan</label>
                    <input type="number" value={editing.price_per_unit || 0} onChange={(e) => setEditing({...editing, price_per_unit: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                  <input type="number" value={editing.amount} onChange={(e) => setEditing({...editing, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Keterangan</label>
                <textarea rows={2} value={editing.notes} onChange={(e) => setEditing({...editing, notes: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
              </div>

              {updateError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {updateError}
                </div>
              )}

              <div className="pt-3">
                <button type="submit" disabled={isUpdating} className="w-full flex justify-center bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-70">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
