'use client';

import { motion } from 'framer-motion';
import { Star, Quote, MessageSquare } from 'lucide-react';

const TESTIMONIALS = [
    { 
        name: 'Pak Suharto', 
        location: 'Blitar, Jawa Timur', 
        scale: '3.000 ekor', 
        rating: 5, 
        quote: 'HPP saya jadi jauh lebih jelas. Dulu hitung manual pakai buku, sering meleset. Sekarang tinggal input harian, semuanya otomatis dan rapi.', 
        initial: 'S',
        grad: 'from-emerald-500 to-teal-400'
    },
    { 
        name: 'Bu Rahayu', 
        location: 'Boyolali, Jawa Tengah', 
        scale: '1.500 ekor', 
        rating: 5, 
        quote: 'Laporan keuangannya rapi sekali. Waktu mau ajukan modal ke bank, saya tinggal cetak laporan laba rugi dari aplikasi. Sangat membantu.', 
        initial: 'R',
        grad: 'from-amber-500 to-orange-400'
    },
    { 
        name: 'Pak Darmawan', 
        location: 'Makassar, Sulawesi Selatan', 
        scale: '5.000 ekor', 
        rating: 5, 
        quote: 'Input harian cuma butuh beberapa menit. Stok pakan dan telur langsung ter-update. Praktis untuk pantau banyak kandang sekaligus.', 
        initial: 'D',
        grad: 'from-blue-500 to-cyan-400'
    },
];

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
};

export default function TestimonialsSection() {
    return (
        <section id="testimoni" className="scroll-mt-16 bg-zinc-50 py-20 px-4 sm:py-28 border-b border-zinc-200/50">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, amount: 0.3 }} 
                    transition={{ duration: 0.6 }} 
                    className="mb-16 text-center"
                >
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        <MessageSquare className="h-3.5 w-3.5" /> Suara Peternak
                    </p>
                    <h2 className="text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl md:text-4xl">
                        Dipercaya &amp; Digunakan <span className="text-zinc-500">Peternak Indonesia</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 sm:text-base font-medium">
                        Cerita peternak yang berhasil mendigitalisasi operasional kandang dan meningkatkan laba bersih.
                    </p>
                </motion.div>

                {/* Cards Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid gap-6 md:grid-cols-3"
                >
                    {TESTIMONIALS.map((t, i) => (
                        <motion.div 
                            key={t.name} 
                            variants={itemVariants}
                            className="relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden"
                        >
                            {/* Decorative quotes icon */}
                            <Quote className="absolute right-5 top-5 h-8 w-8 text-zinc-100 group-hover:text-zinc-150 transition-colors duration-300" fill="currentColor" />
                            
                            {/* Rating Stars */}
                            <div className="mb-4 flex gap-0.5">
                                {[...Array(5)].map((_, s) => (
                                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            
                            {/* Quote Text */}
                            <p className="relative flex-1 text-sm leading-relaxed text-zinc-600 font-medium">
                                "{t.quote}"
                            </p>
                            
                            {/* User details footer */}
                            <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-4">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr text-white text-sm font-bold shadow-md shadow-zinc-250 ${t.grad}`}>
                                    {t.initial}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-zinc-950 truncate">{t.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-semibold truncate uppercase tracking-wider">
                                        {t.location} · {t.scale}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
