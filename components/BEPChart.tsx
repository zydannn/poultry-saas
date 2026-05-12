'use client';

import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceDot,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import TermTooltip from '@/components/TermTooltip';

type Timeframe = 'Mingguan' | 'Bulanan';

const TIMEFRAME_CONFIG: Record<Timeframe, { label: string; xLabel: string }> = {
    Mingguan:  { label: 'Mingguan', xLabel: 'Butir/Minggu' },
    Bulanan:   { label: 'Bulanan',  xLabel: 'Butir/Bulan' },
};

const formatRupiah = (value: number) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value.toFixed(0)}`;
};

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: number }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs text-white">
            <p className="font-semibold text-zinc-300 mb-1">{formatNumber(label ?? 0)} butir</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: {formatRupiah(p.value)}
                </p>
            ))}
        </div>
    );
};

// Days per period — used to scale monthly FC to the selected timeframe
const PERIOD_DAYS: Record<Timeframe, number> = { Mingguan: 7, Bulanan: 30 };

export default function BEPChart({
    fixedCostOverride,
    vcPerUnitOverride,
    sellingPriceOverride,
}: {
    fixedCostOverride?: number;
    vcPerUnitOverride?: number;
    sellingPriceOverride?: number;
}) {
    const [timeframe, setTimeframe] = useState<Timeframe>('Mingguan');
    const cfg = TIMEFRAME_CONFIG[timeframe];

    // All values come from analytics_cvp_monthly (monthly base) via DashboardContent props.
    // FC is MONTHLY — must be scaled to the selected period.
    // VC per unit and selling price are PER EGG — no scaling needed.
    const monthly_fc      = fixedCostOverride    ?? 0;
    const vc_per_unit     = vcPerUnitOverride     ?? 0;
    const selling_price   = sellingPriceOverride  ?? 0;

    // Scale FC to selected period: weekly = monthly × (7/30)
    const periodDays      = PERIOD_DAYS[timeframe];
    const fc_for_period   = monthly_fc * (periodDays / 30);

    const marginKontribusi = selling_price - vc_per_unit;
    const bepUnit          = marginKontribusi > 0 ? fc_for_period / marginKontribusi : 0;
    const bepRevenue       = bepUnit * selling_price;



    const isInvalid = isNaN(fc_for_period) || isNaN(vc_per_unit) || isNaN(selling_price);
    const isEmpty   = fc_for_period === 0 && selling_price === 0;

    const chartData = useMemo(() => {
        if (isEmpty || isInvalid) return [];

        const safeBepUnit = bepUnit > 0 ? bepUnit : 1000;
        const maxX = safeBepUnit * 2.5;
        const step = Math.ceil(maxX / 10);

        const points: { volume: number; pendapatan: number; biayaTetap: number; totalBiaya: number }[] = [];

        for (let i = 0; i <= maxX; i += step) {
            points.push({
                volume:     Math.round(i),
                pendapatan: i * selling_price,
                totalBiaya: fc_for_period + (i * vc_per_unit),
                biayaTetap: fc_for_period,
            });
        }

        if (bepUnit > 0) {
            points.push({
                volume:     bepUnit,
                pendapatan: bepRevenue,
                totalBiaya: bepRevenue,
                biayaTetap: fc_for_period,
            });
        }

        points.sort((a, b) => a.volume - b.volume);
        return points;
    }, [isEmpty, isInvalid, bepUnit, bepRevenue, selling_price, fc_for_period, vc_per_unit]);

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900">
                            Analisis <TermTooltip term="BEP">BEP</TermTooltip> (Break-Even Point)
                        </h3>
                        <p className="text-[10px] text-zinc-400">Grafik Biaya-Volume-Profit (CVP)</p>
                    </div>
                </div>

                {/* Timeframe Tabs */}
                <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400 ml-1 shrink-0" />
                    {(Object.keys(TIMEFRAME_CONFIG) as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                timeframe === tf
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                            {TIMEFRAME_CONFIG[tf].label}
                        </button>
                    ))}
                </div>
            </div>

            <>
                    {/* BEP Callout */}
                    {!isEmpty && !isInvalid ? (
                        <div className="mx-5 mt-4 flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[140px] bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
                                    <TermTooltip term="BEP">BEP</TermTooltip> Produksi
                                </p>
                                <p className="text-lg font-bold text-emerald-800 mt-0.5">{formatNumber(Math.ceil(bepUnit))} butir</p>
                                <p className="text-[10px] text-emerald-600">{cfg.xLabel}</p>
                            </div>
                            <div className="flex-1 min-w-[140px] bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">Titik Impas (Revenue)</p>
                                <p className="text-lg font-bold text-indigo-800 mt-0.5 truncate">{formatRupiah(bepRevenue)}</p>
                                <p className="text-[10px] text-indigo-600">/{cfg.label}</p>
                            </div>
                            <div className="flex-1 min-w-[140px] bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                                    <TermTooltip term="FC">Biaya Tetap</TermTooltip> ({cfg.label})
                                </p>
                                <p className="text-lg font-bold text-zinc-800 mt-0.5 truncate">{formatRupiah(fc_for_period)}</p>
                                <p className="text-[10px] text-zinc-400">Termasuk penyusutan aset &amp; ayam pullet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                            Need more transaction data untuk mengkalkulasi BEP.
                        </div>
                    )}

                    {/* Chart */}
                    <div className="px-4 pb-4 pt-4 h-64 sm:h-80">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                                    <XAxis
                                        dataKey="volume"
                                        type="number"
                                        domain={[0, 'dataMax']}
                                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                                        tick={{ fontSize: 10, fill: '#a1a1aa' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: cfg.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#71717a' } }}
                                    />
                                    <YAxis
                                        tickFormatter={formatRupiah}
                                        domain={['auto', 'auto']}
                                        tick={{ fontSize: 10, fill: '#a1a1aa' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={56}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                    />
                                    {/* BEP Reference Markers */}
                                    {bepUnit > 0 && bepRevenue > 0 && (
                                        <>
                                            {/* Garis bantu vertikal ke sumbu X (Unit) */}
                                            <ReferenceLine x={bepUnit} stroke="#94a3b8" strokeDasharray="3 3" />
                                            
                                            {/* Garis bantu horizontal ke sumbu Y (Rupiah) */}
                                            <ReferenceLine y={bepRevenue} stroke="#94a3b8" strokeDasharray="3 3" />
                                            
                                            {/* Titik Pusat BEP */}
                                            <ReferenceDot 
                                                x={bepUnit} 
                                                y={bepRevenue} 
                                                r={6} 
                                                fill="#3b82f6" 
                                                stroke="#ffffff" 
                                                strokeWidth={2} 
                                            />
                                        </>
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="pendapatan"
                                        name="Total Pendapatan"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="totalBiaya"
                                        name="Total Biaya"
                                        stroke="#f43f5e"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="biayaTetap"
                                        name="Biaya Tetap"
                                        stroke="#71717a"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-zinc-100 rounded-xl text-zinc-400 text-xs">
                                Grafik tidak tersedia
                            </div>
                        )}
                    </div>
            </>
        </div>
    );
}
