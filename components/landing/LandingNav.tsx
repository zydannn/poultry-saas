'use client';

import Link from 'next/link';
import { Egg } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingNav() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-zinc-100'
                    : 'bg-transparent'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                        <Egg className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 tracking-tight">PoultryOS</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                    >
                        Login
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-700 active:scale-95"
                    >
                        Mulai Gratis
                    </Link>
                </div>
            </div>
        </header>
    );
}
