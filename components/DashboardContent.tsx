'use client';

import React, { useState, useEffect } from 'react';
import {
    Egg,
    Scale,
    AlertTriangle,
    ChevronRight,
    Warehouse,
    TrendingUp,
    TrendingDown,
    Package,
    Weight,
    Calculator,
    Target,
    LineChart,
    Sparkles,
    X,
    Loader2,
    Settings,
    Bird,
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import BEPChart from './BEPChart';
import SimulationPanel from './dashboard/SimulationPanel';
import TermTooltip from '@/components/TermTooltip';
import OnboardingGuide from '@/components/OnboardingGuide';

// --- Types ---
interface LowStockItem {
    item_name: string;
    quantity: number;
    unit: string;
}

interface FeedLedgerRow {
    feed_name: string;
    category: string;
    actual_stock: number;
}

interface FlockStatus {
    id: string;
    name: string;
    ageWeeks: number;
    hdp: string;
}

interface LedgerEntry {
    tanggal: string;
    panen_masuk: number;
    penjualan_keluar: number;
    telur_pecah: number;
    mutasi_bersih: number;
    detail_panen?: Record<string, number>;
}

interface DashboardData {
    // CVP — Single Source of Truth: analytics_cvp_monthly
    hpp: number;
    hppPerKg: number;
    vcPerUnit: number;
    fcBulanIni: number;
    bepUnits: number | null;
    sellingPrice: number;
    marketPrice: number;
    targetMarginPercent: number;
    totalTelurBulanIni: number;
    // Operational
    todayEggs: number;
    eggStock: number;
    totalFeedStockKg: number;
    lowStockItems: LowStockItem[];
    flockStatuses: FlockStatus[];
    globalFCR: number;
    isEstimated: boolean;
}

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

const formatNumber = (value: number) =>
    new Intl.NumberFormat('id-ID').format(Math.round(value));

export default function DashboardContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({
        hpp: 0, hppPerKg: 0, vcPerUnit: 0, fcBulanIni: 0, bepUnits: null,
        sellingPrice: 0, marketPrice: 0, targetMarginPercent: 0, totalTelurBulanIni: 0,
        todayEggs: 0, eggStock: 0, totalFeedStockKg: 0,
        lowStockItems: [], flockStatuses: [], globalFCR: 0, isEstimated: false,
    });

    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const onboardingDismissed = localStorage.getItem('poultryos_onboarding_done');
                const today = new Date().toISOString().split('T')[0];
                const firstDayOfMonth = today.substring(0, 7) + '-01';

                const [
                    { data: cvpData },
                    { data: allDailyEggs },
                    { data: allEggSales },
                    { data: feedLedgerData },
                    { data: monthlyRecords },
                    { data: flocksData },
                    { data: profileData },
                ] = await Promise.all([
                    // SSOT: semua kalkulasi finansial dari view
                    supabase.from('analytics_cvp_monthly').select('*').limit(1).maybeSingle(),
                    // Stok telur: hitung langsung dari daily_records (semua waktu)
                    supabase.from('daily_records').select('good_eggs, broken_eggs'),
                    // Stok telur: kurangi semua penjualan telur dari finance_income
                    supabase.from('finance_income').select('quantity').eq('category', 'Penjualan Telur'),
                    // Stok pakan dari ledger view
                    supabase.from('feed_stock_ledger').select('*'),
                    // Daily records bulan ini: untuk panen hari ini & FCR
                    supabase.from('daily_records')
                        .select('flock_id, date, good_eggs, broken_eggs, feed_consumed_kg')
                        .gte('date', firstDayOfMonth),
                    // Kandang aktif: untuk status cards
                    supabase.from('flocks')
                        .select('id, name, current_population, hatch_date, status')
                        .neq('status', 'Inactive')
                        .neq('status', 'Archived'),
                    // Farm profile: hanya untuk berat telur default (konversi HPP/Kg)
                    supabase.from('farm_profile')
                        .select('default_egg_weight_grams')
                        .limit(1).maybeSingle(),
                ]);

                // ── CVP: semua dari analytics_cvp_monthly ──────────────────────
                const hpp            = Number(cvpData?.hpp_per_butir)        || 0;
                const vcPerUnit      = Number(cvpData?.vc_per_butir)         || 0;
                const fcBulanIni     = Number(cvpData?.total_fc_bulan_ini)   || 0;
                const bepUnits       = cvpData?.bep_units != null ? Number(cvpData.bep_units) : null;
                const sellingPrice   = Number(cvpData?.selling_price)        || 0;
                const marketPrice    = Number(cvpData?.market_price)         || 0;
                const targetMarginPercent = Number(cvpData?.target_margin_percent) || 0;
                const totalTelurBulanIni  = Number(cvpData?.total_telur_bulan_ini) || 1;

                // HPP/Kg: konversi sederhana, bukan agregasi
                const defaultEggWeight = Number(profileData?.default_egg_weight_grams) || 60;
                const hppPerKg = defaultEggWeight > 0 ? hpp / (defaultEggWeight / 1000) : 0;

                // ── Stok telur: panen_total - pecah_total - terjual_total ──────
                const totalPanen = (allDailyEggs || []).reduce((s, r) => s + Number(r.good_eggs  || 0), 0);
                const totalPecah = (allDailyEggs || []).reduce((s, r) => s + Number(r.broken_eggs || 0), 0);
                const totalSold  = (allEggSales  || []).reduce((s, r) => s + Number(r.quantity   || 0), 0);
                const eggStock   = Math.max(0, totalPanen - totalPecah - totalSold);

                // ── Stok pakan + low stock alerts ─────────────────────────────
                const feedLedger = (feedLedgerData as FeedLedgerRow[] | null) || [];
                const totalFeedStockKg = feedLedger
                    .reduce((sum, row) => sum + Number(row.actual_stock || 0), 0);
                const lowStockItems: LowStockItem[] = feedLedger
                    .filter(row => Number(row.actual_stock) < 50)
                    .map(row => ({
                        item_name: row.feed_name,
                        quantity: Number(row.actual_stock) || 0,
                        unit: 'Kg',
                    }));

                // ── Panen hari ini + FCR bulanan ───────────────────────────────
                const records = monthlyRecords || [];
                let todayEggs = 0;
                let totalGoodEggs = 0;
                let totalFeedConsumed = 0;
                const todayFlockEggs: Record<string, number> = {};

                records.forEach(rec => {
                    const good   = Number(rec.good_eggs)        || 0;
                    const broken = Number(rec.broken_eggs)      || 0;
                    const feed   = Number(rec.feed_consumed_kg) || 0;
                    totalGoodEggs    += good;
                    totalFeedConsumed += feed;
                    if (rec.date === today) {
                        todayEggs += good + broken;
                        if (rec.flock_id) {
                            todayFlockEggs[rec.flock_id] =
                                (todayFlockEggs[rec.flock_id] || 0) + good + broken;
                        }
                    }
                });

                const totalEggMassKg = (totalGoodEggs * defaultEggWeight) / 1000;
                const globalFCR = totalEggMassKg > 0 ? totalFeedConsumed / totalEggMassKg : 0;

                // ── Flock status cards ─────────────────────────────────────────
                const flockStatuses: FlockStatus[] = (flocksData || []).map(flock => {
                    const ageWeeks = Math.floor(
                        Math.abs(Date.now() - new Date(flock.hatch_date).getTime()) /
                        (1000 * 60 * 60 * 24 * 7)
                    );
                    const eggsToday = todayFlockEggs[flock.id];
                    const hdp = (eggsToday !== undefined && flock.current_population > 0)
                        ? ((eggsToday / flock.current_population) * 100).toFixed(1) + '%'
                        : '-';
                    return { id: flock.id, name: flock.name || 'Unnamed Flock', ageWeeks: ageWeeks || 0, hdp };
                });

                // isEstimated: tidak ada data panen riil bulan ini (view fallback ke 1)
                const isEstimated = totalTelurBulanIni <= 1;

                setData({
                    hpp, hppPerKg, vcPerUnit, fcBulanIni, bepUnits,
                    sellingPrice, marketPrice, targetMarginPercent, totalTelurBulanIni,
                    todayEggs, eggStock, totalFeedStockKg,
                    lowStockItems, flockStatuses, globalFCR, isEstimated,
                });

                if (!onboardingDismissed) {
                    setShowOnboarding(true);
                }

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchLedgerData = async () => {
        setIsLoadingLedger(true);
        try {
            const [{ data: dailyRows }, { data: salesRows }, { data: flocksRows }] = await Promise.all([
                supabase
                    .from('daily_records')
                    .select('date, good_eggs, broken_eggs, flock_id')
                    .order('date', { ascending: false }),
                supabase
                    .from('finance_income')
                    .select('date, quantity')
                    .eq('category', 'Penjualan Telur'),
                supabase
                    .from('flocks')
                    .select('id, name'),
            ]);

            // Build flock id → name lookup
            const flockMap: Record<string, string> = {};
            for (const f of flocksRows ?? []) flockMap[f.id] = f.name;

            // Aggregate daily_records by date
            const byDate: Record<string, { panen: number; pecah: number; detail: Record<string, number> }> = {};
            for (const row of dailyRows ?? []) {
                const d = row.date;
                if (!byDate[d]) byDate[d] = { panen: 0, pecah: 0, detail: {} };
                const good   = Number(row.good_eggs)   || 0;
                const broken = Number(row.broken_eggs) || 0;
                byDate[d].panen += good;
                byDate[d].pecah += broken;
                const flockName = flockMap[row.flock_id] || row.flock_id || '—';
                if (good > 0) byDate[d].detail[flockName] = (byDate[d].detail[flockName] || 0) + good;
            }

            // Aggregate egg sales by date
            const salesByDate: Record<string, number> = {};
            for (const row of salesRows ?? []) {
                salesByDate[row.date] = (salesByDate[row.date] || 0) + (Number(row.quantity) || 0);
            }

            // Merge all unique dates, sort descending
            const allDates = Array.from(new Set([
                ...Object.keys(byDate),
                ...Object.keys(salesByDate),
            ])).sort((a, b) => b.localeCompare(a));

            const entries: LedgerEntry[] = allDates.map(date => {
                const panen = byDate[date]?.panen ?? 0;
                const pecah = byDate[date]?.pecah ?? 0;
                const sold  = salesByDate[date] ?? 0;
                return {
                    tanggal:          date,
                    panen_masuk:      panen,
                    penjualan_keluar: sold,
                    telur_pecah:      pecah,
                    mutasi_bersih:    panen - pecah - sold,
                    detail_panen:     byDate[date]?.detail,
                };
            });

            setLedgerData(entries);
        } catch (e) {
            console.error('[fetchLedgerData] error:', e);
        } finally {
            setIsLoadingLedger(false);
        }
    };

    const handleOpenLedger = () => {
        setIsLedgerModalOpen(true);
        fetchLedgerData();
    };

    if (isLoading) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 min-h-[calc(100vh-64px)]">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Executive Dashboard</h1>
                    <p className="mt-1 text-sm text-zinc-500 truncate">Tinjauan bisnis utama dan status operasional peternakan.</p>
                </div>
                <div className="space-y-8 animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-2xl bg-zinc-200/60 border border-zinc-200" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-2xl bg-zinc-200/60 border border-zinc-200" />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    const {
        hpp = 0, hppPerKg = 0,
        vcPerUnit = 0, fcBulanIni = 0, bepUnits = null,
        sellingPrice = 0, marketPrice = 0, targetMarginPercent = 0, totalTelurBulanIni = 0,
        todayEggs = 0, eggStock = 0, totalFeedStockKg = 0,
        lowStockItems = [], flockStatuses = [], globalFCR = 0, isEstimated = false,
    } = data;

    const priceDiff     = sellingPrice - marketPrice;
    const isCheaper     = priceDiff < 0;
    const suggestedPrice = hpp + hpp * (targetMarginPercent / 100);

    return (
        <>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 min-h-[calc(100vh-64px)] w-full overflow-hidden">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 break-words">
                        Executive Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500 whitespace-normal break-words">
                        Tinjauan bisnis utama dan status operasional peternakan.
                    </p>
                </div>
                <button
                    onClick={() => setShowOnboarding(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm"
                    title="Buka panduan memulai"
                >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Panduan
                </button>
            </div>

            {/* ── Empty State Banner: user baru tanpa data ─────────────────────── */}
            {data.hpp === 0 && data.flockStatuses.length === 0 && data.totalFeedStockKg === 0 && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-amber-900">Selamat datang! Mulai setup peternakan Anda</h3>
                            <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                                Dashboard masih kosong karena data peternakan belum diisi. Ikuti 5 langkah berikut agar HPP, BEP, dan semua analisis berjalan otomatis.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link href="/pengaturan" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
                                    <Settings className="h-3.5 w-3.5" /> 1. Isi Pengaturan
                                </Link>
                                <Link href="/flocks" className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors">
                                    <Bird className="h-3.5 w-3.5" /> 2. Tambah Batch Ayam
                                </Link>
                                <Link href="/inventory" className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors">
                                    <Package className="h-3.5 w-3.5" /> 3. Isi Stok Pakan
                                </Link>
                                <button
                                    onClick={() => setShowOnboarding(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
                                >
                                    Lihat Panduan Lengkap →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-8">

                {/* Tier 1 - Part 1: Basic Metrics */}
                <div className="grid grid-cols-2 gap-4 w-full">

                    {/* Card 1: Panen Hari Ini */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shrink-0">
                            <Egg className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">Panen Hari Ini</p>
                        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                            <p className="text-xl md:text-2xl font-bold text-zinc-900 truncate">{formatNumber(todayEggs)}</p>
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-400">butir</span>
                        </div>
                    </div>

                    {/* Card 2: Stok Telur */}
                    <div
                        onClick={handleOpenLedger}
                        className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 group relative cursor-pointer w-full overflow-hidden"
                    >
                        <ChevronRight className="absolute top-4 right-4 h-5 w-5 text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition-all duration-200" />
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase truncate">
                            <TermTooltip term="Stok Telur">STOK TELUR</TermTooltip>
                        </p>
                        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                            <p className="text-xl md:text-2xl font-bold text-zinc-900 truncate">{formatNumber(eggStock)}</p>
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-400">butir</span>
                        </div>
                    </div>

                    {/* Card 3: Stok Pakan */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                            <Warehouse className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">Stok Pakan</p>
                        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                            <p className="text-xl md:text-2xl font-bold text-zinc-900 truncate">{formatNumber(totalFeedStockKg)}</p>
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-400 truncate">Kg</span>
                        </div>
                    </div>

                    {/* Card 4: FCR Global */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 shrink-0">
                            <Weight className="h-5 w-5 text-cyan-600" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">
                            <TermTooltip term="FCR">FCR</TermTooltip>
                        </p>
                        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                            <p className="text-xl md:text-2xl font-bold text-zinc-900 truncate">{globalFCR.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Tier 1 - Part 2: Financial Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">

                    {/* Card 5: HPP — dari analytics_cvp_monthly.hpp_per_butir */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden relative md:col-span-2 lg:col-span-1">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                            <Calculator className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full ${isEstimated ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isEstimated ? 'Estimasi' : 'Aktual'}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">
                            <TermTooltip term="HPP">HPP</TermTooltip> Peternakan (per butir)
                        </p>
                        <div className="mt-1">
                            <p className="text-xl md:text-2xl font-bold text-rose-600 truncate">{formatRupiah(hpp)}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                                Setara {formatRupiah(hppPerKg)} / Kg
                            </p>
                        </div>
                    </div>

                    {/* Card 6: Saran Harga Jual */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden relative">
                        <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
                            Margin {targetMarginPercent}%
                        </div>
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                            <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">
                            <TermTooltip term="Saran Harga Jual">Saran Harga Jual</TermTooltip>
                        </p>
                        <div className="mt-1">
                            <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate">{formatRupiah(suggestedPrice)}</p>
                        </div>
                    </div>

                    {/* Card 7: Info Harga Pasar */}
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md w-full overflow-hidden">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 shrink-0">
                            <LineChart className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide truncate">
                                <TermTooltip term="Harga Pasar">Info Harga Pasar</TermTooltip>
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                <span className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate mr-2">Harga Kita</span>
                                <span className="text-sm md:text-base font-bold text-zinc-900 truncate">{formatRupiah(sellingPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between bg-violet-50 p-2 rounded-lg border border-violet-100">
                                <span className="text-[10px] sm:text-xs text-violet-600 font-medium truncate mr-2">Harga Pasar</span>
                                <span className="text-sm md:text-base font-bold text-violet-700 truncate">{formatRupiah(marketPrice)}</span>
                            </div>
                        </div>
                        <p className={`mt-2 text-[10px] font-semibold flex items-center gap-1 whitespace-normal break-words ${isCheaper ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {priceDiff === 0 ? (
                                <span className="text-zinc-500">Sama dengan harga pasar</span>
                            ) : isCheaper ? (
                                <><TrendingDown className="h-3 w-3 shrink-0" /> Lebih murah {formatRupiah(Math.abs(priceDiff))} dari pasar</>
                            ) : (
                                <><TrendingUp className="h-3 w-3 shrink-0" /> Lebih mahal {formatRupiah(Math.abs(priceDiff))} dari pasar</>
                            )}
                        </p>
                    </div>
                </div>

                {/* Tier 2: Alert System */}
                {lowStockItems.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 break-words">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <h3 className="text-sm font-bold text-amber-900 truncate">Perhatian: Stok Menipis</h3>
                        </div>
                        <ul className="list-disc pl-7 space-y-1">
                            {lowStockItems.map((item, idx) => (
                                <li key={idx} className="text-sm text-amber-700 break-words whitespace-normal">
                                    Stok pakan menipis: <span className="font-semibold">{item.item_name}</span> sisa {item.quantity} {item.unit}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* BEP Chart — props dari analytics_cvp_monthly */}
                <BEPChart
                    fixedCostOverride={fcBulanIni}
                    vcPerUnitOverride={vcPerUnit}
                    sellingPriceOverride={sellingPrice}
                />

                {/* Simulasi Risiko Pasar — props dari analytics_cvp_monthly */}
                <SimulationPanel
                    baseFixedCost={fcBulanIni}
                    baseVC={vcPerUnit}
                    basePrice={sellingPrice}
                    currentProduction={totalTelurBulanIni}
                />

                {/* Tier 3: Flock Quick Status */}
                <div className="w-full overflow-hidden">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2 truncate">
                        <Scale className="h-5 w-5 text-zinc-400 shrink-0" />
                        Status Kandang Aktif
                    </h2>
                    <div className="space-y-3 w-full">
                        {flockStatuses.length === 0 ? (
                            <div className="text-center py-8 bg-white border border-zinc-200 rounded-xl w-full">
                                <p className="text-sm text-zinc-500 truncate">Belum ada kandang aktif.</p>
                            </div>
                        ) : (
                            flockStatuses.map(flock => (
                                <Link href={`/flocks/${flock.id}`} key={flock.id} className="block w-full">
                                    <div className="group flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden w-full">
                                        <div className="flex items-center gap-3 overflow-hidden mr-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                            <div className="overflow-hidden">
                                                <h3 className="font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                                                    {flock.name}
                                                </h3>
                                                <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 truncate">
                                                    Umur: <span className="font-medium text-zinc-700">{flock.ageWeeks} Minggu</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-zinc-400 truncate">
                                    <TermTooltip term="HDP">HDP</TermTooltip> Hari Ini
                                </p>
                                                <p className={`font-bold text-sm sm:text-base ${flock.hdp === '-' ? 'text-zinc-300' : 'text-zinc-900'}`}>
                                                    {flock.hdp}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Drill-Down Ledger Modal */}
            {isLedgerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">Buku Besar Stok Telur</h2>
                                    <p className="text-xs text-zinc-500 font-medium tracking-wide">RIWAYAT MUTASI HARIAN</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsLedgerModalOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="text-xs uppercase tracking-wider text-zinc-500 bg-zinc-50 border-b border-zinc-200">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Tanggal</th>
                                                <th className="px-6 py-4 font-semibold text-right">Panen Masuk</th>
                                                <th className="px-6 py-4 font-semibold text-right">Penjualan Keluar</th>
                                                <th className="px-6 py-4 font-semibold text-right">Pecah/Afkir</th>
                                                <th className="px-6 py-4 font-semibold text-right">Mutasi Bersih</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {isLoadingLedger ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-300" />
                                                        <p>Memuat data mutasi stok...</p>
                                                    </td>
                                                </tr>
                                            ) : ledgerData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                                                        Belum ada data stok tercatat.
                                                    </td>
                                                </tr>
                                            ) : (
                                                ledgerData.map((row, idx) => {
                                                    const mutasi = Number(row.mutasi_bersih);
                                                    return (
                                                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                                            <td className="px-6 py-4 text-zinc-700 font-medium">
                                                                {new Date(row.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="font-medium text-emerald-600">
                                                                    {row.panen_masuk > 0 ? `+${formatNumber(row.panen_masuk)}` : '0'}
                                                                </div>
                                                                {row.detail_panen && Object.keys(row.detail_panen).length > 0 && (
                                                                    <div className="text-[10px] text-zinc-400 font-normal mt-1 flex flex-col gap-0.5">
                                                                        {Object.entries(row.detail_panen).map(([flockName, amount]) => (
                                                                            <span key={flockName}>{flockName}: {formatNumber(amount as number)}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-rose-600">
                                                                {row.penjualan_keluar > 0 ? `-${formatNumber(row.penjualan_keluar)}` : '0'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-amber-500">
                                                                {row.telur_pecah > 0 ? `-${formatNumber(row.telur_pecah)}` : '0'}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right font-bold ${mutasi > 0 ? 'text-blue-600' : mutasi < 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                                                                {mutasi > 0 ? `+${formatNumber(mutasi)}` : formatNumber(mutasi)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                        {ledgerData.length > 0 && (() => {
                                            const totalPanen  = ledgerData.reduce((s, r) => s + (r.panen_masuk      || 0), 0);
                                            const totalJual   = ledgerData.reduce((s, r) => s + (r.penjualan_keluar || 0), 0);
                                            const totalPecah  = ledgerData.reduce((s, r) => s + (r.telur_pecah      || 0), 0);
                                            const totalSaldo  = ledgerData.reduce((s, r) => s + (r.mutasi_bersih    || 0), 0);
                                            return (
                                                <tfoot className="bg-zinc-900 text-white text-xs font-bold">
                                                    <tr>
                                                        <td className="px-6 py-3">Total / Saldo Stok</td>
                                                        <td className="px-6 py-3 text-right text-emerald-400">+{formatNumber(totalPanen)}</td>
                                                        <td className="px-6 py-3 text-right text-rose-400">{totalJual > 0 ? `-${formatNumber(totalJual)}` : '0'}</td>
                                                        <td className="px-6 py-3 text-right text-amber-400">{totalPecah > 0 ? `-${formatNumber(totalPecah)}` : '0'}</td>
                                                        <td className="px-6 py-3 text-right text-blue-300">{totalSaldo > 0 ? `+${formatNumber(totalSaldo)}` : formatNumber(totalSaldo)} butir</td>
                                                    </tr>
                                                </tfoot>
                                            );
                                        })()}
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-zinc-100 bg-white flex justify-end">
                            <button
                                onClick={() => setIsLedgerModalOpen(false)}
                                className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
        <OnboardingGuide
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
        />
        </>
    );
}
