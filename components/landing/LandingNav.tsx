'use client';

import Link from 'next/link';
import { Egg, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
    { label: 'Demo', href: '#demo' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Testimoni', href: '#testimoni' },
];

export default function LandingNav() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <motion.header
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/70 backdrop-blur-md shadow-lg shadow-zinc-100/50 border-b border-zinc-200/50 py-3'
                        : 'bg-transparent py-5'
                }`}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Egg className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 bg-clip-text text-transparent">
                                Poultry<span className="text-emerald-500">OS</span>
                            </span>
                            <span className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-widest leading-none mt-0.5">Farm Intelligence</span>
                        </div>
                    </Link>

                    {/* Center nav links (desktop) */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="relative rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 group"
                            >
                                {link.label}
                                <span className="absolute bottom-1.5 left-4 right-4 h-0.5 scale-x-0 bg-gradient-to-r from-emerald-500 to-amber-500 transition-transform duration-300 group-hover:scale-x-100" />
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="hidden sm:inline-block rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                        >
                            Login
                        </Link>
                        <Link
                            href="/login"
                            className="hidden sm:inline-block rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm px-5 py-2.5 shadow-md shadow-zinc-900/10 hover:shadow-lg hover:shadow-zinc-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Mulai Gratis
                        </Link>
                        
                        {/* Hamburger button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 hover:bg-zinc-50 transition-colors focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5 text-zinc-800" /> : <Menu className="h-5 w-5 text-zinc-800" />}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Nav Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 top-16 z-40 md:hidden border-b border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-6 shadow-xl flex flex-col gap-5"
                    >
                        <div className="flex flex-col gap-2">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-xl px-4 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                        <hr className="border-zinc-100" />
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-11 items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/10 transition-colors"
                            >
                                Mulai Gratis
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
