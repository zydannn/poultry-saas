'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import TermTooltip from '@/components/TermTooltip';
import { supabase } from '@/utils/supabase/client';
import {
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Minus,
  Egg, Wheat, Building2, Wrench, Bird,
  FileSpreadsheet, Printer, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PLData {
  revenueEgg:           number;
  revenueOther:         number;
  totalRevenue:         number;
  variableCost:         number;
  fixedCashCost:        number;
  depreciationPhysical: number;
  depreciationBio:      number;
  totalCost:            number;
  netProfit:            number;
  inventoryPurchase:    number;
  incomeRows:           TxRow[];
  expenseRows:          TxRow[];
}

interface TxRow {
  date:   string;
  type:   'income' | 'expense';
  label:  string;
  amount: number;
}

interface TrendPoint {
  bulan:      string;
  Pendapatan: number;
  Biaya:      number;
  Profit:     number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(Math.round(v));
};

const pad2 = (n: number) => String(n).padStart(2, '0');

function monthBounds(year: number, month: number) {
  const start    = `${year}-${pad2(month)}-01`;
  const lastDay  = new Date(year, month, 0).getDate();
  const end      = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { start, end, daysInMonth: lastDay };
}

const INACTIVE_STATUSES = ['Afkir', 'Selesai', 'Archived', 'Inactive'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PLRow({ icon, label, sub, value, negative = false }: {
  icon: React.ReactNode; label: string; sub?: string; value: number; negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/70 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 opacity-70">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">{label}</p>
          {sub && <p className="text-[10px] text-zinc-400 truncate">{sub}</p>}
        </div>
      </div>
      <p className={`text-sm font-semibold ml-4 shrink-0 ${negative ? 'text-rose-600' : 'text-emerald-600'}`}>
        {negative ? '− ' : '+ '}{fmt(value)}
      </p>
    </div>
  );
}

function TotalRow({ label, value, color }: { label: string; value: number; color: 'emerald' | 'rose' }) {
  const cls = color === 'emerald'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : 'text-rose-700 bg-rose-50 border-rose-100';
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-t ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold">{fmt(value)}</p>
    </div>
  );
}

function SubHeader({ label }: { label: React.ReactNode }) {
  return (
    <div className="px-5 py-2 bg-zinc-50 border-t border-zinc-100">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
    </div>
  );
}

// Custom tooltip for trend chart
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-xs text-white space-y-1.5">
      <p className="font-bold text-zinc-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaporanPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<PLData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const { start, end, daysInMonth } = monthBounds(year, month);

      // ── 6-month range for trend ─────────────────────────────────────────────
      const trendStart = new Date(year, month - 7, 1);
      const trendStartStr = `${trendStart.getFullYear()}-${pad2(trendStart.getMonth() + 1)}-01`;

      const [incomeRes, expenseRes, assetsRes, flocksRes, inc6Res, exp6Res] = await Promise.all([
        supabase.from('finance_income')
          .select('date, category, quantity, price_per_unit, total_revenue, description, buyer_name')
          .gte('date', start).lte('date', end).order('date', { ascending: false }),
        supabase.from('finance_expenses')
          .select('date, category, amount, description, cost_type')
          .gte('date', start).lte('date', end).order('date', { ascending: false }),
        supabase.from('farm_assets').select('acquisition_cost, useful_life_months'),
        supabase.from('flocks')
          .select('acquisition_cost_total, estimated_productive_days, status')
          .gt('acquisition_cost_total', 0),
        // Trend: 6 months of income
        supabase.from('finance_income').select('date, total_revenue, quantity, price_per_unit')
          .gte('date', trendStartStr).lte('date', end),
        // Trend: 6 months of expenses
        supabase.from('finance_expenses').select('date, amount, cost_type')
          .gte('date', trendStartStr).lte('date', end),
      ]);

      // ── Revenue breakdown ────────────────────────────────────────────────────
      const incomeData = incomeRes.data ?? [];
      let revenueEgg = 0, revenueOther = 0;
      const incomeRows: TxRow[] = [];
      for (const row of incomeData) {
        const amt = Number(row.total_revenue) || Number(row.quantity) * Number(row.price_per_unit) || 0;
        if (row.category === 'Penjualan Telur') revenueEgg += amt; else revenueOther += amt;
        incomeRows.push({
          date:   row.date,
          type:   'income',
          label:  [row.category, row.buyer_name, row.description].filter(Boolean).join(' · '),
          amount: amt,
        });
      }

      // ── Expense breakdown ────────────────────────────────────────────────────
      const expenseData = expenseRes.data ?? [];
      let variableCost = 0, fixedCashCost = 0, inventoryPurchase = 0;
      const expenseRows: TxRow[] = [];
      for (const row of expenseData) {
        const amt = Number(row.amount) || 0;
        if (row.cost_type === 'Inventaris') {
          inventoryPurchase += amt; // kas keluar — aset, bukan beban P&L
        } else if (row.cost_type === 'Variable') {
          variableCost += amt;
        } else {
          fixedCashCost += amt;
        }
        expenseRows.push({
          date:   row.date,
          type:   'expense',
          label:  [row.category, row.cost_type === 'Inventaris' ? '(Pembelian Aset)' : null, row.description].filter(Boolean).join(' — '),
          amount: amt,
        });
      }

      // ── Depreciation (current month) ─────────────────────────────────────────
      const assetsData = assetsRes.data ?? [];
      const depreciationPhysical = assetsData.reduce((s, a) =>
        s + (Number(a.acquisition_cost) || 0) / (Number(a.useful_life_months) || 1), 0);

      const flocksData = flocksRes.data ?? [];
      const depreciationBio = flocksData
        .filter(f => !INACTIVE_STATUSES.includes(f.status))
        .reduce((s, f) =>
          s + (Number(f.acquisition_cost_total) || 0) / Math.max(Number(f.estimated_productive_days) || 1, 1) * daysInMonth, 0);

      // ── Totals ────────────────────────────────────────────────────────────────
      const totalRevenue = revenueEgg + revenueOther;
      const totalCost    = variableCost + fixedCashCost + depreciationPhysical + depreciationBio;
      const netProfit    = totalRevenue - totalCost;

      setData({ revenueEgg, revenueOther, totalRevenue, variableCost, fixedCashCost, depreciationPhysical, depreciationBio, totalCost, netProfit, inventoryPurchase, incomeRows, expenseRows });

      // ── Build 6-month trend ──────────────────────────────────────────────────
      const monthlyRev:  Record<string, number> = {};
      const monthlyCash: Record<string, number> = {};

      for (const row of inc6Res.data ?? []) {
        const key = row.date.slice(0, 7);
        const amt = Number(row.total_revenue) || Number(row.quantity) * Number(row.price_per_unit) || 0;
        monthlyRev[key] = (monthlyRev[key] || 0) + amt;
      }
      for (const row of exp6Res.data ?? []) {
        const key = row.date.slice(0, 7);
        monthlyCash[key] = (monthlyCash[key] || 0) + (Number(row.amount) || 0);
      }

      // Monthly depreciation approximation (constant rate × days in each month)
      const depPhysical = depreciationPhysical; // already per-month
      const depBioRate  = flocksData.filter(f => !INACTIVE_STATUSES.includes(f.status))
        .reduce((s, f) => s + (Number(f.acquisition_cost_total) || 0) / Math.max(Number(f.estimated_productive_days) || 1, 1), 0);

      const trendPoints: TrendPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d    = new Date(year, month - 1 - i, 1);
        const key  = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
        const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const rev  = monthlyRev[key] || 0;
        const cost = (monthlyCash[key] || 0) + depPhysical + depBioRate * days;
        trendPoints.push({
          bulan:      MONTH_NAMES[d.getMonth()].slice(0, 3),
          Pendapatan: rev,
          Biaya:      cost,
          Profit:     rev - cost,
        });
      }
      setTrend(trendPoints);

    } catch (err) {
      console.error('[LaporanPage] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Month navigation ────────────────────────────────────────────────────────
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const rows: (string | number)[][] = [
      ['LAPORAN LABA RUGI', label],
      ['Metode', 'Full Costing'],
      [],
      ['PENDAPATAN', ''],
      ['Penjualan Telur', data.revenueEgg],
      ['Pendapatan Lainnya', data.revenueOther],
      ['TOTAL PENDAPATAN', data.totalRevenue],
      [],
      ['BEBAN & BIAYA', ''],
      ['Biaya Pakan (Variabel)', data.variableCost],
      ['Penyusutan Aset Fisik', data.depreciationPhysical],
      ['Penyusutan Biologis Ayam', data.depreciationBio],
      ['Biaya Operasional (Fixed Cash)', data.fixedCashCost],
      ['TOTAL BEBAN', data.totalCost],
      [],
      [data.netProfit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH', data.netProfit],
      ...(data.inventoryPurchase > 0 ? [
        [],
        ['--- CATATAN ARUS KAS (Non-P&L) ---', ''],
        ['Pembelian Inventaris Pakan (Aset, bukan beban periode)', -data.inventoryPurchase],
      ] : []),
      [],
      ['--- RINCIAN TRANSAKSI ---', ''],
      ['Tanggal', 'Jenis', 'Keterangan', 'Nominal'],
      ...[...data.incomeRows, ...data.expenseRows]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(tx => [tx.date, tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', tx.label, tx.type === 'income' ? tx.amount : -tx.amount]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `LabaRugi_${year}_${pad2(month)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = () => { window.print(); };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const profit       = data?.netProfit ?? 0;
  const profitMargin = (data?.totalRevenue ?? 0) > 0 ? ((profit / data!.totalRevenue) * 100).toFixed(1) : '—';
  const HeroIcon     = profit > 0 ? TrendingUp : profit < 0 ? TrendingDown : Minus;
  const heroColor    = profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-rose-600' : 'text-zinc-400';
  const heroBg       = profit > 0 ? 'from-emerald-50 to-white border-emerald-100'
                     : profit < 0 ? 'from-rose-50 to-white border-rose-100'
                     :              'from-zinc-50 to-white border-zinc-100';

  const allTx: TxRow[] = data
    ? [...data.incomeRows, ...data.expenseRows].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const hasTrendData = trend.some(t => t.Pendapatan > 0 || t.Biaya > 0);

  return (
    <AppShell>
      {/* Print CSS — hides nav and buttons, keeps content */}
      <style>{`
        @media print {
          header, nav, aside, [data-no-print] { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 16px !important; }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 pb-20 print-page">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Laporan Laba Rugi</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Income Statement — Full Costing Method</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap" data-no-print>
              {/* Month Picker */}
              <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg shadow-sm px-2 py-1">
                <button onClick={prevMonth} className="p-1 text-zinc-500 hover:text-zinc-900 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-zinc-800 w-28 text-center">
                  {MONTH_NAMES[month - 1]} {year}
                </span>
                <button onClick={nextMonth} disabled={isCurrentMonth}
                  className="p-1 text-zinc-500 hover:text-zinc-900 rounded disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={fetchData} disabled={loading}
                className="p-2 text-zinc-500 bg-white border border-zinc-200 rounded-lg shadow-sm hover:text-zinc-900 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {/* Export buttons */}
              <button onClick={exportCSV} disabled={!data}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button onClick={exportPDF} disabled={!data}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm">
                <Printer className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-zinc-300" />
              <p className="text-sm">Memuat laporan...</p>
            </div>
          ) : (
            <>
              {/* ── 1. HERO CARD ────────────────────────────────────────── */}
              <div className={`bg-gradient-to-b ${heroBg} border rounded-2xl p-6 shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    <HeroIcon className={`w-5 h-5 ${heroColor}`} />
                  </div>
                  <p className="text-sm font-semibold text-zinc-500">
                    {profit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'} — {MONTH_NAMES[month - 1]} {year}
                  </p>
                </div>
                <p className={`text-4xl font-bold tracking-tight ${heroColor}`}>
                  {fmt(Math.abs(profit))}
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  Profit margin: <span className="font-semibold text-zinc-600">{profitMargin}%</span>
                  {' '}dari total pendapatan {fmt(data?.totalRevenue ?? 0)}
                </p>
              </div>

              {/* ── 2. INCOME STATEMENT TABLE ──────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-emerald-600">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-50">Pendapatan</p>
                </div>
                <PLRow icon={<Egg className="w-4 h-4 text-amber-500" />} label="Penjualan Telur"
                  sub={`${MONTH_NAMES[month - 1]} ${year}`} value={data?.revenueEgg ?? 0} />
                {(data?.revenueOther ?? 0) > 0 && (
                  <PLRow icon={<TrendingUp className="w-4 h-4 text-zinc-400" />} label="Pendapatan Lainnya"
                    value={data?.revenueOther ?? 0} />
                )}
                <TotalRow label="Total Pendapatan" value={data?.totalRevenue ?? 0} color="emerald" />

                <div className="px-5 py-3 bg-rose-600 mt-px">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-50">Beban &amp; Biaya</p>
                </div>
                <SubHeader label={<><TermTooltip term="VC">Biaya Variabel</TermTooltip>{' (HPP Langsung)'}</>} />
                <PLRow icon={<Wheat className="w-4 h-4 text-amber-500" />} label="Biaya Pakan"
                  sub="Dicatat saat konsumsi via input harian" value={data?.variableCost ?? 0} negative />
                <SubHeader label={<><TermTooltip term="FC">Biaya Tetap</TermTooltip>{' Non-Kas ('}<TermTooltip term="Penyusutan">Penyusutan</TermTooltip>{')'}</>} />
                <PLRow icon={<Building2 className="w-4 h-4 text-indigo-500" />} label="Penyusutan Aset Fisik"
                  sub="Kandang, mesin, peralatan" value={data?.depreciationPhysical ?? 0} negative />
                <PLRow icon={<Bird className="w-4 h-4 text-amber-500" />} label="Penyusutan Biologis Ayam"
                  sub="Batch aktif — berdasarkan masa produktif" value={data?.depreciationBio ?? 0} negative />
                {(data?.fixedCashCost ?? 0) > 0 && (
                  <>
                    <SubHeader label={<><TermTooltip term="FC">Biaya Tetap</TermTooltip>{' Operasional'}</>} />
                    <PLRow icon={<Wrench className="w-4 h-4 text-zinc-400" />} label="Biaya Operasional"
                      sub="Listrik, gaji, transport, dll." value={data?.fixedCashCost ?? 0} negative />
                  </>
                )}
                <TotalRow label="Total Beban" value={data?.totalCost ?? 0} color="rose" />
                <div className="border-t-2 border-zinc-900" />
                <div className={`flex items-center justify-between px-5 py-4 ${profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <p className={`text-base font-bold uppercase tracking-wide ${profit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {profit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
                  </p>
                  <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {profit < 0 ? '(' : ''}{fmt(Math.abs(profit))}{profit < 0 ? ')' : ''}
                  </p>
                </div>
              </div>

              {/* ── 2b. CATATAN ARUS KAS — Pembelian Inventaris (non-P&L) ─ */}
              {(data?.inventoryPurchase ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                      <Wheat className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Catatan Arus Kas — Pembelian Inventaris</p>
                      <p className="text-sm text-amber-700 mt-0.5">Pembelian pakan bulan ini dicatat sebagai <span className="font-semibold">aset inventaris</span>, bukan beban P&L.</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">Biaya pakan diakui ke HPP saat dikonsumsi via input harian, bukan saat dibeli.</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Kas Keluar</p>
                    <p className="text-lg font-bold text-amber-700">− {fmt(data?.inventoryPurchase ?? 0)}</p>
                  </div>
                </div>
              )}

              {/* ── 3. KPI GRID ─────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Profit Margin', value: `${profitMargin}%`, sub: 'Laba / Pendapatan', color: profit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                  { label: 'Total Pendapatan', value: fmt(data?.totalRevenue ?? 0), sub: MONTH_NAMES[month - 1], color: 'text-zinc-900' },
                  { label: 'Total Beban', value: fmt(data?.totalCost ?? 0), sub: 'Full Costing', color: 'text-zinc-900' },
                  { label: 'Biaya Non-Kas', value: fmt((data?.depreciationPhysical ?? 0) + (data?.depreciationBio ?? 0)), sub: 'Penyusutan bulan ini', color: 'text-indigo-600' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1">{kpi.label}</p>
                    <p className={`text-lg font-bold truncate ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── 4. TREND 6 BULAN ───────────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Tren 6 Bulan Terakhir</h3>
                    <p className="text-[10px] text-zinc-400">Pendapatan vs Total Biaya vs Profit/Rugi</p>
                  </div>
                </div>

                {!hasTrendData ? (
                  <div className="py-12 text-center text-zinc-400 text-sm">
                    Belum ada data historis untuk ditampilkan.
                  </div>
                ) : (
                  <>
                    <div className="px-2 pt-4 pb-2 h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                          <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={48} />
                          <Tooltip content={<TrendTooltip />} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <ReferenceLine y={0} stroke="#e4e4e7" />
                          <Bar dataKey="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="Biaya"      fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="Profit"     fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Trend summary table */}
                    <div className="overflow-x-auto border-t border-zinc-100">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 text-[10px] font-bold uppercase text-zinc-400">
                          <tr>
                            <th className="px-4 py-2">Bulan</th>
                            <th className="px-4 py-2 text-right text-emerald-600">Pendapatan</th>
                            <th className="px-4 py-2 text-right text-rose-600">Total Biaya</th>
                            <th className="px-4 py-2 text-right text-indigo-600">Profit / Rugi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {trend.map((t, i) => (
                            <tr key={i} className="hover:bg-zinc-50/60">
                              <td className="px-4 py-2 font-semibold text-zinc-700">{t.bulan}</td>
                              <td className="px-4 py-2 text-right text-zinc-600">{t.Pendapatan > 0 ? fmt(t.Pendapatan) : '—'}</td>
                              <td className="px-4 py-2 text-right text-zinc-600">{t.Biaya > 0 ? fmt(t.Biaya) : '—'}</td>
                              <td className={`px-4 py-2 text-right font-semibold ${t.Profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.Pendapatan > 0 || t.Biaya > 0 ? fmt(t.Profit) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* ── 5. TRANSACTION DETAIL ──────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900">Rincian Transaksi</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{MONTH_NAMES[month - 1]} {year} · {allTx.length} transaksi</p>
                </div>
                {allTx.length === 0 ? (
                  <div className="p-10 text-center text-zinc-400 text-sm">Tidak ada transaksi bulan ini.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        <tr>
                          <th className="px-5 py-3">Tanggal</th>
                          <th className="px-5 py-3">Jenis</th>
                          <th className="px-5 py-3">Keterangan</th>
                          <th className="px-5 py-3 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {allTx.map((tx, i) => (
                          <tr key={i} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-5 py-2.5 text-zinc-500 whitespace-nowrap text-xs">
                              {new Date(tx.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-2.5 whitespace-nowrap">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-zinc-700 max-w-[180px] truncate">{tx.label || '—'}</td>
                            <td className={`px-5 py-2.5 text-right font-semibold whitespace-nowrap ${
                              tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {tx.type === 'income' ? '+' : '−'} {fmt(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── 6. FOOTNOTE ────────────────────────────────────────── */}
              <p className="text-[11px] text-zinc-400 leading-relaxed text-center px-4 pb-2">
                Laporan menggunakan <span className="font-semibold">Full Costing Method</span> — semua biaya tetap
                (termasuk penyusutan non-kas) dibebankan ke periode berjalan. Biaya pakan masuk saat dikonsumsi (bukan saat dibeli).
                Tren biaya menggunakan tarif penyusutan bulan berjalan sebagai aproksimasi historis.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
