'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Loader2, Trash2, PlusCircle, Building2, Bird, Factory, Truck } from 'lucide-react';

interface Asset {
  id: string;
  asset_name: string;
  category: string;
  acquisition_cost: number;
  useful_life_months: number;
  purchase_date: string;
  is_production_asset: boolean;
}

interface BiologicalAsset {
  id: string;
  name: string;
  breed: string;
  hatch_date: string;
  acquisition_cost_total: number;
  estimated_productive_days: number;
  status: string;
}

const ASSET_CATEGORIES = [
  'Infrastruktur',
  'Kandang',
  'Mesin Produksi',
  'Peralatan Kandang',
  'Kendaraan',
  'Peralatan Kantor',
  'Lainnya',
];

const INACTIVE_STATUSES = ['Afkir', 'Selesai', 'Archived', 'Inactive'];

const formatRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const calcRemainingMonths = (hatchDate: string, productiveDays: number): number => {
  const elapsed = Math.floor((Date.now() - new Date(hatchDate).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.ceil((productiveDays - elapsed) / 30));
};

export default function AssetTab() {
  const [assets, setAssets]       = useState<Asset[]>([]);
  const [bioAssets, setBioAssets] = useState<BiologicalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting]     = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Form state
  const [assetName, setAssetName]           = useState('');
  const [category, setCategory]             = useState('Infrastruktur');
  const [cost, setCost]                     = useState('');
  const [lifeMonths, setLifeMonths]         = useState('');
  const [purchaseDate, setPurchaseDate]     = useState('');
  const [isProduction, setIsProduction]     = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [physicalRes, bioRes] = await Promise.all([
      supabase.from('farm_assets')
        .select('id, asset_name, category, acquisition_cost, useful_life_months, purchase_date, is_production_asset')
        .order('is_production_asset', { ascending: false })
        .order('category')
        .order('asset_name'),
      supabase.from('flocks')
        .select('id, name, breed, hatch_date, acquisition_cost_total, estimated_productive_days, status')
        .not('acquisition_cost_total', 'is', null)
        .gt('acquisition_cost_total', 0)
        .order('hatch_date', { ascending: false }),
    ]);
    if (physicalRes.data) setAssets(physicalRes.data as Asset[]);
    if (bioRes.data)      setBioAssets(bioRes.data as BiologicalAsset[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setAssetName(''); setCategory('Infrastruktur'); setCost('');
    setLifeMonths(''); setPurchaseDate(''); setIsProduction(true);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    const costNum = Number(cost);
    const lifeNum = Number(lifeMonths);
    if (!assetName.trim() || costNum <= 0 || lifeNum <= 0 || !purchaseDate) {
      setFormError('Mohon isi semua field. Harga perolehan dan umur ekonomis harus lebih dari 0.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setFormError('Sesi tidak ditemukan. Silakan login ulang.'); return; }

      const { error } = await supabase.from('farm_assets').insert([{
        user_id:             user.id,
        asset_name:          assetName.trim(),
        category,
        acquisition_cost:    costNum,
        useful_life_months:  lifeNum,
        purchase_date:       purchaseDate,
        is_production_asset: isProduction,
      }]);
      if (error) { setFormError(`Gagal menyimpan: ${error.message}`); return; }
      resetForm();
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    setConfirmDeleteId(null);
    setIsDeleting(id);
    await supabase.from('farm_assets').delete().eq('id', id);
    setIsDeleting(null);
    fetchData();
  };

  // Toggle is_production_asset inline
  const handleToggleProduction = async (asset: Asset) => {
    const newVal = !asset.is_production_asset;
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_production_asset: newVal } : a));
    await supabase.from('farm_assets').update({ is_production_asset: newVal }).eq('id', asset.id);
  };

  const prodAssets   = assets.filter(a => a.is_production_asset);
  const opexAssets   = assets.filter(a => !a.is_production_asset);
  const activeFlocks = bioAssets.filter(f => !INACTIVE_STATUSES.includes(f.status));

  const totalBOPDeprec = prodAssets.reduce((s, a) =>
    s + (a.useful_life_months > 0 ? a.acquisition_cost / a.useful_life_months : 0), 0);
  const totalOpexDeprec = opexAssets.reduce((s, a) =>
    s + (a.useful_life_months > 0 ? a.acquisition_cost / a.useful_life_months : 0), 0);
  const totalBioDeprec = activeFlocks.reduce((s, f) =>
    s + (f.acquisition_cost_total / Math.max(f.estimated_productive_days, 1) * 30), 0);

  return (
    <div className="space-y-6">

      {/* ── Add Asset Form ──────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-5">
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          Tambah Aset Fisik Baru
        </h3>
        <form onSubmit={handleAddAsset}>
          {formError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span className="shrink-0 mt-0.5">⚠</span><span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span>✓</span><span>Aset berhasil ditambahkan!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Nama Aset</label>
              <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)}
                placeholder="Cth: Kandang Blok A"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all">
                {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Harga Perolehan (Rp)</label>
              <input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Umur Ekonomis (Bulan)</label>
              <input type="number" min="1" value={lifeMonths} onChange={e => setLifeMonths(e.target.value)}
                placeholder="Cth: 60"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Tanggal Pembelian</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all" required />
            </div>

            {/* is_production_asset toggle */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">
                Fungsi Aset
                <span className="ml-1 text-zinc-400 normal-case font-normal">(untuk laporan)</span>
              </label>
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm font-semibold">
                <button type="button"
                  onClick={() => setIsProduction(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
                    isProduction
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-zinc-500 hover:bg-zinc-50'
                  }`}>
                  <Factory className="w-3.5 h-3.5" />
                  Produksi (BOP)
                </button>
                <button type="button"
                  onClick={() => setIsProduction(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors border-l border-zinc-200 ${
                    !isProduction
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-zinc-500 hover:bg-zinc-50'
                  }`}>
                  <Truck className="w-3.5 h-3.5" />
                  Operasional
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-400">
                {isProduction
                  ? 'Penyusutan masuk HPP — Biaya Overhead Pabrik (BOP) Tetap.'
                  : 'Penyusutan masuk Biaya Operasional, bukan HPP.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {isSubmitting ? 'Menyimpan...' : 'Tambah Aset'}
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          {/* ── Physical Assets Table ─────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900">Aset Fisik</h3>
              <span className="ml-auto text-[10px] text-zinc-400">Klik ikon fungsi untuk toggle BOP ↔ Operasional</span>
            </div>
            {assets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Belum ada aset fisik tercatat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-600">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Nama Aset</th>
                      <th className="px-6 py-3.5">Kategori</th>
                      <th className="px-6 py-3.5">Fungsi</th>
                      <th className="px-6 py-3.5 text-right">Harga Perolehan</th>
                      <th className="px-6 py-3.5 text-right">Umur</th>
                      <th className="px-6 py-3.5 text-right">Susut/Bln</th>
                      <th className="px-6 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {assets.map((asset, i) => {
                      const dep = asset.useful_life_months > 0
                        ? asset.acquisition_cost / asset.useful_life_months : 0;
                      return (
                        <tr key={asset.id} className={i % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                          <td className="px-6 py-3 font-semibold text-zinc-900">{asset.asset_name}</td>
                          <td className="px-6 py-3 text-zinc-500 text-xs">{asset.category || '—'}</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleToggleProduction(asset)}
                              title="Klik untuk toggle fungsi aset"
                              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                                asset.is_production_asset
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}>
                              {asset.is_production_asset
                                ? <><Factory className="w-3 h-3" /> BOP</>
                                : <><Truck className="w-3 h-3" /> Operasional</>}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-right font-medium">{formatRupiah(asset.acquisition_cost)}</td>
                          <td className="px-6 py-3 text-right">{asset.useful_life_months} <span className="text-xs text-zinc-400">bln</span></td>
                          <td className={`px-6 py-3 text-right font-bold ${asset.is_production_asset ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {formatRupiah(dep)}
                          </td>
                          <td className="px-6 py-3 text-center whitespace-nowrap">
                            {confirmDeleteId === asset.id ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors">Batal</button>
                                <button onClick={() => handleDeleteAsset(asset.id)} disabled={isDeleting === asset.id}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60">
                                  {isDeleting === asset.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <button disabled={isDeleting === asset.id} onClick={() => setConfirmDeleteId(asset.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                                {isDeleting === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Biological Assets Table ───────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bird className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900">Aset Biologis (Ayam Petelur)</h3>
                <span className="text-[10px] text-zinc-400 font-normal">— selalu BOP Tetap dalam HPP</span>
              </div>
              <span className="text-[11px] text-zinc-400">Dikelola di Manajemen Batch Ayam</span>
            </div>
            {bioAssets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Belum ada batch dengan harga perolehan tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-600">
                  <thead className="bg-amber-50/60 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Nama Batch</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Tgl. DOC</th>
                      <th className="px-6 py-3.5 text-right">Harga Perolehan Ayam</th>
                      <th className="px-6 py-3.5 text-right">Sisa Masa Produktif</th>
                      <th className="px-6 py-3.5 text-right">Susut/Bln</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {bioAssets.map((flock, i) => {
                      const dep = flock.acquisition_cost_total / Math.max(flock.estimated_productive_days, 1) * 30;
                      const remaining = calcRemainingMonths(flock.hatch_date, flock.estimated_productive_days);
                      const isActive = !INACTIVE_STATUSES.includes(flock.status);
                      return (
                        <tr key={flock.id} className={i % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                          <td className="px-6 py-3 font-semibold text-zinc-900">{flock.name}</td>
                          <td className="px-6 py-3">
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                            }`}>{flock.status}</span>
                          </td>
                          <td className="px-6 py-3">{new Date(flock.hatch_date + 'T00:00:00').toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-3 text-right font-medium">{formatRupiah(flock.acquisition_cost_total)}</td>
                          <td className="px-6 py-3 text-right">
                            {isActive ? <>{remaining} <span className="text-xs text-zinc-400">bln</span></> : <span className="text-zinc-400 text-xs">Selesai</span>}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-amber-600">
                            {isActive ? formatRupiah(dep) : <span className="text-zinc-400 font-normal">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Depreciation Summary ─────────────────────────────────────── */}
          {assets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-indigo-900 text-white rounded-xl px-5 py-4">
                <p className="text-[10px] text-indigo-300 uppercase tracking-wide font-semibold mb-1">BOP Tetap / Bulan</p>
                <p className="text-lg font-bold">{formatRupiah(totalBOPDeprec)}</p>
                <p className="text-[10px] text-indigo-400 mt-0.5">Penyusutan aset produksi → HPP</p>
              </div>
              <div className="bg-amber-800 text-white rounded-xl px-5 py-4">
                <p className="text-[10px] text-amber-300 uppercase tracking-wide font-semibold mb-1">BOP Bio / Bulan</p>
                <p className="text-lg font-bold">{formatRupiah(totalBioDeprec)}</p>
                <p className="text-[10px] text-amber-300 mt-0.5">Penyusutan ayam aktif → HPP</p>
              </div>
              <div className="bg-zinc-700 text-white rounded-xl px-5 py-4">
                <p className="text-[10px] text-zinc-300 uppercase tracking-wide font-semibold mb-1">Susut Operasional / Bulan</p>
                <p className="text-lg font-bold">{formatRupiah(totalOpexDeprec)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Penyusutan aset non-produksi → OpEx</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
