'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
    'Berapa HPP telur saya bulan ini?',
    'Kenapa HPP saya bisa tinggi?',
    'Bagaimana kondisi stok pakan saya?',
    'Tips menaikkan HDP kandang?',
];

export default function AiAssistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    const send = async (text: string) => {
        const content = text.trim();
        if (!content || loading) return;
        const next: Msg[] = [...messages, { role: 'user', content }];
        setMessages(next);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ messages: next }),
            });
            const data = await res.json();
            const reply = data.reply || data.error || 'Maaf, terjadi gangguan. Coba lagi.';
            setMessages((m) => [...m, { role: 'assistant', content: reply }]);
        } catch {
            setMessages((m) => [...m, { role: 'assistant', content: 'Gagal terhubung ke asisten. Periksa koneksi Anda.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Tombol mengambang */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Tutup asisten' : 'Buka asisten AI'}
                className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed bottom-24 right-5 z-50 flex h-[28rem] max-h-[75vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2.5 border-b border-zinc-100 bg-zinc-950 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">Asisten PoultryOS</p>
                                <p className="text-[11px] text-zinc-400">Tanya apa saja soal peternakan Anda</p>
                            </div>
                        </div>

                        {/* Pesan */}
                        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                            {messages.length === 0 && (
                                <div className="space-y-3">
                                    <div className="rounded-xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-700">
                                        Halo! 👋 Saya asisten PoultryOS. Saya bisa membaca data peternakan Anda dan bantu menjawab pertanyaan seputar HPP, stok, produksi, dan keuangan.
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTIONS.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => send(s)}
                                                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
                                        m.role === 'user'
                                            ? 'ml-auto rounded-tr-sm bg-zinc-900 text-white'
                                            : 'rounded-tl-sm bg-zinc-100 text-zinc-700'
                                    }`}
                                >
                                    {m.content}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 rounded-xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Mengetik…
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                send(input);
                            }}
                            className="flex items-center gap-2 border-t border-zinc-100 p-3"
                        >
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tulis pertanyaan…"
                                className="h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                aria-label="Kirim"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-all hover:bg-zinc-700 active:scale-95 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
