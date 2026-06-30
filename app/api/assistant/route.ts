import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Bangun ringkasan konteks peternakan milik user (dipakai sebagai system prompt).
async function buildFarmContext(): Promise<string> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return '';

        const [profileRes, flocksRes, cvpRes, stockRes, invRes] = await Promise.all([
            supabase.from('farm_profile').select('*').maybeSingle(),
            supabase.from('flocks').select('name, current_population, status, breed'),
            supabase.from('analytics_cvp_monthly').select('*').maybeSingle(),
            supabase.rpc('get_egg_stock_totals'),
            supabase.from('inventory').select('item_name, category, quantity, unit'),
        ]);

        const parts: string[] = [];
        if (profileRes.data) parts.push(`Profil peternakan: ${JSON.stringify(profileRes.data)}`);
        if (flocksRes.data?.length) parts.push(`Kandang aktif: ${JSON.stringify(flocksRes.data)}`);
        if (cvpRes.data) parts.push(`Analitik HPP/BEP bulan berjalan: ${JSON.stringify(cvpRes.data)}`);
        if (stockRes.data) parts.push(`Total stok telur: ${JSON.stringify(stockRes.data)}`);
        if (invRes.data?.length) parts.push(`Inventory: ${JSON.stringify(invRes.data)}`);

        return parts.join('\n');
    } catch {
        return '';
    }
}

export async function POST(req: Request) {
    // Wajib login
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            reply:
                '⚠️ Asisten AI belum aktif. Tambahkan ANTHROPIC_API_KEY di environment (.env.local atau Vercel) lalu restart aplikasi.',
        });
    }

    let messages: ChatMessage[] = [];
    try {
        const body = await req.json();
        if (Array.isArray(body?.messages)) messages = body.messages;
    } catch {
        return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
    }

    // Ambil hanya 12 pesan terakhir + pastikan bentuknya benar
    const trimmed = messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-12);

    if (trimmed.length === 0) {
        return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 });
    }

    const context = await buildFarmContext();

    const system = [
        'Kamu adalah asisten cerdas PoultryOS, aplikasi manajemen peternakan ayam petelur.',
        'Jawab SELALU dalam Bahasa Indonesia yang ringkas, ramah, dan praktis untuk peternak.',
        'Gunakan data peternakan pengguna di bawah ini bila relevan. Jangan mengarang angka yang tidak ada datanya — katakan jika datanya belum tersedia.',
        'Fokus pada topik peternakan ayam petelur: produksi telur, HPP, BEP, pakan, populasi, mortalitas, dan keuangan. Tolak sopan pertanyaan di luar topik.',
        'Format jawaban singkat (maksimal beberapa kalimat atau poin). Sebutkan satuan (Rp, butir, Kg) bila menyebut angka.',
        context ? `\n--- DATA PETERNAKAN PENGGUNA ---\n${context}` : '\n(Catatan: data peternakan pengguna belum tersedia.)',
    ].join('\n');

    try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system,
                messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
            }),
        });

        if (!resp.ok) {
            const detail = await resp.text();
            console.error('[assistant] Anthropic API error:', resp.status, detail);
            return NextResponse.json(
                { error: 'Asisten sedang sibuk. Coba lagi sebentar.' },
                { status: 502 },
            );
        }

        const data = await resp.json();
        const reply =
            Array.isArray(data?.content)
                ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim()
                : '';

        return NextResponse.json({ reply: reply || 'Maaf, saya belum bisa menjawab itu.' });
    } catch (err) {
        console.error('[assistant] fetch error:', err);
        return NextResponse.json({ error: 'Gagal menghubungi asisten.' }, { status: 500 });
    }
}
