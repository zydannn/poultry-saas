'use client';

import Link from 'next/link';
import { ArrowRight, Egg } from 'lucide-react';
import { useEffect, useRef } from 'react';

function useScrollReveal(threshold = 0.15) {
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

export default function CtaSection() {
    const ref = useScrollReveal();

    return (
        <>
            <section className="bg-white py-20 sm:py-28 px-4">
                <div ref={ref} className="mx-auto max-w-2xl text-center">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg">
                        <Egg className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
                        Siap Mengelola Peternakan
                        <br />
                        Secara Profesional?
                    </h2>
                    <p className="mt-5 text-sm sm:text-base text-zinc-500 max-w-md mx-auto">
                        Bergabung sekarang. Gratis selamanya.
                        Tidak perlu kartu kredit atau instalasi apapun.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/login"
                            className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-700 hover:shadow-xl active:scale-95"
                        >
                            Mulai Sekarang
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-7 py-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:shadow active:scale-95"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-100 bg-zinc-50 py-8 px-4">
                <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900">
                            <Egg className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-700">PoultryOS</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                        © {new Date().getFullYear()} PoultryOS · Platform Manajemen Peternakan Ayam
                    </p>
                    <div className="flex gap-4">
                        <Link href="/login" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                            Login
                        </Link>
                        <Link href="/login" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                            Daftar
                        </Link>
                    </div>
                </div>
            </footer>
        </>
    );
}
