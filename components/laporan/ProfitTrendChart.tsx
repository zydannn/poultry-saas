'use client';

/**
 * ProfitTrendChart — lazy-loaded Recharts wrapper untuk laporan/page.tsx
 * Dipisah ke file ini agar recharts TIDAK masuk bundle utama.
 * Import via: dynamic(() => import('@/components/laporan/ProfitTrendChart'), { ssr: false })
 */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

export interface TrendPoint {
    bulan: string;
    Pendapatan: number;
    Biaya: number;
    Profit: number;
}

const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(v);

const fmtShort = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return String(Math.round(v));
};

function TrendTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-xs text-white space-y-1.5">
            <p className="font-bold text-zinc-300 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    );
}

export default function ProfitTrendChart({ trend }: { trend: TrendPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={trend}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barGap={2}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f4f4f5"
                    vertical={false}
                />
                <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tickFormatter={fmtShort}
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                />
                <Tooltip content={<TrendTooltip />} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <ReferenceLine y={0} stroke="#e4e4e7" />
                <Bar
                    dataKey="Pendapatan"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                />
                <Bar
                    dataKey="Biaya"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                />
                <Bar
                    dataKey="Profit"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
