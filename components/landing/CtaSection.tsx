'use client';

import Link from 'next/link';
import { ArrowRight, Egg, PhoneCall, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const WA_NUMBER = '6285716036435';
const WA_MESSAGE = encodeURIComponent(
    'Halo, saya ingin berkonsultasi tentang PoultryOS untuk peternakan saya.'
);
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function CtaSection() {
    return (
        <>
            <section className="bg-white py-20 sm:py-28 px-4 relative overflow-hidden">
                {/* Background decorative orbs */}
                <div className="absolute right-[-10%] bottom-[-10%] h-[30rem] w-[30rem] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                
                <div className="mx-auto max-w-4xl relative z-10">
                    {/* Main CTA Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="rounded-3xl bg-zinc-950 p-8 sm:p-12 text-center relative overflow-hidden glow-emerald"
                    >
                        {/* Glow spots inside */}
                        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
                        
                        <div className="relative z-10 space-y-6">
                            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 shadow-md">
                                <Egg className="h-6 w-6 text-white" />
                            </div>
                            
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                                Siap Mengelola Peternakan <br className="hidden sm:block" />
                                Anda Lebih <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">Profesional &amp; Menguntungkan?</span>
                            </h2>
                            
                            <p className="text-zinc-400 max-w-md mx-auto text-xs sm:text-sm font-medium leading-relaxed">
                                Bergabunglah bersama ratusan peternak mandiri di Indonesia. 100% gratis selamanya tanpa biaya tersembunyi.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                                <Link 
                                    href="/login" 
                                    className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-100 px-6.5 py-3.5 text-sm font-bold text-zinc-950 shadow-md transition-all hover:-translate-y-0.5"
                                >
                                    Daftar Gratis
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-zinc-950" />
                                </Link>
                                <Link 
                                    href="/login" 
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-6.5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
                                >
                                    Masuk ke Dashboard
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* WhatsApp Consultation banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                        className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:flex-row shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 sm:flex shadow-inner">
                                <PhoneCall className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-950">Ingin tahu cara implementasi di kandang Anda?</h4>
                                <p className="text-xs text-zinc-500 font-medium mt-0.5">Konsultasikan kebutuhan manajemen kandang Anda bersama tim asisten kami.</p>
                            </div>
                        </div>
                        <a 
                            href={WA_LINK} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all active:scale-98 sm:w-auto"
                        >
                            <WhatsAppIcon className="h-4.5 w-4.5" />
                            Hubungi via WhatsApp
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-200/60 bg-zinc-50 py-12 px-6">
                <div className="mx-auto max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                        {/* Footer Logo & Brand info */}
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-amber-400 shadow">
                                    <Egg className="h-4.5 w-4.5 text-white" />
                                </div>
                                <span className="text-sm font-extrabold text-zinc-950">PoultryOS</span>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">
                                Platform asisten pintar peternak ayam petelur. Mengotomatisasi kalkulasi keuangan dan data kandang dalam satu sistem terintegrasi.
                            </p>
                        </div>

                        {/* Quick links */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aplikasi</h4>
                            <div className="flex flex-col gap-2">
                                <Link href="/login" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors">Masuk</Link>
                                <Link href="/login" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors">Daftar Akun</Link>
                                <a href="#demo" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors">Lihat Demo</a>
                            </div>
                        </div>

                        {/* Help / Contact */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bantuan</h4>
                            <div className="flex flex-col gap-2">
                                <a 
                                    href={WA_LINK} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs font-semibold text-zinc-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
                                >
                                    <HelpCircle className="h-3.5 w-3.5 text-zinc-400" /> Hubungi Kami
                                </a>
                                <span className="text-xs font-medium text-zinc-400">Senin - Sabtu · 08.00 - 17.00</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-zinc-200/60 mb-6" />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[11px] font-semibold text-zinc-400">
                            © {new Date().getFullYear()} PoultryOS · Farm Intelligence Platform. All rights reserved.
                        </p>
                        <p className="text-[11px] font-semibold text-zinc-400">
                            Dibuat dengan presisi untuk peternak mandiri Indonesia.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
