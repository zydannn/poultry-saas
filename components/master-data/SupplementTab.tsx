'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Pencil, Trash2, X, Loader2, AlertTriangle, FlaskConical } from 'lucide-react';

interface SupplementRow {
  id: string;
  date: string;
  flock_id?: string;
  flock_name?: string;
  category: string;
  item_name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Probiotik: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Vaksin:    'bg-blue-50 text-blue-700 border-blue-200',
  Vitamin:   'bg-amber-50 text-amber-700 border-amber-200',
  Obat:      'bg-rose-50 text-rose-700 border-rose-200',
  Lainnya:   'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export default function SupplementTab() {
  const [data, setData] = useState<SupplementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SupplementRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('daily_supplements')
      .select('*, flocks(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (rows) {
      setData(
        rows.map((r: any) => ({
          id:         r.id,
          date:       r.date,
          flock_id:   r.flock_id,
          flock_name: r.flocks?.name ?? '—',
          category:   r.category,
          item_name:  r.item_name,
          quantity:   Number(r.quantity),
          unit:       r.unit,
          notes:      r.notes,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setIsDeleting(id);
    await supabase.from('daily_supplements').delete().eq('id', id);
    setIsDeleting(null);
    fetchData();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const { error } = await supabase
        .from('daily_supplements')
        .update({
          date:      editing.date,
          category:  editing.category,
          item_name: editing.item_name,
          quantity:  editing.quantity,
          unit:      editing.unit,
          notes:     editing.notes || null,
        })
        .eq('id', editing.id);
      if (error) throw error;
      setEditing(null);
      fetchData();
    } catch (error: any) {
      setUpdateError(error?.message ?? 'Gagal memperbarui data.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 flex justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  if (data.length === 0)
    return (
      <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-xl text-sm">
        Belum ada riwayat pemberian suplemen atau obat.
      </div>
    );

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Batch</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Item</th>
                <th className="px-4 py-3.5 text-right">Kuantitas</th>
                <th className="px-4 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {data.map((item, index) => {
                const catClass =
                  CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS['Lainnya'];
                return (
                  <tr
                    key={item.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white hover:bg-zinc-50/80'
                        : 'bg-zinc-50/50 hover:bg-zinc-50/80'
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-700 font-medium">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{item.flock_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catClass}`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.item_name}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-bold text-zinc-800">
                        {item.quantity.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-zinc-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 truncate max-w-[180px]">
                      {item.notes || <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5 items-center">
                        <button
                          onClick={() => {
                            setEditing(item);
                            setUpdateError(null);
                            setConfirmDeleteId(null);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting === item.id}
                              className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60"
                            >
                              {isDeleting === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Hapus
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={isDeleting === item.id}
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            {isDeleting === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 leading-tight flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Sunting Suplemen
                </h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-0.5">
                  {editing.flock_name}
                </p>
              </div>
              <button
                disabled={isUpdating}
                onClick={() => setEditing(null)}
                className="text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Kategori
                  </label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-1 outline-none"
                  >
                    <option value="Probiotik">Probiotik</option>
                    <option value="Vaksin">Vaksin</option>
                    <option value="Vitamin">Vitamin</option>
                    <option value="Obat">Obat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Item
                  </label>
                  <input
                    type="text"
                    value={editing.item_name}
                    onChange={(e) => setEditing({ ...editing, item_name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Kuantitas
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.quantity}
                    onChange={(e) =>
                      setEditing({ ...editing, quantity: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Satuan
                  </label>
                  <select
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-1 outline-none"
                  >
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="gr">gr</option>
                    <option value="Kg">Kg</option>
                    <option value="butir">butir</option>
                    <option value="sachet">sachet</option>
                    <option value="ampul">ampul</option>
                    <option value="bungkus">bungkus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                  Keterangan
                </label>
                <textarea
                  rows={2}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 outline-none"
                  placeholder="Opsional..."
                />
              </div>

              {updateError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {updateError}
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex justify-center items-center gap-2 bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-70"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
