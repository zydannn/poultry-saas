'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Pencil, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

interface DailyRow {
  id: string;
  date: string;
  shift?: string;
  flock_id?: string;
  flock_name?: string;
  good_eggs: number;
  broken_eggs: number;
  feed_consumed_kg: number;
  mortality: number;
}

export default function ProductionTab() {
  const [data, setData] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DailyRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: records } = await supabase
      .from('daily_records')
      .select('*, flocks(name)')
      .order('date', { ascending: false });

    if (records) {
      setData(records.map((r: any) => ({
        id:               r.id,
        date:             r.date,
        shift:            r.shift,
        flock_id:         r.flock_id,
        flock_name:       r.flocks?.name ?? '—',
        good_eggs:        Number(r.good_eggs),
        broken_eggs:      Number(r.broken_eggs),
        feed_consumed_kg: Number(r.feed_consumed_kg),  // numeric → Number agar tidak string
        mortality:        Number(r.mortality),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setIsDeleting(id);
    await supabase.from('daily_records').delete().eq('id', id);
    setIsDeleting(null);
    fetchData();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const { data: updated, error } = await supabase
        .from('daily_records')
        .update({
          date:             editing.date,
          good_eggs:        editing.good_eggs,
          broken_eggs:      editing.broken_eggs,
          feed_consumed_kg: editing.feed_consumed_kg,
          mortality:        editing.mortality,
        })
        .eq('id', editing.id)
        .select('id');          // .select() agar bisa deteksi 0 row updated

      if (error) throw error;

      // Jika 0 baris terupdate → kemungkinan sesi habis atau data milik user lain
      if (!updated || updated.length === 0) {
        throw new Error('Data gagal disimpan. Coba refresh halaman dan login ulang jika masalah berlanjut.');
      }

      setEditing(null);
      await fetchData();        // await agar tabel langsung refresh sebelum modal hilang
    } catch (error: any) {
      setUpdateError(error?.message ?? 'Gagal memperbarui data.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (data.length === 0) return <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-xl text-sm">Belum ada log produksi.</div>;

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Batch</th>
                <th className="px-4 py-3.5">Shift</th>
                <th className="px-4 py-3.5">Telur Baik</th>
                <th className="px-4 py-3.5">Telur Retak</th>
                <th className="px-4 py-3.5">Pakan (Kg)</th>
                <th className="px-4 py-3.5">Mortalitas</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {data.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                  <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
                    {new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 font-medium">{item.flock_name}</td>
                  <td className="px-4 py-3">
                    {item.shift ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.shift === 'Pagi' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {item.shift}
                      </span>
                    ) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{item.good_eggs} <span className="text-xs font-normal text-emerald-400">butir</span></td>
                  <td className="px-4 py-3">{item.broken_eggs} <span className="text-xs text-zinc-400">butir</span></td>
                  <td className="px-4 py-3">{item.feed_consumed_kg} <span className="text-xs text-zinc-400">Kg</span></td>
                  <td className="px-4 py-3">{item.mortality} <span className="text-xs text-zinc-400">ekor</span></td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex justify-center gap-1.5 items-center">
                      <button onClick={() => { setEditing(item); setUpdateError(null); setConfirmDeleteId(null); }}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded-md transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === item.id ? (
                        <>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors">Batal</button>
                          <button onClick={() => handleDelete(item.id)} disabled={isDeleting === item.id}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 leading-tight">Sunting Log Produksi</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-0.5">
                  {editing.flock_name} {editing.shift ? `· ${editing.shift}` : ''}
                </p>
              </div>
              <button disabled={isUpdating} onClick={() => setEditing(null)} className="text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Tanggal</label>
                <input type="date" value={editing.date} onChange={(e) => setEditing({...editing, date: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-wide">Telur Baik</label>
                  <input type="number" min="0" value={editing.good_eggs} onChange={(e) => setEditing({...editing, good_eggs: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-wide">Telur Retak</label>
                  <input type="number" min="0" value={editing.broken_eggs} onChange={(e) => setEditing({...editing, broken_eggs: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-wide">Pakan (Kg)</label>
                  <input type="number" min="0" step="0.01" value={editing.feed_consumed_kg} onChange={(e) => setEditing({...editing, feed_consumed_kg: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-wide">Mortalitas</label>
                  <input type="number" min="0" value={editing.mortality} onChange={(e) => setEditing({...editing, mortality: Number(e.target.value)})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none" required />
                </div>
              </div>

              {updateError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {updateError}
                </div>
              )}

              <div className="pt-3">
                <button type="submit" disabled={isUpdating} className="w-full flex justify-center items-center gap-2 bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-70">
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
