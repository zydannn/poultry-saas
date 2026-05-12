'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Loader2, Trash2, PlusCircle, Building2, Bird } from 'lucide-react';

interface Asset {
  id: string;
  asset_name: string;
  acquisition_cost: number;
  useful_life_months: number;
  purchase_date: string;
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

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const calcRemainingMonths = (hatchDate: string, productiveDays: number): number => {
  const elapsed = Math.floor((Date.now() - new Date(hatchDate).getTime()) / (1000 * 60 * 60 * 24));
  const remaining = productiveDays - elapsed;
  return Math.max(0, Math.ceil(remaining / 30));
};

export default function AssetTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bioAssets, setBioAssets] = useState<BiologicalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [assetName, setAssetName] = useState('');
  const [cost, setCost] = useState('');
  const [lifeMonths, setLifeMonths] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [physicalRes, bioRes] = await Promise.all([
      supabase.from('farm_assets').select('*').order('created_at', { ascending: false }),
      supabase
        .from('flocks')
        .select('id, name, breed, hatch_date, acquisition_cost_total, estimated_productive_days, status')
        .not('acquisition_cost_total', 'is', null)
        .gt('acquisition_cost_total', 0)
        .order('hatch_date', { ascending: false }),
    ]);
    if (physicalRes.data) setAssets(physicalRes.data as Asset[]);
    if (bioRes.data) setBioAssets(bioRes.data as BiologicalAsset[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = Number(cost);
    const lifeNum = Number(lifeMonths);
    if (!assetName || costNum <= 0 || lifeNum <= 0 || !purchaseDate) {
      alert('Mohon isi semua field dengan benar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('farm_assets').insert([{
        asset_name: assetName,
        acquisition_cost: costNum,
        useful_life_months: lifeNum,
        purchase_date: purchaseDate,
      }]);
      if (error) { alert(`Gagal menyimpan data: ${error.message}`); return; }
      setAssetName(''); setCost(''); setLifeMonths(''); setPurchaseDate('');
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Hapus aset ini secara permanen?')) return;
    setIsDeleting(id);
    await supabase.from('farm_assets').delete().eq('id', id);
    setIsDeleting(null);
    fetchData();
  };

  // Total penyusutan bulanan gabungan
  const totalPhysicalDepreciation = assets.reduce((sum, a) =>
    sum + (a.useful_life_months > 0 ? a.acquisition_cost / a.useful_life_months : 0), 0);
  const totalBioDepreciation = bioAssets
    .filter(f => !['Afkir', 'Selesai', 'Archived', 'Inactive'].includes(f.status))
    .reduce((sum, f) => sum + (f.acquisition_cost_total / Math.max(f.estimated_productive_days, 1) * 30), 0);
  const totalMonthlyFC = totalPhysicalDepreciation + totalBioDepreciation;

  return (
    <div className="space-y-6">

      {/* ── Add Physical Asset Form ─────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-5">
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          Tambah Aset Fisik Baru
        </h3>
        <form onSubmit={handleAddAsset}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Nama Aset</label>
              <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)}
                placeholder="Cth: Kandang Blok A"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all" required />
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
          {/* ── Physical Assets Table ───────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900">Aset Fisik (Kandang & Peralatan)</h3>
            </div>
            {assets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Belum ada aset fisik tercatat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-600">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Nama Aset</th>
                      <th className="px-6 py-3.5">Tgl. Beli</th>
                      <th className="px-6 py-3.5 text-right">Harga Perolehan</th>
                      <th className="px-6 py-3.5 text-right">Umur Ekonomis</th>
                      <th className="px-6 py-3.5 text-right">Penyusutan/Bln</th>
                      <th className="px-6 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {assets.map((asset, i) => {
                      const depPerMonth = asset.useful_life_months > 0
                        ? asset.acquisition_cost / asset.useful_life_months : 0;
                      return (
                        <tr key={asset.id} className={i % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                          <td className="px-6 py-3 font-semibold text-zinc-900">{asset.asset_name}</td>
                          <td className="px-6 py-3">{new Date(asset.purchase_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-3 text-right font-medium">{formatRupiah(asset.acquisition_cost)}</td>
                          <td className="px-6 py-3 text-right">{asset.useful_life_months} <span className="text-xs text-zinc-400">bln</span></td>
                          <td className="px-6 py-3 text-right font-bold text-indigo-600">{formatRupiah(depPerMonth)}</td>
                          <td className="px-6 py-3 text-center">
                            <button disabled={isDeleting === asset.id} onClick={() => handleDeleteAsset(asset.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                              {isDeleting === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Biological Assets Table ─────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bird className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900">Aset Biologis (Ayam Petelur)</h3>
              </div>
              <span className="text-[11px] text-zinc-400">Dikelola di Manajemen Batch Ayam</span>
            </div>
            {bioAssets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Belum ada batch dengan harga perolehan tercatat. Isi kolom "Harga Perolehan Ayam" saat membuat batch.
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
                      <th className="px-6 py-3.5 text-right">Penyusutan/Bln</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {bioAssets.map((flock, i) => {
                      const depPerMonth = flock.acquisition_cost_total / Math.max(flock.estimated_productive_days, 1) * 30;
                      const remainingMonths = calcRemainingMonths(flock.hatch_date, flock.estimated_productive_days);
                      const isActive = !['Afkir', 'Selesai', 'Archived', 'Inactive'].includes(flock.status);
                      return (
                        <tr key={flock.id} className={i % 2 === 0 ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/50 hover:bg-zinc-50/80'}>
                          <td className="px-6 py-3 font-semibold text-zinc-900">{flock.name}</td>
                          <td className="px-6 py-3">
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {flock.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {new Date(flock.hatch_date + 'T00:00:00').toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-3 text-right font-medium">{formatRupiah(flock.acquisition_cost_total)}</td>
                          <td className="px-6 py-3 text-right">
                            {isActive
                              ? <>{remainingMonths} <span className="text-xs text-zinc-400">bln</span></>
                              : <span className="text-zinc-400 text-xs">Selesai</span>
                            }
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-amber-600">
                            {isActive ? formatRupiah(depPerMonth) : <span className="text-zinc-400 font-normal">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Total FC Summary ────────────────────────────────────────────── */}
          {(assets.length > 0 || bioAssets.length > 0) && (
            <div className="bg-zinc-900 text-white rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">Total Fixed Cost (Penyusutan) / Bulan</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Aset Fisik + Aset Biologis Aktif — masuk ke kalkulasi HPP & BEP</p>
              </div>
              <p className="text-xl font-bold text-white">{formatRupiah(totalMonthlyFC)}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
