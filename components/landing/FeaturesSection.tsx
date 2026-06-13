'use client';

import { useEffect, useRef } from 'react';
import {
    LayoutDashboard,
    Egg,
    Package,
    Calculator,
    BarChart2,
    Users,
} from 'lucide-react';

const FEATURES = [
    {
        icon: LayoutDashboard,
        title: 'Dashboard Produksi',
        desc: 'Lihat ringkasan produksi harian, HDP, stok telur, dan performa kandang dalam satu tampilan.',
        color: 'bg-violet-50 text-violet-600 border-violet-100',
        badge: 'Real-time',
    },
    {
        icon: Egg,
        title: 'Monitoring Telur',
        desc: 'Catat produksi telur baik dan pecah setiap hari. Stok otomatis terhitung setelah penjualan.',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        badge: 'Otomatis',
    },
    {
        icon: Package,
        title: 'Manajemen Pakan',
        desc: 'Kelola stok pakan, catat konsumsi harian, dan pantau harga per kg untuk akurasi HPP.',
        color: 'bg-amber-50 text-amber-600 border-amber-100',
        badge: 'Stok Ledger',
    },
    {
        icon: Calculator,
        title: 'HPP Otomatis',
        desc: 'Kalkulasi Harga Pokok Produksi dengan metode Full Costing — BBB, BTKL, dan BOP — tanpa hitung manual.',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        badge: 'Full Costing',
    },
    {
        icon: BarChart2,
        title: 'Laporan Keuangan',
        desc: 'Laporan laba rugi, BEP, dan tren profit bulanan. Ekspor ke PDF dengan format akuntansi profesional.',
        color: 'bg-rose-50 text-rose-600 border-rose-100',
        badge: 'PDF Export',
    },
    {
        icon: Users,
        title: 'Monitoring Populasi',
        desc: 'Pantau jumlah ayam aktif, mortalitas harian, dan HDP per batch kandang secara akurat.',
        color: 'bg-teal-50 text-teal-600 border-teal-100',
        badge: 'Per Kandang',
    },
];

function useScrollReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(32px)';
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                    obs.disconnect();
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return ref;
}

export default function FeaturesSection() {
    const ref = useScrollReveal();

    return (
        <section className="bg-white py-20 sm:py-28 px-4">
            <div ref={ref} className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-14">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Fitur Unggulan
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
                        Semua yang Dibutuhkan
                        <br className="hidden sm:block" />
                        <span className="text-zinc-500"> Peternak Modern</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto">
                        Dari pencatatan harian hingga laporan keuangan — satu platform, semua beres.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map(({ icon: Icon, title, desc, color, badge }) => (
                        <div
                            key={title}
                            className="group relative rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 transition-all duration-300 hover:border-zinc-200 hover:bg-white hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {/* Badge */}
                            <span className="absolute top-4 right-4 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                                {badge}
                            </span>

                            {/* Icon */}
                            <div className={`mb-4 inline-flex rounded-xl border p-3 ${color}`}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <h3 className="mb-2 text-sm font-semibold text-zinc-900">{title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
