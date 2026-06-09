'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import TermTooltip from '@/components/TermTooltip';
import { supabase } from '@/utils/supabase/client';
import {
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Minus,
  Egg, Wheat, Building2, Wrench, Bird, Users, Zap, Factory,
  FileSpreadsheet, Printer, BarChart2,
} from 'lucide-react';

// Recharts di-lazy-load agar tidak masuk bundle utama halaman Laporan
const ProfitTrendChart = dynamic(
  () => import('@/components/laporan/ProfitTrendChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    ),
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type HppComponent = 'BBB_VAR' | 'BTKL' | 'BOP_VAR' | 'OPEX' | 'NON_PL';

interface DepreciationItem {
  name:                 string;
  category?:            string;
  monthly_depreciation: number;
}

interface PLData {
  // Revenue
  revenueEgg:        number;
  revenueOther:      number;
  totalRevenue:      number;
  // HPP components
  bbbVariable:       number;   // I. Biaya Bahan Baku Variable
  btkl:              number;   // II. Biaya Tenaga Kerja Langsung
  bopVariable:       number;   // III. BOP Variable (listrik, dll)
  bopFixed:          number;   // III. BOP Tetap Fisik (penyusutan aset produksi)
  bopBio:            number;   // III. BOP Tetap Biologis
  totalHPP:          number;
  labaKotor:         number;
  // Biaya Operasional (after HPP)
  opexCash:          number;   // Cash OpEx (transport, admin, dll)
  opexDeprec:        number;   // Penyusutan aset non-produksi
  totalOpex:         number;
  // Bottom line
  totalCost:         number;
  netProfit:         number;
  inventoryPurchase: number;
  // Detail rows
  incomeRows:        TxRow[];
  expenseRows:       TxRow[];
  bopDeprecItems:    DepreciationItem[];
  opexDeprecItems:   DepreciationItem[];
  bioDeprecItems:    DepreciationItem[];
}

interface TxRow {
  date:            string;
  type:            'income' | 'expense';
  label:           string;
  amount:          number;
  cost_type?:      string | null;
  category?:       string;
  description?:    string;
  quantity?:       number;
  price_per_unit?: number;
  buyer_name?:     string;
  hpp_component?:  HppComponent;
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

const pad2 = (n: number) => String(n).padStart(2, '0');

function monthBounds(year: number, month: number) {
  const start   = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end     = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { start, end, daysInMonth: lastDay };
}

const INACTIVE_STATUSES = ['Afkir', 'Selesai', 'Archived', 'Inactive'];

/**
 * Classify a finance_expenses row into its HPP component.
 * Mapping rules (in priority order):
 *   1. NON_PL  — category starts with "Pembelian" OR cost_type = 'Inventaris'
 *   2. BBB_VAR — cost_type = 'Variable' (pakan, obat, vitamin, vaksin, suplemen)
 *   3. BTKL    — category contains gaji / upah / honor / tenaga kerja
 *   4. BOP_VAR — category contains listrik / air / utilitas / bbm produksi
 *   5. OPEX    — everything else (transport, distribusi, administrasi, dll)
 */
function classifyExpense(category: string | null | undefined, costType: string | null | undefined): HppComponent {
  const cat = (category ?? '').toLowerCase();
  const ct  = (costType ?? '');
  if (cat.startsWith('pembelian') || ct === 'Inventaris') return 'NON_PL';
  if (ct === 'Variable')                                  return 'BBB_VAR';
  if (/gaji|upah|honor|tenaga kerja/i.test(cat))         return 'BTKL';
  if (/listrik|air|utilitas|bbm.?produksi|solar.?produksi/i.test(cat)) return 'BOP_VAR';
  return 'OPEX';
}

/** (Rp x) for debit/cost entries */
const fmtDebit = (v: number) =>
  v === 0 ? '—' : `(${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)})`;

/** Rp x for credit/revenue entries */
const fmtCredit = (v: number) =>
  v === 0 ? '—' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

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
        {negative ? '− ' : '+ '}{fmt(value)}
      </p>
    </div>
  );
}

function SectionTotal({ label, value, color = 'rose' }: {
  label: string; value: number; color?: 'emerald' | 'rose' | 'zinc';
}) {
  const cls = color === 'emerald' ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : color === 'rose' ? 'text-rose-700 bg-rose-50 border-rose-100'
    : 'text-zinc-700 bg-zinc-100 border-zinc-200';
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaporanPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<PLData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState<string>('');

  useEffect(() => {
    supabase.from('farm_profile').select('farm_name').maybeSingle()
      .then(({ data: fp }) => { if (fp?.farm_name) setFarmName(fp.farm_name); });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const { start, end, daysInMonth } = monthBounds(year, month);
      const trendStart    = new Date(year, month - 7, 1);
      const trendStartStr = `${trendStart.getFullYear()}-${pad2(trendStart.getMonth() + 1)}-01`;

      const [incomeRes, expenseRes, assetsRes, flocksRes, inc6Res, exp6Res] = await Promise.all([
        supabase.from('finance_income')
          .select('date, category, quantity, price_per_unit, total_revenue, description, buyer_name')
          .gte('date', start).lte('date', end).order('date', { ascending: false }),
        supabase.from('finance_expenses')
          .select('date, category, amount, description, cost_type')
          .gte('date', start).lte('date', end).order('date', { ascending: false }),
        supabase.from('farm_assets')
          .select('asset_name, category, acquisition_cost, useful_life_months, is_production_asset')
          .order('is_production_asset', { ascending: false }).order('category').order('asset_name'),
        supabase.from('flocks')
          .select('name, breed, acquisition_cost_total, estimated_productive_days, status')
          .gt('acquisition_cost_total', 0),
        supabase.from('finance_income').select('date, total_revenue, quantity, price_per_unit')
          .gte('date', trendStartStr).lte('date', end),
        supabase.from('finance_expenses').select('date, amount, category, cost_type')
          .gte('date', trendStartStr).lte('date', end),
      ]);

      // ── Revenue ──────────────────────────────────────────────────────────────
      const incomeData = incomeRes.data ?? [];
      let revenueEgg = 0, revenueOther = 0;
      const incomeRows: TxRow[] = [];
      for (const row of incomeData) {
        const amt = Number(row.total_revenue) || Number(row.quantity) * Number(row.price_per_unit) || 0;
        if (row.category === 'Penjualan Telur') revenueEgg += amt; else revenueOther += amt;
        incomeRows.push({
          date: row.date, type: 'income',
          label: [row.category, row.buyer_name, row.description].filter(Boolean).join(' · '),
          amount: amt, category: row.category,
          description: row.description || undefined,
          quantity: Number(row.quantity) || undefined,
          price_per_unit: Number(row.price_per_unit) || undefined,
          buyer_name: row.buyer_name || undefined,
        });
      }

      // ── Expenses — classify into HPP components ───────────────────────────────
      const expenseData = expenseRes.data ?? [];
      let bbbVariable = 0, btkl = 0, bopVariable = 0, opexCash = 0, inventoryPurchase = 0;
      const expenseRows: TxRow[] = [];
      for (const row of expenseData) {
        const amt  = Number(row.amount) || 0;
        const comp = classifyExpense(row.category, row.cost_type);
        switch (comp) {
          case 'NON_PL':  inventoryPurchase += amt; break;
          case 'BBB_VAR': bbbVariable += amt;        break;
          case 'BTKL':    btkl += amt;               break;
          case 'BOP_VAR': bopVariable += amt;        break;
          case 'OPEX':    opexCash += amt;           break;
        }
        expenseRows.push({
          date: row.date, type: 'expense',
          label: [row.category, comp === 'NON_PL' ? '(Pembelian Aset)' : null, row.description].filter(Boolean).join(' — '),
          amount: amt, cost_type: row.cost_type,
          category: row.category,
          description: row.description || undefined,
          hpp_component: comp,
        });
      }

      // ── Depreciation — production vs. operational assets ──────────────────────
      const assetsData = assetsRes.data ?? [];
      const bopDeprecItems: DepreciationItem[] = assetsData
        .filter((a: any) => a.is_production_asset !== false)
        .map((a: any) => ({
          name:                 a.asset_name as string,
          category:             (a.category as string) || undefined,
          monthly_depreciation: (Number(a.acquisition_cost) || 0) / (Number(a.useful_life_months) || 1),
        }));
      const opexDeprecItems: DepreciationItem[] = assetsData
        .filter((a: any) => a.is_production_asset === false)
        .map((a: any) => ({
          name:                 a.asset_name as string,
          category:             (a.category as string) || undefined,
          monthly_depreciation: (Number(a.acquisition_cost) || 0) / (Number(a.useful_life_months) || 1),
        }));
      const bopFixed  = bopDeprecItems.reduce((s, i) => s + i.monthly_depreciation, 0);
      const opexDeprec = opexDeprecItems.reduce((s, i) => s + i.monthly_depreciation, 0);

      const flocksData = flocksRes.data ?? [];
      const bioDeprecItems: DepreciationItem[] = flocksData
        .filter((f: any) => !INACTIVE_STATUSES.includes(f.status))
        .map((f: any) => ({
          name:                 f.name as string,
          category:             (f.breed as string) || undefined,
          monthly_depreciation: (Number(f.acquisition_cost_total) || 0) / Math.max(Number(f.estimated_productive_days) || 1, 1) * daysInMonth,
        }));
      const bopBio = bioDeprecItems.reduce((s, i) => s + i.monthly_depreciation, 0);

      // ── Totals ────────────────────────────────────────────────────────────────
      const totalRevenue = revenueEgg + revenueOther;
      const totalHPP     = bbbVariable + btkl + bopVariable + bopFixed + bopBio;
      const labaKotor    = totalRevenue - totalHPP;
      const totalOpex    = opexCash + opexDeprec;
      const totalCost    = totalHPP + totalOpex;
      const netProfit    = totalRevenue - totalCost;

      setData({
        revenueEgg, revenueOther, totalRevenue,
        bbbVariable, btkl, bopVariable, bopFixed, bopBio, totalHPP, labaKotor,
        opexCash, opexDeprec, totalOpex,
        totalCost, netProfit, inventoryPurchase,
        incomeRows, expenseRows, bopDeprecItems, opexDeprecItems, bioDeprecItems,
      });

      // ── 6-month trend ─────────────────────────────────────────────────────────
      const monthlyRev:  Record<string, number> = {};
      const monthlyCash: Record<string, number> = {};
      for (const row of inc6Res.data ?? []) {
        const key = row.date.slice(0, 7);
        const amt = Number(row.total_revenue) || Number(row.quantity) * Number(row.price_per_unit) || 0;
        monthlyRev[key] = (monthlyRev[key] || 0) + amt;
      }
      for (const row of exp6Res.data ?? []) {
        const comp = classifyExpense(row.category, row.cost_type);
        if (comp !== 'NON_PL') {
          const key = row.date.slice(0, 7);
          monthlyCash[key] = (monthlyCash[key] || 0) + (Number(row.amount) || 0);
        }
      }
      const depFixedTotal = bopFixed + opexDeprec;
      const depBioRate    = flocksData.filter((f: any) => !INACTIVE_STATUSES.includes(f.status))
        .reduce((s: number, f: any) => s + (Number(f.acquisition_cost_total) || 0) / Math.max(Number(f.estimated_productive_days) || 1, 1), 0);

      const trendPoints: TrendPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d    = new Date(year, month - 1 - i, 1);
        const key  = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
        const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const rev  = monthlyRev[key] || 0;
        const cost = (monthlyCash[key] || 0) + depFixedTotal + depBioRate * days;
        trendPoints.push({
          bulan: MONTH_NAMES[d.getMonth()].slice(0, 3),
          Pendapatan: rev, Biaya: cost, Profit: rev - cost,
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

  // ── Month navigation ──────────────────────────────────────────────────────────
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const rows: (string | number)[][] = [
      ['LAPORAN LABA RUGI — FULL COSTING METHOD', label],
      [],
      ['PENDAPATAN USAHA', ''],
      ['Penjualan Telur', data.revenueEgg],
      ['Pendapatan Lainnya', data.revenueOther],
      ['TOTAL PENDAPATAN', data.totalRevenue],
      [],
      ['HARGA POKOK PRODUKSI (HPP)', ''],
      ['  I. Biaya Bahan Baku (BBB) Variable', data.bbbVariable],
      ['  II. Biaya Tenaga Kerja Langsung (BTKL)', data.btkl],
      ['  III. BOP Variable (Listrik & Utilitas)', data.bopVariable],
      ['  III. BOP Tetap — Penyusutan Aset Produksi', data.bopFixed],
      ['  III. BOP Tetap — Penyusutan Biologis Ayam', data.bopBio],
      ['TOTAL HPP', data.totalHPP],
      [],
      ['LABA KOTOR', data.labaKotor],
      [],
      ['BIAYA OPERASIONAL', ''],
      ['  Biaya Operasional (Cash)', data.opexCash],
      ['  Penyusutan Aset Non-Produksi', data.opexDeprec],
      ['TOTAL BIAYA OPERASIONAL', data.totalOpex],
      [],
      [data.netProfit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH', data.netProfit],
      ...(data.inventoryPurchase > 0 ? [
        [],
        ['--- CATATAN ARUS KAS (Non-P&L) ---', ''],
        ['Pembelian Inventaris Pakan (Aset, bukan beban periode)', -data.inventoryPurchase],
      ] : []),
      [],
      ['--- RINCIAN TRANSAKSI ---', ''],
      ['Tanggal', 'Jenis', 'Komponen', 'Keterangan', 'Nominal'],
      ...[...data.incomeRows, ...data.expenseRows]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(tx => [
          tx.date,
          tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          tx.hpp_component ?? 'INCOME',
          tx.label,
          tx.type === 'income' ? tx.amount : -tx.amount,
        ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `LabaRugi_${year}_${pad2(month)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Export PDF — popup window (zero AppShell overflow interference) ───────────
  const exportPDF = () => {
    const el = document.getElementById('pdf-print');
    if (!el || !data) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Pop-up diblokir browser. Izinkan pop-up untuk poultryos.vercel.app lalu coba lagi.');
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html lang="id"><head>
  <meta charset="UTF-8"/>
  <title>Laporan Laba Rugi — ${MONTH_NAMES[month - 1]} ${year}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media screen { body { padding: 24px; } }
    @media print { @page { size: A4 portrait; margin: 1.2cm 1.5cm; } body { margin: 0; padding: 0; } }
  </style>
</head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  // ── Derived display values ────────────────────────────────────────────────────
  const profit       = data?.netProfit ?? 0;
  const profitMargin = (data?.totalRevenue ?? 0) > 0
    ? ((profit / data!.totalRevenue) * 100).toFixed(1) : '—';
  const HeroIcon  = profit > 0 ? TrendingUp : profit < 0 ? TrendingDown : Minus;
  const heroColor = profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-rose-600' : 'text-zinc-400';
  const heroBg    = profit > 0 ? 'from-emerald-50 to-white border-emerald-100'
                  : profit < 0 ? 'from-rose-50 to-white border-rose-100'
                  :              'from-zinc-50 to-white border-zinc-100';

  const allTx = data
    ? [...data.incomeRows, ...data.expenseRows].sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const hasTrendData  = trend.some(t => t.Pendapatan > 0 || t.Biaya > 0);
  const nonCashCost   = (data?.bopFixed ?? 0) + (data?.bopBio ?? 0) + (data?.opexDeprec ?? 0);
  const printedAt     = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <AppShell>
      {/* Fallback print CSS (untuk Ctrl+P langsung) */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          html, body { height: auto !important; overflow: visible !important;
            background: white !important; margin: 0 !important; padding: 0 !important; }
          #pdf-print { visibility: visible !important; display: block !important;
            position: absolute !important; top: 0 !important; left: 0 !important;
            right: 0 !important; overflow: visible !important; }
          #pdf-print * { visibility: visible !important; overflow: visible !important; }
          @page { size: A4 portrait; margin: 1.2cm 1.5cm; }
        }
      `}</style>

      {/* ── PDF-only hidden div ────────────────────────────────────────────── */}
      <div id="pdf-print" style={{ display: 'none' }}>
        {data && (() => {
          const isProfit = data.netProfit >= 0;

          // Styles
          const SECTION_HDR: React.CSSProperties = { fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' as const, color: '#18181b', borderBottom: '1.5px solid #18181b', paddingBottom: '4px', marginTop: '22px', marginBottom: '2px' };
          const SUB_HDR: React.CSSProperties = { fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#71717a', borderBottom: '1px solid #e4e4e7', paddingBottom: '3px', marginTop: '12px', marginBottom: '1px', paddingLeft: '14px' };
          const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 0 4px 14px', gap: '8px' };
          const LABEL_COL: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '11.5px', color: '#3f3f46' };
          const DATE_CHIP: React.CSSProperties = { fontSize: '10px', color: '#a1a1aa', minWidth: '54px', flexShrink: 0 };
          const AMT_CREDIT: React.CSSProperties = { fontSize: '11.5px', color: '#18181b', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' as const, textAlign: 'right' as const, minWidth: '130px', flexShrink: 0 };
          const AMT_DEBIT: React.CSSProperties = { ...AMT_CREDIT, color: '#dc2626' };
          const TOTAL_ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #d4d4d8', padding: '5px 0 3px 0', marginTop: '3px' };
          const TOTAL_LBL: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#18181b' };
          const TOTAL_G: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums', minWidth: '130px', textAlign: 'right' as const };
          const TOTAL_R: React.CSSProperties = { ...TOTAL_G, color: '#dc2626' };
          const TOTAL_Z: React.CSSProperties = { ...TOTAL_G, color: '#3f3f46' };

          // Partition expense rows
          const bbbRows     = data.expenseRows.filter(r => r.hpp_component === 'BBB_VAR');
          const btklRows    = data.expenseRows.filter(r => r.hpp_component === 'BTKL');
          const bopVarRows  = data.expenseRows.filter(r => r.hpp_component === 'BOP_VAR');
          const opexRows    = data.expenseRows.filter(r => r.hpp_component === 'OPEX');
          const feedRows    = bbbRows.filter(r => /pakan/i.test(r.category ?? ''));
          const nonFeedBBB  = bbbRows.filter(r => !/pakan/i.test(r.category ?? ''));
          const totalFeedCost = feedRows.reduce((s, r) => s + r.amount, 0);

          const fmtD = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

          return (
            <div style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", color: '#18181b', maxWidth: '680px', margin: '0 auto' }}>

              {/* Header */}
              <div style={{ background: '#18181b', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>PoultryOS</div>
                  <div style={{ fontSize: '9px', color: '#71717a', marginTop: '2px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Farm Intelligence Platform</div>
                  {farmName && <div style={{ fontSize: '12px', color: '#d4d4d8', marginTop: '8px', fontWeight: 600 }}>{farmName}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Laporan Laba Rugi</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Periode: {MONTH_NAMES[month - 1]} {year}</div>
                  <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>Metode: Full Costing</div>
                  <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>Dicetak: {printedAt}</div>
                </div>
              </div>

              <div style={{ padding: '4px 0 0' }}>

                {/* ═══ PENDAPATAN USAHA ═══════════════════════════════ */}
                <div style={SECTION_HDR}>Pendapatan Usaha</div>
                {data.incomeRows.length === 0
                  ? <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada pendapatan bulan ini.</span><span style={AMT_CREDIT}>—</span></div>
                  : data.incomeRows.map((row, i) => (
                    <div key={i} style={ROW}>
                      <span style={LABEL_COL}>
                        <span style={DATE_CHIP}>{fmtD(row.date)}</span>
                        <span>
                          {row.category || 'Pendapatan'}
                          {row.buyer_name ? <span style={{ color: '#71717a' }}> — {row.buyer_name}</span> : null}
                          {row.quantity && row.price_per_unit
                            ? <span style={{ color: '#a1a1aa', fontSize: '10px' }}> ({row.quantity.toLocaleString('id-ID')} × {fmtCredit(row.price_per_unit)}/butir)</span>
                            : null}
                        </span>
                      </span>
                      <span style={AMT_CREDIT}>{fmtCredit(row.amount)}</span>
                    </div>
                  ))}
                <div style={TOTAL_ROW}>
                  <span style={TOTAL_LBL}>Total Pendapatan</span>
                  <span style={TOTAL_G}>{fmtCredit(data.totalRevenue)}</span>
                </div>

                {/* ═══ HARGA POKOK PRODUKSI (HPP) ═════════════════════ */}
                <div style={SECTION_HDR}>Harga Pokok Produksi (HPP)</div>

                {/* I. Biaya Bahan Baku (BBB) */}
                <div style={SUB_HDR}>I. Biaya Bahan Baku (BBB) Variable</div>
                {/* Pakan — aggregated */}
                {feedRows.length > 0 && (
                  <div style={ROW}>
                    <span style={LABEL_COL}>
                      <span style={{ fontWeight: 600, color: '#18181b' }}>Biaya Pakan</span>
                      <span style={{ fontSize: '10px', color: '#a1a1aa' }}>({feedRows.length} entri konsumsi harian — input otomatis)</span>
                    </span>
                    <span style={AMT_DEBIT}>{fmtDebit(totalFeedCost)}</span>
                  </div>
                )}
                {/* Non-feed BBB (obat, vitamin, vaksin) — each individually */}
                {nonFeedBBB.map((row, i) => (
                  <div key={i} style={ROW}>
                    <span style={LABEL_COL}>
                      <span style={DATE_CHIP}>{fmtD(row.date)}</span>
                      <span>{row.category || 'Bahan Baku'}{row.description ? <span style={{ color: '#71717a' }}> — {row.description}</span> : null}</span>
                    </span>
                    <span style={AMT_DEBIT}>{fmtDebit(row.amount)}</span>
                  </div>
                ))}
                {bbbRows.length === 0 && (
                  <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada biaya bahan baku tercatat.</span><span style={AMT_DEBIT}>—</span></div>
                )}

                {/* II. BTKL */}
                <div style={SUB_HDR}>II. Biaya Tenaga Kerja Langsung (BTKL)</div>
                {btklRows.length === 0
                  ? <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada biaya tenaga kerja tercatat.</span><span style={AMT_DEBIT}>—</span></div>
                  : btklRows.map((row, i) => (
                    <div key={i} style={ROW}>
                      <span style={LABEL_COL}>
                        <span style={DATE_CHIP}>{fmtD(row.date)}</span>
                        <span>{row.category || 'Gaji & Upah'}{row.description ? <span style={{ color: '#71717a' }}> — {row.description}</span> : null}</span>
                      </span>
                      <span style={AMT_DEBIT}>{fmtDebit(row.amount)}</span>
                    </div>
                  ))}

                {/* III. BOP */}
                <div style={SUB_HDR}>III. Biaya Overhead Pabrik (BOP)</div>

                {/* BOP Variable (listrik, dll) */}
                {bopVarRows.length > 0 && (
                  <>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', paddingLeft: '14px', marginTop: '6px', marginBottom: '2px', fontStyle: 'italic' }}>BOP Variable</div>
                    {bopVarRows.map((row, i) => (
                      <div key={i} style={ROW}>
                        <span style={LABEL_COL}>
                          <span style={DATE_CHIP}>{fmtD(row.date)}</span>
                          <span>{row.category || 'BOP Variable'}{row.description ? <span style={{ color: '#71717a' }}> — {row.description}</span> : null}</span>
                        </span>
                        <span style={AMT_DEBIT}>{fmtDebit(row.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* BOP Tetap — Penyusutan Biologis */}
                <div style={{ fontSize: '9px', color: '#a1a1aa', paddingLeft: '14px', marginTop: '6px', marginBottom: '2px', fontStyle: 'italic' }}>BOP Tetap — Penyusutan Biologis Ayam (Batch Aktif)</div>
                {data.bioDeprecItems.length === 0
                  ? <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada batch aktif.</span><span style={AMT_DEBIT}>—</span></div>
                  : data.bioDeprecItems.map((item, i) => (
                    <div key={i} style={ROW}>
                      <span style={LABEL_COL}>
                        <span style={{ fontWeight: 500, color: '#18181b' }}>{item.name}</span>
                        {item.category ? <span style={{ color: '#71717a', fontSize: '10.5px' }}>({item.category})</span> : null}
                      </span>
                      <span style={AMT_DEBIT}>{fmtDebit(item.monthly_depreciation)}</span>
                    </div>
                  ))}

                {/* BOP Tetap — Penyusutan Aset Produksi */}
                <div style={{ fontSize: '9px', color: '#a1a1aa', paddingLeft: '14px', marginTop: '6px', marginBottom: '2px', fontStyle: 'italic' }}>BOP Tetap — Penyusutan Aset Produksi</div>
                {data.bopDeprecItems.length === 0
                  ? <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada aset produksi terdaftar.</span><span style={AMT_DEBIT}>—</span></div>
                  : data.bopDeprecItems.map((item, i) => (
                    <div key={i} style={ROW}>
                      <span style={LABEL_COL}>
                        <span style={{ fontWeight: 500, color: '#18181b' }}>{item.name}</span>
                        {item.category ? <span style={{ color: '#71717a', fontSize: '10.5px' }}>({item.category})</span> : null}
                      </span>
                      <span style={AMT_DEBIT}>{fmtDebit(item.monthly_depreciation)}</span>
                    </div>
                  ))}

                <div style={TOTAL_ROW}>
                  <span style={TOTAL_LBL}>Total Harga Pokok Produksi</span>
                  <span style={TOTAL_R}>{fmtDebit(data.totalHPP)}</span>
                </div>

                {/* ═══ LABA KOTOR ═════════════════════════════════════ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid #18181b', borderBottom: '1px solid #d4d4d8', padding: '8px 0', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#18181b' }}>Laba Kotor</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: data.labaKotor >= 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums', minWidth: '130px', textAlign: 'right' }}>
                    {data.labaKotor < 0 ? fmtDebit(Math.abs(data.labaKotor)) : fmtCredit(data.labaKotor)}
                  </span>
                </div>

                {/* ═══ BIAYA OPERASIONAL ══════════════════════════════ */}
                <div style={SECTION_HDR}>Biaya Operasional</div>

                {/* Cash OpEx */}
                {opexRows.length > 0 && (
                  <>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', paddingLeft: '14px', marginTop: '6px', marginBottom: '2px', fontStyle: 'italic' }}>Biaya Operasional (Kas)</div>
                    {opexRows.map((row, i) => (
                      <div key={i} style={ROW}>
                        <span style={LABEL_COL}>
                          <span style={DATE_CHIP}>{fmtD(row.date)}</span>
                          <span>{row.category || 'Biaya Operasional'}{row.description ? <span style={{ color: '#71717a' }}> — {row.description}</span> : null}</span>
                        </span>
                        <span style={AMT_DEBIT}>{fmtDebit(row.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Penyusutan Aset Non-Produksi */}
                {data.opexDeprecItems.length > 0 && (
                  <>
                    <div style={{ fontSize: '9px', color: '#a1a1aa', paddingLeft: '14px', marginTop: '6px', marginBottom: '2px', fontStyle: 'italic' }}>Penyusutan Aset Non-Produksi</div>
                    {data.opexDeprecItems.map((item, i) => (
                      <div key={i} style={ROW}>
                        <span style={LABEL_COL}>
                          <span style={{ fontWeight: 500, color: '#18181b' }}>{item.name}</span>
                          {item.category ? <span style={{ color: '#71717a', fontSize: '10.5px' }}>({item.category})</span> : null}
                        </span>
                        <span style={AMT_DEBIT}>{fmtDebit(item.monthly_depreciation)}</span>
                      </div>
                    ))}
                  </>
                )}

                {(opexRows.length === 0 && data.opexDeprecItems.length === 0) && (
                  <div style={{ ...ROW, color: '#a1a1aa', fontSize: '11px' }}><span>Tidak ada biaya operasional tercatat.</span><span style={AMT_DEBIT}>—</span></div>
                )}

                <div style={TOTAL_ROW}>
                  <span style={TOTAL_LBL}>Total Biaya Operasional</span>
                  <span style={TOTAL_Z}>{fmtDebit(data.totalOpex)}</span>
                </div>

                {/* ═══ LABA / RUGI BERSIH ═════════════════════════════ */}
                <div style={{ marginTop: '14px', background: isProfit ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${isProfit ? '#bbf7d0' : '#fecdd3'}`, borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: isProfit ? '#065f46' : '#9f1239' }}>
                    {isProfit ? 'Laba Bersih' : 'Rugi Bersih'}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: isProfit ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                    {data.netProfit < 0 ? fmtDebit(Math.abs(data.netProfit)) : fmtCredit(data.netProfit)}
                  </span>
                </div>

                {/* Catatan Arus Kas */}
                {data.inventoryPurchase > 0 && (
                  <div style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px 12px', fontSize: '10px', color: '#92400e' }}>
                    <strong>Catatan Arus Kas:</strong> Pembelian inventaris pakan periode ini sebesar {fmtCredit(data.inventoryPurchase)} dicatat sebagai aset (bukan beban P&amp;L). Biaya pakan diakui ke HPP saat dikonsumsi (Perpetual Inventory Method).
                  </div>
                )}

                {/* KPI Metrics */}
                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e4e4e7', border: '1px solid #e4e4e7', borderRadius: '6px', overflow: 'hidden' }}>
                  {[
                    { label: 'Profit Margin',    value: `${profitMargin}%`,           sub: 'Laba Bersih / Pendapatan' },
                    { label: 'Total HPP',         value: fmtCredit(data.totalHPP),     sub: 'Harga Pokok Produksi' },
                    { label: 'Total Pendapatan',  value: fmtCredit(data.totalRevenue), sub: `${MONTH_NAMES[month - 1]} ${year}` },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: 'white', padding: '10px 14px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#a1a1aa', marginBottom: '4px' }}>{kpi.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#18181b' }}>{kpi.value}</div>
                      <div style={{ fontSize: '9px', color: '#a1a1aa', marginTop: '2px' }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Footnote */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #e4e4e7', paddingTop: '10px', fontSize: '9px', color: '#a1a1aa', lineHeight: '1.6' }}>
                  <p>Laporan ini menggunakan <strong style={{ color: '#71717a' }}>Full Costing Method</strong> dengan klasifikasi akuntansi biaya: BBB (Biaya Bahan Baku), BTKL (Biaya Tenaga Kerja Langsung), dan BOP (Biaya Overhead Pabrik). Penyusutan aset produksi masuk HPP; penyusutan aset non-produksi masuk Biaya Operasional. Biaya pakan diakui ke HPP saat dikonsumsi (Perpetual Inventory). Laporan ini bersifat internal dan tidak merupakan laporan keuangan audited.</p>
                  <p style={{ marginTop: '6px', color: '#d4d4d8' }}>Dibuat secara otomatis oleh <strong style={{ color: '#a1a1aa' }}>PoultryOS — Farm Intelligence Platform</strong> · {printedAt}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Main page (hidden in print) ──────────────────────────────────── */}
      <div data-no-print className="min-h-screen bg-zinc-50 p-4 sm:p-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Laporan Laba Rugi</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Full Costing — BBB · BTKL · BOP · Biaya Operasional</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
              <button onClick={exportCSV} disabled={!data}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />Excel
              </button>
              <button onClick={exportPDF} disabled={!data}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm">
                <Printer className="w-3.5 h-3.5" />PDF
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
              {/* ── 1. HERO ──────────────────────────────────────────── */}
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

              {/* ── 2. P&L CARD ──────────────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">

                {/* PENDAPATAN */}
                <div className="px-5 py-3 bg-emerald-600">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-50">Pendapatan Usaha</p>
                </div>
                <PLRow icon={<Egg className="w-4 h-4 text-amber-500" />} label="Penjualan Telur"
                  sub={`${MONTH_NAMES[month - 1]} ${year}`} value={data?.revenueEgg ?? 0} />
                {(data?.revenueOther ?? 0) > 0 && (
                  <PLRow icon={<TrendingUp className="w-4 h-4 text-zinc-400" />} label="Pendapatan Lainnya"
                    value={data?.revenueOther ?? 0} />
                )}
                <SectionTotal label="Total Pendapatan" value={data?.totalRevenue ?? 0} color="emerald" />

                {/* HPP */}
                <div className="px-5 py-3 bg-rose-600 mt-px">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-50">Harga Pokok Produksi (HPP)</p>
                </div>

                <SubHeader label={<><TermTooltip term="VC">I. Biaya Bahan Baku (BBB)</TermTooltip>{' Variable — Pakan & Suplemen'}</>} />
                <PLRow icon={<Wheat className="w-4 h-4 text-amber-500" />}
                  label="Bahan Baku & Suplemen"
                  sub="Pakan harian (otomatis) + Obat / Vitamin / Vaksin"
                  value={data?.bbbVariable ?? 0} negative />

                {(data?.btkl ?? 0) > 0 && (
                  <>
                    <SubHeader label={<><TermTooltip term="FC">II. Biaya Tenaga Kerja Langsung</TermTooltip>{' (BTKL)'}</>} />
                    <PLRow icon={<Users className="w-4 h-4 text-violet-500" />}
                      label="Gaji & Upah Karyawan Kandang"
                      sub="Tenaga kerja langsung produksi"
                      value={data?.btkl ?? 0} negative />
                  </>
                )}

                <SubHeader label={<><TermTooltip term="FC">III. Biaya Overhead Pabrik</TermTooltip>{' (BOP)'}</>} />
                {(data?.bopVariable ?? 0) > 0 && (
                  <PLRow icon={<Zap className="w-4 h-4 text-yellow-500" />}
                    label="BOP Variable — Listrik & Utilitas"
                    sub="Biaya overhead variabel (fluktuatif)"
                    value={data?.bopVariable ?? 0} negative />
                )}
                <PLRow icon={<Bird className="w-4 h-4 text-amber-500" />}
                  label="BOP Tetap — Penyusutan Biologis Ayam"
                  sub="Batch aktif — berdasarkan masa produktif"
                  value={data?.bopBio ?? 0} negative />
                <PLRow icon={<Factory className="w-4 h-4 text-indigo-500" />}
                  label="BOP Tetap — Penyusutan Aset Produksi"
                  sub="Kandang, mesin, & peralatan produksi"
                  value={data?.bopFixed ?? 0} negative />

                <SectionTotal label="Total HPP" value={data?.totalHPP ?? 0} color="rose" />

                {/* LABA KOTOR intermediate */}
                <div className="flex items-center justify-between px-5 py-3 bg-zinc-900">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Laba Kotor</p>
                  <p className={`text-sm font-bold ${(data?.labaKotor ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(data?.labaKotor ?? 0) < 0 ? '(' : ''}{fmt(Math.abs(data?.labaKotor ?? 0))}{(data?.labaKotor ?? 0) < 0 ? ')' : ''}
                  </p>
                </div>

                {/* BIAYA OPERASIONAL */}
                <div className="px-5 py-3 bg-zinc-600 mt-px">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-100">Biaya Operasional</p>
                </div>
                {(data?.opexCash ?? 0) > 0 && (
                  <PLRow icon={<Wrench className="w-4 h-4 text-zinc-400" />}
                    label="Biaya Operasional (Kas)"
                    sub="Distribusi, administrasi, dan lainnya"
                    value={data?.opexCash ?? 0} negative />
                )}
                {(data?.opexDeprec ?? 0) > 0 && (
                  <PLRow icon={<Building2 className="w-4 h-4 text-zinc-400" />}
                    label="Penyusutan Aset Non-Produksi"
                    sub="Kendaraan, peralatan kantor, dan lainnya"
                    value={data?.opexDeprec ?? 0} negative />
                )}
                {(data?.opexCash ?? 0) === 0 && (data?.opexDeprec ?? 0) === 0 && (
                  <div className="px-5 py-3 text-sm text-zinc-400 italic">Tidak ada biaya operasional bulan ini.</div>
                )}
                <SectionTotal label="Total Biaya Operasional" value={data?.totalOpex ?? 0} color="zinc" />

                {/* LABA BERSIH */}
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

              {/* ── 2b. CATATAN ARUS KAS ──────────────────────────────── */}
              {(data?.inventoryPurchase ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                      <Wheat className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Catatan Arus Kas — Pembelian Inventaris</p>
                      <p className="text-sm text-amber-700 mt-0.5">Pembelian pakan bulan ini dicatat sebagai <span className="font-semibold">aset inventaris</span>, bukan beban P&L.</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">Biaya pakan diakui ke HPP saat dikonsumsi, bukan saat dibeli.</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Kas Keluar</p>
                    <p className="text-lg font-bold text-amber-700">− {fmt(data?.inventoryPurchase ?? 0)}</p>
                  </div>
                </div>
              )}

              {/* ── 3. KPI GRID ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Profit Margin',   value: `${profitMargin}%`,              sub: 'Laba / Pendapatan',        color: profit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                  { label: 'Total Pendapatan', value: fmt(data?.totalRevenue ?? 0),   sub: MONTH_NAMES[month - 1],     color: 'text-zinc-900' },
                  { label: 'Total HPP',        value: fmt(data?.totalHPP ?? 0),       sub: 'BBB + BTKL + BOP',         color: 'text-rose-600' },
                  { label: 'Biaya Non-Kas',    value: fmt(nonCashCost),               sub: 'Total penyusutan bulan ini', color: 'text-indigo-600' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1">{kpi.label}</p>
                    <p className={`text-lg font-bold truncate ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── 4. TREND 6 BULAN ─────────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Tren 6 Bulan Terakhir</h3>
                    <p className="text-[10px] text-zinc-400">Pendapatan vs Total Biaya vs Profit/Rugi</p>
                  </div>
                </div>
                {!hasTrendData ? (
                  <div className="py-12 text-center text-zinc-400 text-sm">Belum ada data historis.</div>
                ) : (
                  <>
                    <div className="px-2 pt-4 pb-2 h-64 sm:h-72">
                      <ProfitTrendChart trend={trend} />
                    </div>
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

              {/* ── 5. TRANSACTION DETAIL ────────────────────────────── */}
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

              {/* ── 6. FOOTNOTE ──────────────────────────────────────── */}
              <p className="text-[11px] text-zinc-400 leading-relaxed text-center px-4 pb-2">
                Laporan menggunakan <span className="font-semibold">Full Costing Method</span> — BBB, BTKL, dan BOP dibebankan ke HPP.
                Penyusutan aset produksi masuk BOP; aset non-produksi masuk Biaya Operasional.
                Biaya pakan masuk HPP saat dikonsumsi (bukan saat dibeli).
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
