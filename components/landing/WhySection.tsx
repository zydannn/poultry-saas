'use client';

import { useEffect, useRef } from 'react';
import { ShieldCheck, Zap, LineChart, Globe } from 'lucide-react';

const POINTS = [
    {
        icon: Globe,
        title: 'Dibuat untuk Peternak Indonesia',
        desc: 'Antarmuka dalam Bahasa Indonesia, format mata uang Rupiah, dan alur kerja sesuai kebiasaan peternak lokal.',
    },
    {
        icon: LineChart,
        title: 'Operasional + Keuangan dalam Satu Platform',
        desc: 'Tidak perlu aplikasi terpisah. Dari catatan harian hingga laporan laba rugi, semuanya tersinkron otomatis.',
    },
    {
        icon: Zap,
        title: 'Kalkulasi Instan, Data Akurat',
        desc: 'HPP, BEP, dan profit dihitung otomatis di sisi server — tidak ada perhitungan manual yang bisa salah.',
    },
    {
        icon: ShieldCheck,
        title: 'Data Aman & Privat',
        desc: 'Setiap akun terisolasi dengan Row-Level Security. Data Anda hanya bisa diakses oleh Anda.',
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

export default function WhySection() {
    const ref = useScrollReveal();

    return (
        <section className="bg-zinc-950 py-20 sm:py-28 px-4">
            <div ref={ref} className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-14">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Mengapa PoultryOS
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                        Platform yang Dibangun
                        <br />
                        <span className="text-zinc-400">Bersama Peternak</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-xl mx-auto">
                        Bukan sekadar spreadsheet digital — PoultryOS menggabungkan operasional peternakan
                        dengan pengelolaan keuangan yang sesungguhnya.
                    </p>
                </div>

                {/* Points grid */}
                <div className="grid sm:grid-cols-2 gap-5">
                    {POINTS.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="group rounded-2xl border border-white/5 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06]"
                        >
                            <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/5 p-3">
                                <Icon className="h-5 w-5 text-zinc-300" />
                            </div>
                            <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Stats bar */}
                <div className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                    {[
                        { value: '6+', label: 'Modul terintegrasi' },
                        { value: '100%', label: 'Berbasis cloud' },
                        { value: 'Rp 0', label: 'Biaya berlangganan' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
                            <p className="mt-1 text-xs text-zinc-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
