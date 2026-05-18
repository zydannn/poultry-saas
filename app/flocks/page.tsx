"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/utils/supabase/client';
import { createFlock } from './actions';
import {
  Egg,
  Plus,
  Loader2,
  Trash2,
  RefreshCw,
  Bird,
  CalendarDays,
  Users,
  Building2,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type FlockStatus = 'Aktif' | 'Afkir' | 'Selesai';

interface Flock {
  id: string;
  name: string;
  breed: string;
  hatch_date: string;
  initial_population: number;
  current_population: number;
  status: FlockStatus;
  created_at: string;
}

interface FarmAsset {
  id: string;
  asset_name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcAgeWeeks = (hatchDate: string): number => {
  const diff = Date.now() - new Date(hatchDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
};

const STATUS_STYLES: Record<FlockStatus, string> = {
  Aktif: 'bg-emerald-100 text-emerald-700',
  Afkir: 'bg-amber-100 text-amber-700',
  Selesai: 'bg-zinc-100 text-zinc-500',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [farmAssets, setFarmAssets] = useState<FarmAsset[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name:                      '',
    breed:                     'Ayam Arab',
    hatch_date:                new Date().toISOString().split('T')[0],
    initial_population:        '',
    acquisition_cost_total:    '',
    estimated_productive_days: '600',
    notes:                     '',
    farm_asset_id:             '',
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsFetching(true);
    const [flocksRes, assetsRes] = await Promise.all([
      supabase.from('flocks').select('*').order('created_at', { ascending: false }),
      supabase.from('farm_assets').select('id, asset_name').order('asset_name'),
    ]);
    setFlocks((flocksRes.data as Flock[]) ?? []);
    setFarmAssets((assetsRes.data as FarmAsset[]) ?? []);
    setIsFetching(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pop = parseInt(form.initial_population, 10);
    if (!form.name || !form.breed || !form.hatch_date || isNaN(pop) || pop < 1) {
      setFormError('Mohon lengkapi semua kolom wajib.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    setFormSuccess(false);

    const result = await createFlock({
      name:                      form.name,
      breed:                     form.breed,
      hatch_date:                form.hatch_date,
      initial_population:        pop,
      acquisition_cost_total:    form.acquisition_cost_total ? Number(form.acquisition_cost_total) : 0,
      estimated_productive_days: Number(form.estimated_productive_days) || 600,
      farm_asset_id:             form.farm_asset_id || undefined,
    });

    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setFormSuccess(true);
    setForm({
      name: '', breed: 'Ayam Arab', hatch_date: new Date().toISOString().split('T')[0],
      initial_population: '', acquisition_cost_total: '', estimated_productive_days: '600',
      notes: '', farm_asset_id: '',
    });
    setShowForm(false);
    fetchData();
    setTimeout(() => setFormSuccess(false), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus batch ini? Data input harian yang terhubung akan ikut terhapus.')) return;
    setIsDeleting(id);
    setDeleteError(null);
    const { error } = await supabase.from('flocks').delete().eq('id', id);
    setIsDeleting(null);
    if (error) {
      setDeleteError(`Gagal menghapus batch: ${error.message}`);
      return;
    }
    fetchData();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Bird className="w-5 h-5 text-amber-600" />
                Manajemen Batch Ayam
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Kelola batch ayam petelur yang aktif di peternakan Anda.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={isFetching}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah Batch
              </button>
            </div>
          </div>

          {/* ── Add Flock Form (collapsible) ───────────────────────────────── */}
          {showForm && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">Data Batch Baru</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Kandang Fisik */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Kandang Fisik <span className="text-zinc-400 normal-case font-normal">(Opsional — pilih dari Manajemen Aset)</span>
                  </label>
                  <select name="farm_asset_id" value={form.farm_asset_id} onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
                    <option value="">— Tidak ditetapkan —</option>
                    {farmAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.asset_name}</option>
                    ))}
                  </select>
                  {farmAssets.length === 0 && (
                    <p className="text-[10px] text-amber-600">Belum ada aset kandang. Tambahkan dulu di menu Pusat Data → Aset.</p>
                  )}
                </div>

                {/* Nama Batch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Nama Batch <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Contoh: Batch Mei 2025, Periode 1"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" required />
                </div>

                {/* Ras */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Ras / Jenis Ayam <span className="text-red-500">*</span></label>
                  <select name="breed" value={form.breed} onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" required>
                    <option value="Ayam Arab">Ayam Arab</option>
                    <option value="Lohmann Brown">Lohmann Brown</option>
                    <option value="ISA Brown">ISA Brown</option>
                    <option value="ISA White">ISA White</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* DOC */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Tanggal Tetas (DOC) <span className="text-red-500">*</span></label>
                  <input type="date" name="hatch_date" value={form.hatch_date} onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" required />
                </div>

                {/* Populasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Populasi Awal <span className="text-zinc-400 normal-case">(Ekor)</span> <span className="text-red-500">*</span>
                  </label>
                  <input type="number" name="initial_population" value={form.initial_population} onChange={handleChange}
                    min="1" placeholder="Contoh: 5000"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" required />
                  <p className="text-[10px] text-zinc-400">Wajib diisi — dasar kalkulasi HPP & BEP</p>
                </div>

                {/* Harga Perolehan Ayam */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Harga Perolehan Ayam <span className="text-zinc-400 normal-case">(Rp — Aset Biologis)</span>
                  </label>
                  <input type="number" name="acquisition_cost_total" value={form.acquisition_cost_total} onChange={handleChange}
                    min="0" placeholder="Cth: 50000000"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                  <p className="text-[10px] text-zinc-400">Harga beli pullet/DOC. Digunakan untuk kalkulasi penyusutan biologis.</p>
                </div>

                {/* Masa Produktif */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Estimasi Masa Produktif <span className="text-zinc-400 normal-case">(Hari)</span>
                  </label>
                  <input type="number" name="estimated_productive_days" value={form.estimated_productive_days} onChange={handleChange}
                    min="1" placeholder="600"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                  <p className="text-[10px] text-zinc-400">Default: 600 hari (~20 bulan).</p>
                </div>

                {/* Catatan */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Catatan (Opsional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    rows={2} placeholder="Informasi tambahan tentang batch ini..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
                </div>

                {formError && (
                  <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium disabled:opacity-60">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Batch'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Delete Error Banner ──────────────────────────────────────────── */}
          {deleteError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800 font-medium flex-1">{deleteError}</p>
              <button onClick={() => setDeleteError(null)} className="text-rose-400 hover:text-rose-600 text-xs shrink-0">✕</button>
            </div>
          )}

          {/* ── Flocks List ─────────────────────────────────────────────────── */}
          {isFetching ? (
            <div className="flex justify-center py-16 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>

          ) : flocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-dashed border-zinc-300 rounded-2xl text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <Egg className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Belum ada batch terdaftar</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs leading-relaxed">
                Mulai dengan membuat batch ayam pertamamu. Semua input harian dan kalkulasi HPP akan terhubung ke batch ini.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium text-sm shadow-md"
              >
                <Plus className="w-4 h-4" />
                Tambah Batch Pertama
              </button>
            </div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flocks.map((flock) => {
                const ageWeeks = calcAgeWeeks(flock.hatch_date);
                const mortalityRate = flock.initial_population > 0
                  ? (((flock.initial_population - flock.current_population) / flock.initial_population) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div key={flock.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[flock.status]}`}>
                          {flock.status}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 mt-1.5">{flock.name}</h3>
                        <p className="text-xs text-zinc-500">{flock.breed}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(flock.id)}
                        disabled={isDeleting === flock.id}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isDeleting === flock.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="flex flex-col items-center bg-zinc-50 rounded-lg p-2.5">
                        <CalendarDays className="w-4 h-4 text-zinc-400 mb-1" />
                        <p className="text-sm font-bold text-zinc-900">{ageWeeks}</p>
                        <p className="text-[10px] text-zinc-500">Minggu</p>
                      </div>
                      <div className="flex flex-col items-center bg-zinc-50 rounded-lg p-2.5">
                        <Users className="w-4 h-4 text-zinc-400 mb-1" />
                        <p className="text-sm font-bold text-zinc-900">{flock.current_population.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-zinc-500">Ekor Hidup</p>
                      </div>
                      <div className="flex flex-col items-center bg-zinc-50 rounded-lg p-2.5">
                        <Egg className="w-4 h-4 text-zinc-400 mb-1" />
                        <p className="text-sm font-bold text-zinc-900">{mortalityRate}%</p>
                        <p className="text-[10px] text-zinc-500">Mortalitas</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-3">
                      Populasi awal: {flock.initial_population.toLocaleString('id-ID')} ekor &nbsp;·&nbsp;
                      DOC: {new Date(flock.hatch_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
