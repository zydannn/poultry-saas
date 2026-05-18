"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/utils/supabase/client';
import { submitEggSale, submitGenericIncome, type SalePayload } from './actions';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
  Receipt,
  ShoppingCart,
  Package,
  Wheat,
  Save,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const INCOME_CATEGORIES = [
  'Penjualan Telur',
  'Penjualan Kotoran (Pupuk)',
  'Penjualan Ayam Afkir',
  'Lain-lain',
];

const EXPENSE_CATEGORIES = [
  'Listrik',
  'Gaji',
  'Transport',
  'Lainnya',
];

interface FinanceIncome {
  id: string;
  created_at?: string;
  date: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_revenue: number;
  buyer_name?: string;
  description?: string;
}

interface FinanceExpense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  cost_group?: string;
  cost_type?: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  unit_cost: number;
}

export default function FinancePage() {
  const [incomes, setIncomes] = useState<FinanceIncome[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // DB-aggregated totals (server-side SUM, not client-side reduce)
  const [aggTotalIncome, setAggTotalIncome] = useState(0);
  const [aggTotalExpense, setAggTotalExpense] = useState(0);

  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [incomeSuccess, setIncomeSuccess] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState(false);
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');

  // Tab A Form
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: INCOME_CATEGORIES[0],
    quantity: '',
    unit: 'Butir', // default for telur
    price_per_unit: '',
    buyer_name: '',
    description: ''
  });

  // Tab B Form
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: EXPENSE_CATEGORIES[0],
    amount: ''
  });

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [incomeRes, expensesRes, inventoryRes, incomeSumRes, expenseSumRes] = await Promise.all([
        // Full rows for the Riwayat Transaksi table display
        supabase.from('finance_income').select('*').order('id', { ascending: false }),
        supabase.from('finance_expenses').select('*').order('date', { ascending: false }),
        supabase.from('inventory').select('id, quantity, unit_cost'),
        // Aggregated SUM of total_revenue for Total Pemasukan card (server-side)
        supabase.from('finance_income').select('total_revenue'),
        // Aggregated SUM of amount for Total Pengeluaran card (server-side)
        supabase.from('finance_expenses').select('amount'),
      ]);

      if (incomeRes.data) setIncomes(incomeRes.data as FinanceIncome[]);
      setExpenses(expensesRes.data ? (expensesRes.data as FinanceExpense[]) : []);
      if (inventoryRes.data) setInventory(inventoryRes.data as InventoryItem[]);

      // Server-derived aggregates → replace client-side math
      const totalRevenue = (incomeSumRes.data ?? []).reduce(
        (sum: number, row: any) => sum + (Number(row.total_revenue) || 0), 0
      );
      const totalExp = (expenseSumRes.data ?? []).reduce(
        (sum: number, row: any) => sum + (Number(row.amount) || 0), 0
      );
      setAggTotalIncome(totalRevenue);
      setAggTotalExpense(totalExp);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Core totals — derived from DB-aggregated queries, NOT client-side reduce.
  // Falls back to 0 if DB is empty.
  const totalIncome = aggTotalIncome;
  const totalExpense = aggTotalExpense;
  const netBalance = totalIncome - totalExpense;

  // Inventory purchase subtotal (computed client-side from already-fetched expenses)
  const inventoryPurchaseTotal = useMemo(
    () => expenses.filter(e => e.cost_type === 'Inventaris').reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const combinedHistory = useMemo(() => {
    const history: any[] = [];
    incomes.forEach(i => {
      let title = i.category;
      if (i.description && i.category !== 'Penjualan Telur') {
        title += ` - ${i.description}`;
      }
      if (i.buyer_name) title += ` (${i.buyer_name})`;

      history.push({
        id: i.id,
        date: i.date || i.created_at?.split('T')[0] || 'Unknown Date',
        type: 'PEMASUKAN',
        title: title,
        subtitle: `${i.quantity} ${i.unit} @ ${formatRupiah(i.price_per_unit)}`,
        amount: i.total_revenue,
        rawDate: new Date((i.date || i.created_at?.split('T')[0] || '') + 'T00:00:00').getTime()
      });
    });
    expenses.forEach(e => {
      const isInventaris = e.cost_type === 'Inventaris';
      const isFeedCost = e.category === 'Biaya Pakan' || e.category === 'Pakan';
      const cleanDesc = (e.description || '')
        .replace(/\s*\[.*?\]/g, '')
        .replace(/^Auto:\s*/i, '')
        .trim();
      history.push({
        id: e.id,
        date: e.date,
        type: isInventaris ? 'INVENTARIS' : isFeedCost ? 'PAKAN' : 'PENGELUARAN',
        title: e.category,
        subtitle: cleanDesc,
        amount: e.amount,
        rawDate: new Date(e.date + 'T00:00:00').getTime()
      });
    });

    // Sort by date descending
    return history.sort((a, b) => b.rawDate - a.rawDate);
  }, [incomes, expenses]);

  const predictedCostGroup = useMemo(() => {
    const desc = expenseForm.description.toLowerCase();
    if (!desc) return null;

    if (/(pakan|obat|vitamin|vaksin|sekam|ovk|konsentrat|jagung|dedak)/i.test(desc)) {
      return 'Variable';
    }
    if (/(listrik|gaji|karyawan|transport|bensin|sewa|maintenance|perbaikan|air|internet)/i.test(desc)) {
      return 'Fixed';
    }
    return 'Unclassified';
  }, [expenseForm.description]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') {
      const isEgg = value === 'Penjualan Telur';
      setIncomeForm(prev => ({
        ...prev,
        [name]: value,
        unit: isEgg ? 'Butir' : prev.unit === 'Butir' ? '' : prev.unit
      }));
    } else {
      setIncomeForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setExpenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError(null);
    setIncomeSuccess(false);
    setIsSubmitting(true);

    try {
      const quantity = Number(incomeForm.quantity);
      const price = Number(incomeForm.price_per_unit);
      const isEggSale = incomeForm.category === 'Penjualan Telur';

      const payload: SalePayload = {
        date: incomeForm.date,
        category: incomeForm.category,
        quantity,
        unit: isEggSale ? 'Butir' : incomeForm.unit,
        price_per_unit: price,
        buyer_name: incomeForm.buyer_name || undefined,
        description: incomeForm.description || undefined,
      };

      // Route to appropriate Server Action based on category
      const result = isEggSale
        ? await submitEggSale(payload)
        : await submitGenericIncome(payload);

      if (!result.success) {
        setIncomeError(result.error);
        return;
      }

      // Success path
      setIncomeSuccess(true);
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        category: INCOME_CATEGORIES[0],
        quantity: '',
        unit: 'Butir',
        price_per_unit: '',
        buyer_name: '',
        description: ''
      });
      startTransition(() => { fetchData(); });
      setTimeout(() => setIncomeSuccess(false), 4000);

    } catch (err: any) {
      setIncomeError(`Kesalahan tak terduga: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setExpenseError(null);
    setExpenseSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi tidak valid. Silakan login ulang.');

      const payload = {
        date: expenseForm.date,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        user_id: user.id,
      };

      const { error } = await supabase.from('finance_expenses').insert(payload);
      if (error) throw error;

      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: EXPENSE_CATEGORIES[0],
        amount: ''
      });
      fetchData();
      setExpenseSuccess(true);
      setTimeout(() => setExpenseSuccess(false), 4000);
    } catch (err: any) {
      setExpenseError(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Keuangan</h1>
            <p className="text-zinc-500 mt-1">Kelola arus kas, pemasukan, dan pengeluaran operasional.</p>
          </div>

          {/* Top Section: Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-500">Total Pemasukan</h3>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{formatRupiah(totalIncome)}</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-500">Total Pengeluaran</h3>
                <div className="p-2 bg-rose-50 rounded-lg">
                  <ArrowDownRight className="w-5 h-5 text-rose-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{formatRupiah(totalExpense)}</p>
              {inventoryPurchaseTotal > 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <Package className="w-3 h-3 shrink-0" />
                  Pembelian aset: {formatRupiah(inventoryPurchaseTotal)}
                </p>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-500">Saldo Bersih Arus Kas</h3>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${netBalance >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
                {formatRupiah(netBalance)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Left Column: Forms */}
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row p-1 bg-zinc-100 rounded-lg w-full mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pemasukan')}
                    className={`flex-1 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'pemasukan'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pengeluaran')}
                    className={`flex-1 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'pengeluaran'
                        ? 'bg-white text-rose-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Pengeluaran
                  </button>
                </div>

                {activeTab === 'pemasukan' ? (
                  <form onSubmit={submitIncome} className="space-y-4 animate-in fade-in">

                    {/* ── Error Banner ─────────────────────────────────── */}
                    {incomeError && (
                      <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                        <p className="text-sm font-medium leading-snug">{incomeError}</p>
                      </div>
                    )}

                    {/* ── Success Banner ───────────────────────────────── */}
                    {incomeSuccess && (
                      <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <p className="text-sm font-medium">Pemasukan berhasil dicatat!</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tanggal</label>
                        <input
                          type="date"
                          name="date"
                          value={incomeForm.date}
                          onChange={handleIncomeChange}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori Pemasukan</label>
                        <select
                          name="category"
                          value={incomeForm.category}
                          onChange={handleIncomeChange}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {INCOME_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {incomeForm.category !== 'Penjualan Telur' && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nama Barang / Deskripsi</label>
                        <input
                          type="text"
                          name="description"
                          value={incomeForm.description}
                          onChange={handleIncomeChange}
                          placeholder="Contoh: Pupuk Kandang A"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          {incomeForm.category === 'Penjualan Telur' ? 'Jumlah Telur (Butir)' : 'Jumlah'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            name="quantity"
                            value={incomeForm.quantity}
                            onChange={handleIncomeChange}
                            min="1"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                          />
                          {incomeForm.category !== 'Penjualan Telur' && (
                            <input
                              type="text"
                              name="unit"
                              value={incomeForm.unit}
                              onChange={handleIncomeChange}
                              placeholder="Satuan"
                              className="w-24 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          {incomeForm.category === 'Penjualan Telur' ? 'Harga per Butir (Rp)' : 'Harga Satuan (Rp)'}
                        </label>
                        <input
                          type="number"
                          name="price_per_unit"
                          value={incomeForm.price_per_unit}
                          onChange={handleIncomeChange}
                          min="1"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nama Pembeli <span className="text-zinc-400 font-normal">(Opsional)</span></label>
                      <input
                        type="text"
                        name="buyer_name"
                        value={incomeForm.buyer_name}
                        onChange={handleIncomeChange}
                        placeholder="Contoh: Toko Makmur"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm font-medium text-zinc-500">
                        Total Pemasukan: <span className="font-bold text-emerald-600 text-lg ml-1">
                          {formatRupiah((Number(incomeForm.quantity) || 0) * (Number(incomeForm.price_per_unit) || 0))}
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-70"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Pemasukan
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={submitExpense} className="space-y-4 animate-in fade-in">
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg mb-4 text-xs text-rose-800">
                      <strong>Catatan:</strong> Form ini KHUSUS untuk Beban Tetap (Listrik, Gaji, dll). Pembelian Pakan/Obat harus diinput melalui menu <strong>Inventory</strong>.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tanggal</label>
                        <input
                          type="date"
                          name="date"
                          value={expenseForm.date}
                          onChange={handleExpenseChange}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori Beban</label>
                        <select
                          name="category"
                          value={expenseForm.category}
                          onChange={handleExpenseChange}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Nama Beban / Deskripsi</label>
                        {predictedCostGroup && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${predictedCostGroup === 'Variable' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              predictedCostGroup === 'Fixed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-zinc-100 text-zinc-500 border-zinc-200'
                            }`}>
                            Class: {predictedCostGroup}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="description"
                        value={expenseForm.description}
                        onChange={handleExpenseChange}
                        placeholder="Contoh: Bayar Listrik Bulan Maret"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nominal (Rp)</label>
                      <input
                        type="number"
                        name="amount"
                        value={expenseForm.amount}
                        onChange={handleExpenseChange}
                        min="1"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>

                    {expenseSuccess && (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Pengeluaran berhasil dicatat!
                      </div>
                    )}
                    {expenseError && (
                      <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {expenseError}
                      </div>
                    )}
                    <div className="pt-4 border-t border-zinc-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-70"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Pengeluaran
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column: Unified History */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col h-[600px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-lg font-semibold text-zinc-900">Riwayat Transaksi</h2>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-medium">
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <ArrowUpRight className="w-3 h-3" /> Pemasukan
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                    <ArrowDownRight className="w-3 h-3" /> Pengeluaran
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <Package className="w-3 h-3" /> Pembelian Aset
                  </span>
                  <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md">
                    <Wheat className="w-3 h-3" /> Pakan
                  </span>
                </div>
              </div>

              {isFetching ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
                </div>
              ) : combinedHistory.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <Receipt className="w-12 h-12 text-zinc-200 mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">Belum ada transaksi</p>
                  <p className="text-xs text-zinc-400 mt-1">Data penjualan dan beban akan muncul di sini.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {combinedHistory.map((trx, idx) => (
                    <div key={`${trx.id}-${idx}`} className={`flex items-center justify-between p-4 rounded-xl border transition-colors group ${trx.type === 'INVENTARIS'
                        ? 'border-amber-100 bg-amber-50/40 hover:bg-amber-50'
                        : trx.type === 'PAKAN'
                          ? 'border-yellow-100 bg-yellow-50/40 hover:bg-yellow-50'
                          : 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50'
                      }`}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`shrink-0 p-2 sm:p-2.5 rounded-xl ${trx.type === 'PEMASUKAN' ? 'bg-emerald-100 text-emerald-600' :
                            trx.type === 'INVENTARIS' ? 'bg-amber-100 text-amber-600' :
                              trx.type === 'PAKAN' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-rose-100 text-rose-600'
                          }`}>
                          {trx.type === 'PEMASUKAN' ? <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> :
                            trx.type === 'INVENTARIS' ? <Package className="w-4 h-4 sm:w-5 sm:h-5" /> :
                              trx.type === 'PAKAN' ? <Wheat className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{trx.title}</p>
                            {trx.type === 'INVENTARIS' && (
                              <span className="shrink-0 text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Aset</span>
                            )}
                            {trx.type === 'PAKAN' && (
                              <span className="shrink-0 text-[9px] font-bold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pakan</span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 truncate">{trx.subtitle}</p>
                          <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-1 font-medium">
                            {new Date(trx.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-sm sm:text-base font-bold ${trx.type === 'PEMASUKAN' ? 'text-emerald-600' :
                            trx.type === 'INVENTARIS' ? 'text-amber-600' :
                              trx.type === 'PAKAN' ? 'text-yellow-700' :
                                'text-rose-600'
                          }`}>
                          {trx.type === 'PEMASUKAN' ? '+' : '−'}{formatRupiah(trx.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
