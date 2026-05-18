"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/utils/supabase/client';
import { submitFeedPurchase, deleteInventoryTransaction } from './actions';
import type { FeedPurchasePayload } from './actions';
import {
  Package,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  History,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InventoryCategory = 'Pakan' | 'Obat/Vaksin' | 'Lainnya';
type UnitOfMeasurement = 'Kg' | 'Gram' | 'Liter' | 'Botol' | 'Sachet';

// SSOT: matches feed_stock_ledger view
interface FeedLedgerRow {
  feed_name: string;
  category: string;
  actual_stock: number;
}

interface PurchaseHistoryRow {
  id: string;
  transaction_date: string;
  quantity: number;
  unit_cost: number;
  inventory: { item_name: string; category: string } | null;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [feedLedger, setFeedLedger] = useState<FeedLedgerRow[]>([]); // SSOT for display table
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRow[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Pakan' as InventoryCategory,
    quantity_input: '',
    unit: 'Kg' as UnitOfMeasurement,
    unit_cost: '',
    transaction_date: new Date().toISOString().split('T')[0], // Default: today
  });

  // ── Fetch SSOT aggregated stock from feed_stock_ledger view ───────────────
  const fetchLedger = useCallback(async () => {
    setIsFetching(true);
    const [ledgerRes, historyRes] = await Promise.all([
      supabase
        .from('feed_stock_ledger')
        .select('*')
        .order('feed_name', { ascending: true }),
      supabase
        .from('inventory_transactions')
        .select('id, transaction_date, quantity, unit_cost, inventory:inventory_id(item_name, category)')
        .gt('quantity', 0)
        .order('transaction_date', { ascending: false })
        .limit(30),
    ]);
    if (ledgerRes.error) {
      console.error('[InventoryPage] feed_stock_ledger error:', ledgerRes.error.message);
    } else {
      setFeedLedger((ledgerRes.data as FeedLedgerRow[]) ?? []);
    }
    if (!historyRes.error && historyRes.data) {
      setPurchaseHistory(historyRes.data as unknown as PurchaseHistoryRow[]);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  // ── Delete purchase transaction ────────────────────────────────────────────
  const handleDeleteTransaction = async (id: string) => {
    setConfirmDeleteTxId(null);
    setDeletingId(id);
    setDeleteError(null);
    const result = await deleteInventoryTransaction(id);
    setDeletingId(null);
    if (!result.success) {
      setDeleteError(result.error);
    } else {
      fetchLedger();
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Submit — wired to submitFeedPurchase Server Action ───────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!formData.item_name || !formData.quantity_input || !formData.unit_cost) {
      setFormError('Mohon lengkapi semua kolom sebelum menyimpan.');
      return;
    }

    const payload: FeedPurchasePayload = {
      feed_name:        formData.item_name,
      category:         formData.category,
      quantity:         parseFloat(formData.quantity_input),
      unit_cost:        parseFloat(formData.unit_cost),
      transaction_date: formData.transaction_date, // From UI date picker
    };

    setIsSaving(true);
    const result = await submitFeedPurchase(payload);
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    // ✔ Success: reset form, show banner, re-fetch SSOT ledger
    setFormSuccess(true);
    setFormData({ item_name: '', category: 'Pakan', quantity_input: '', unit: 'Kg', unit_cost: '', transaction_date: new Date().toISOString().split('T')[0] });
    fetchLedger();
    setTimeout(() => setFormSuccess(false), 4000);
  };


  // SSOT: totalFeedKg now derived from feed_stock_ledger view (actual_stock = SUM of all transactions)
  const totalFeedKg = feedLedger
    .reduce((sum, row) => sum + Number(row.actual_stock || 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Manajemen Stok Pakan &amp; Obat
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Pantau kuantitas pakan dan obat-obatan sesuai unit masing-masing.
            </p>
          </div>

          {/* Feed Stock Alert */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium border ${
            totalFeedKg < 50
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {totalFeedKg < 50
                ? `⚠️ Stok pakan kritis: ${totalFeedKg} Kg tersisa. Segera lakukan pembelian!`
                : `✅ Total stok pakan aktif: ${totalFeedKg} Kg`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── LEFT: Add Stock Form ────────────────────────────────────── */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Stok Baru
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Error Banner ─────────────────────────────────── */}
                {formError && (
                  <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                    <p className="text-xs font-medium leading-snug">{formError}</p>
                  </div>
                )}

                {/* ── Success Banner ───────────────────────────────── */}
                {formSuccess && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <p className="text-xs font-medium">Stok pakan berhasil ditambahkan!</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Nama Item
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    placeholder="Contoh: Pakan Ayam BR1, Vaksin ND..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Jenis
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="Pakan">Pakan</option>
                    <option value="Obat/Vaksin">Obat / Vaksin</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Quantity + UoM — THE CORE FEATURE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Kuantitas
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="quantity_input"
                      value={formData.quantity_input}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-24 flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      required
                    />
                    {/* ── UoM Dropdown ── */}
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="Kg">Kg</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="Botol">Botol</option>
                      <option value="Sachet">Sachet</option>
                    </select>
                  </div>
                </div>

                {/* Unit Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Harga Beli per Unit (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 text-sm">Rp</span>
                    <input
                      type="number"
                      name="unit_cost"
                      value={formData.unit_cost}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      required
                    />
                  </div>
                </div>

                {/* Tanggal Pembelian */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">
                    Pembelian dicatat sebagai <span className="font-semibold">Aset Inventaris</span>. Biaya pakan otomatis masuk ke HPP saat pakan dikonsumsi via input harian.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Stok'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── RIGHT: Inventory Table ──────────────────────────────────── */}
            <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
                <h2 className="text-base font-semibold text-zinc-900">Daftar Stok</h2>
                <button
                  onClick={fetchLedger}
                  disabled={isFetching}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1.5 rounded-md hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-5 py-3">Nama Item</th>
                      <th className="px-5 py-3">Jenis</th>
                      <th className="px-5 py-3">Stok Aktual</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60">
                    {isFetching ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-zinc-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : feedLedger.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                              <Package className="w-8 h-8 text-amber-400" />
                            </div>
                            <h3 className="text-base font-bold text-zinc-900">Gudang masih kosong</h3>
                            <p className="text-sm text-zinc-500 mt-1.5 max-w-[240px] leading-relaxed">
                              Gudang pakanmu masih kosong. Ayo beli pakan dulu agar ayam bisa makan!
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // SSOT: map over feed_stock_ledger data — no client-side math
                      feedLedger.map((item, idx) => {
                        const stock = Number(item.actual_stock) || 0;
                        const isLow = stock < 50;
                        const isCritical = stock <= 0;
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="px-5 py-3 font-medium text-zinc-900">{item.feed_name}</td>
                            <td className="px-5 py-3">
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-bold text-zinc-900">
                              {stock.toLocaleString('id-ID')}{' '}
                              <span className="text-xs font-normal text-zinc-400">Kg</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {isCritical ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Habis</span>
                              ) : isLow ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Menipis</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Aman</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Riwayat Pembelian (dengan tombol hapus) ────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <h2 className="text-base font-semibold text-zinc-900">Riwayat Pembelian</h2>
              <span className="ml-auto text-[10px] text-zinc-400">30 entri terbaru · hanya pembelian</span>
            </div>

            {deleteError && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Nama Item</th>
                    <th className="px-5 py-3 text-right">Qty (Kg)</th>
                    <th className="px-5 py-3 text-right">Harga/Kg</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {purchaseHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 text-sm">
                        Belum ada riwayat pembelian.
                      </td>
                    </tr>
                  ) : (
                    purchaseHistory.map((tx) => {
                      const total = Number(tx.quantity) * Number(tx.unit_cost);
                      const itemName = tx.inventory?.item_name ?? '—';
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="px-5 py-3 text-zinc-700">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3 font-medium text-zinc-900">{itemName}</td>
                          <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                            +{Number(tx.quantity).toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3 text-right text-zinc-600">
                            {Number(tx.unit_cost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-zinc-800">
                            {total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-5 py-3 text-center whitespace-nowrap">
                            {confirmDeleteTxId === tx.id ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setConfirmDeleteTxId(null)}
                                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                                >Batal</button>
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  disabled={deletingId === tx.id}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60"
                                >
                                  {deletingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteTxId(tx.id)}
                                disabled={deletingId === tx.id}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-40"
                                title="Hapus entri pembelian"
                              >
                                {deletingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[10px] text-zinc-400 border-t border-zinc-100">
              Menghapus entri akan mengurangi stok aktual dan menghapus biaya terkait dari laporan keuangan.
            </p>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
