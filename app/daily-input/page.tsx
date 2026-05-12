'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/utils/supabase/client';
import {
  ClipboardList, Egg, Wheat, Skull, AlertTriangle,
  CheckCircle2, Loader2, Bird,
} from 'lucide-react';

interface Flock {
  id: string;
  name: string;
  breed: string;
  status: string;
  current_population: number;
}

interface DailyRecord {
  id: string;
  date: string;
  shift: string;
  flock_name: string;
  good_eggs: number;
  broken_eggs: number;
  feed_consumed_kg: number;
  mortality: number;
}

const initialForm = {
  flock_id: '',
  date: new Date().toISOString().split('T')[0],
  shift: 'Pagi',
  good_eggs: '',
  broken_eggs: '',
  feed_consumed_kg: '',
  mortality: '',
};

export default function DailyInputPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [recentRecords, setRecentRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [flocksRes, recordsRes] = await Promise.all([
      supabase.from('flocks').select('id, name, breed, status, current_population').order('created_at'),
      supabase
        .from('daily_records')
        .select('*, flocks(name)')
        .order('date', { ascending: false })
        .order('shift', { ascending: true })
        .limit(10),
    ]);

    const flockList = (flocksRes.data ?? []) as Flock[];
    setFlocks(flockList);

    setForm(prev =>
      prev.flock_id || flockList.length === 0
        ? prev
        : { ...prev, flock_id: flockList[0].id }
    );

    setRecentRecords(
      (recordsRes.data ?? []).map((r: any) => ({
        id: r.id,
        date: r.date,
        shift: r.shift ?? 'Pagi',
        flock_name: r.flocks?.name ?? '—',
        good_eggs: Number(r.good_eggs ?? 0),
        broken_eggs: Number(r.broken_eggs ?? 0),
        feed_consumed_kg: Number(r.feed_consumed_kg ?? 0),
        mortality: Number(r.mortality ?? 0),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedFlock = flocks.find(f => f.id === form.flock_id);
  const goodEggs = Number(form.good_eggs) || 0;
  const brokenEggs = Number(form.broken_eggs) || 0;
  const totalEggs = goodEggs + brokenEggs;
  const hdp =
    selectedFlock && selectedFlock.current_population > 0 && goodEggs > 0
      ? ((goodEggs / selectedFlock.current_population) * 100).toFixed(1)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.flock_id) {
      setError('Pilih batch kandang terlebih dahulu.');
      return;
    }

    const mortality = Number(form.mortality) || 0;

    if (selectedFlock && mortality > selectedFlock.current_population) {
      setError(
        `Mortalitas (${mortality}) melebihi populasi hidup saat ini (${selectedFlock.current_population} ekor).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('daily_records').insert({
        flock_id: form.flock_id,
        date: form.date,
        shift: form.shift,
        good_eggs: goodEggs,
        broken_eggs: brokenEggs,
        feed_consumed_kg: parseFloat(form.feed_consumed_kg) || 0,
        mortality,
        user_id: user?.id,
      });

      if (insertError) throw insertError;

      // Deduct mortality from flock population
      if (mortality > 0 && selectedFlock) {
        await supabase
          .from('flocks')
          .update({ current_population: selectedFlock.current_population - mortality })
          .eq('id', form.flock_id);
      }

      setSuccess(true);
      setForm(prev => ({
        ...prev,
        good_eggs: '',
        broken_eggs: '',
        feed_consumed_kg: '',
        mortality: '',
      }));
      await fetchData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.message ?? 'Gagal menyimpan data harian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Input Harian Produksi
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Catat produksi telur, konsumsi pakan, dan mortalitas harian.
              Biaya variabel pakan otomatis tercatat ke HPP.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── Left: Form ────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Bird className="w-4 h-4 text-amber-600" />
                  Data Produksi
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-rose-800 font-medium leading-snug">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-800 font-medium">
                        Data produksi berhasil disimpan! Biaya pakan otomatis tercatat.
                      </p>
                    </div>
                  )}

                  {/* Batch */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                      Batch Kandang
                    </label>
                    {flocks.length === 0 && !loading ? (
                      <div className="px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-xs text-amber-700">
                        Belum ada batch. Tambahkan dulu di menu Manajemen Batch.
                      </div>
                    ) : (
                      <select
                        value={form.flock_id}
                        onChange={e => setForm(prev => ({ ...prev, flock_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        required
                      >
                        <option value="">— Pilih batch —</option>
                        {flocks.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.current_population.toLocaleString('id-ID')} ekor)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Date + Shift */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        Shift
                      </label>
                      <select
                        value={form.shift}
                        onChange={e => setForm(prev => ({ ...prev, shift: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      >
                        <option value="Pagi">Pagi</option>
                        <option value="Sore">Sore</option>
                      </select>
                    </div>
                  </div>

                  {/* Eggs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                        <Egg className="w-3.5 h-3.5" /> Telur Baik (butir)
                      </label>
                      <input
                        type="number" min="0" value={form.good_eggs}
                        onChange={e => setForm(prev => ({ ...prev, good_eggs: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Telur Retak (butir)
                      </label>
                      <input
                        type="number" min="0" value={form.broken_eggs}
                        onChange={e => setForm(prev => ({ ...prev, broken_eggs: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Feed + Mortality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-yellow-700 mb-1.5 flex items-center gap-1">
                        <Wheat className="w-3.5 h-3.5" /> Pakan (Kg)
                      </label>
                      <input
                        type="number" min="0" step="0.01" value={form.feed_consumed_kg}
                        onChange={e => setForm(prev => ({ ...prev, feed_consumed_kg: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1">
                        <Skull className="w-3.5 h-3.5" /> Mortalitas (ekor)
                      </label>
                      <input
                        type="number" min="0" value={form.mortality}
                        onChange={e => setForm(prev => ({ ...prev, mortality: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Live preview */}
                  {totalEggs > 0 && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Total Telur Hari Ini</span>
                        <span className="font-bold text-zinc-900">
                          {totalEggs.toLocaleString('id-ID')} butir
                        </span>
                      </div>
                      {hdp && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">HDP (Hen Day Production)</span>
                          <span className={`font-bold ${Number(hdp) >= 80 ? 'text-emerald-600' : Number(hdp) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {hdp}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting || flocks.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ClipboardList className="w-4 h-4" />
                      )}
                      {submitting ? 'Menyimpan...' : 'Simpan Data Harian'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Flock info card */}
              {selectedFlock && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs">
                  <p className="font-bold text-amber-900 mb-1">{selectedFlock.name}</p>
                  <div className="space-y-0.5 text-amber-700">
                    <p>Populasi saat ini: <strong>{selectedFlock.current_population.toLocaleString('id-ID')} ekor</strong></p>
                    <p>Ras: {selectedFlock.breed}</p>
                    <p className="text-amber-500 mt-1 text-[10px]">
                      Biaya pakan otomatis masuk ke HPP setelah simpan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Recent Records ──────────────────────────────── */}
            <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Log Produksi Terbaru
                </h2>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">10 entri terakhir</span>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
                </div>
              ) : recentRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <ClipboardList className="w-12 h-12 text-zinc-200 mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">Belum ada log produksi</p>
                  <p className="text-xs text-zinc-400 mt-1">Mulai catat produksi harian Anda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold uppercase text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Tanggal / Batch</th>
                        <th className="px-4 py-3 text-emerald-600">Telur Baik</th>
                        <th className="px-4 py-3">Retak</th>
                        <th className="px-4 py-3">Pakan</th>
                        <th className="px-4 py-3">Mortalitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60">
                      {recentRecords.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={idx % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-zinc-900">
                              {new Date(r.date + 'T00:00:00').toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {r.flock_name}
                              {r.shift && (
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full font-bold ${
                                  r.shift === 'Pagi'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {r.shift}
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600 text-sm">
                            {r.good_eggs.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 text-sm">{r.broken_eggs}</td>
                          <td className="px-4 py-3 text-zinc-600 text-sm">
                            {r.feed_consumed_kg}
                            <span className="text-[10px] text-zinc-400 ml-1">Kg</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {r.mortality > 0 ? (
                              <span className="text-rose-600 font-medium">{r.mortality}</span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
