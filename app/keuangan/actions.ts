'use server';

import { createClient } from '@/utils/supabase/server';

// ─── Payload Type (total_revenue intentionally excluded — GENERATED ALWAYS AS) ─
export interface SalePayload {
  date: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  buyer_name?: string;
  description?: string;
}

// ─── Discriminated Union Result ───────────────────────────────────────────────
export type ActionResult =
  | { success: true }
  | { success: false; error: string; code: 'INSUFFICIENT_STOCK' | 'INVALID_INPUT' | 'DB_ERROR' };


/**
 * submitEggSale
 *
 * Guards: quantity > 0 → currentStock ≥ quantity → INSERT
 * Does NOT pass total_revenue; the DB computes it via GENERATED ALWAYS AS.
 */
export async function submitEggSale(payload: SalePayload): Promise<ActionResult> {
  // ── 1. Input sanity ────────────────────────────────────────────────────────
  if (!payload.quantity || payload.quantity <= 0) {
    return {
      success: false,
      error: 'Kuantitas penjualan harus lebih dari 0.',
      code: 'INVALID_INPUT',
    };
  }
  if (!payload.price_per_unit || payload.price_per_unit <= 0) {
    return {
      success: false,
      error: 'Harga per unit harus lebih dari 0.',
      code: 'INVALID_INPUT',
    };
  }

  const supabase = await createClient();

  // ── 2. Hitung stok telur langsung dari sumber data ────────────────────────
  // Stok = total panen (good_eggs) - total pecah (broken_eggs) - total terjual
  const [
    { data: dailyRows, error: dailyError },
    { data: salesRows, error: salesError },
  ] = await Promise.all([
    supabase.from('daily_records').select('good_eggs, broken_eggs'),
    supabase.from('finance_income').select('quantity').eq('category', 'Penjualan Telur'),
  ]);

  if (dailyError || salesError) {
    const msg = dailyError?.message ?? salesError?.message ?? 'Unknown';
    console.error('[submitEggSale] Stock fetch error:', msg);
    return {
      success: false,
      error: `Gagal membaca stok telur: ${msg}`,
      code: 'DB_ERROR',
    };
  }

  const totalPanen = (dailyRows ?? []).reduce((s, r) => s + (Number(r.good_eggs)  || 0), 0);
  const totalPecah = (dailyRows ?? []).reduce((s, r) => s + (Number(r.broken_eggs) || 0), 0);
  const totalSold  = (salesRows ?? []).reduce((s, r) => s + (Number(r.quantity)    || 0), 0);
  const currentStock = Math.max(0, totalPanen - totalPecah - totalSold);

  // ── 3. Business rule: reject if sellQty > currentStock ────────────────────
  if (payload.quantity > currentStock) {
    return {
      success: false,
      error: `Stok tidak mencukupi. Tersedia: ${currentStock.toLocaleString('id-ID')} butir, diminta: ${payload.quantity.toLocaleString('id-ID')} butir.`,
      code: 'INSUFFICIENT_STOCK',
    };
  }

  // ── 4. Safe INSERT — total_revenue excluded (GENERATED ALWAYS AS) ──────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Sesi tidak valid. Silakan login ulang.', code: 'DB_ERROR' };
  }

  const { error: insertError } = await supabase.from('finance_income').insert({
    date: payload.date,
    category: payload.category,
    quantity: payload.quantity,
    unit: payload.unit,
    price_per_unit: payload.price_per_unit,
    buyer_name: payload.buyer_name ?? null,
    description: payload.description ?? null,
    user_id: user.id,
  });

  if (insertError) {
    console.error('[submitEggSale] Insert error:', insertError.message);
    return {
      success: false,
      error: `Gagal menyimpan transaksi: ${insertError.message}`,
      code: 'DB_ERROR',
    };
  }

  return { success: true };
}

/**
 * submitGenericIncome
 *
 * For non-egg income categories (no stock validation required).
 * Same constraint: total_revenue excluded from payload.
 */
export async function submitGenericIncome(payload: SalePayload): Promise<ActionResult> {
  if (!payload.quantity || payload.quantity <= 0) {
    return { success: false, error: 'Kuantitas harus lebih dari 0.', code: 'INVALID_INPUT' };
  }
  if (!payload.price_per_unit || payload.price_per_unit <= 0) {
    return { success: false, error: 'Harga per unit harus lebih dari 0.', code: 'INVALID_INPUT' };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Sesi tidak valid. Silakan login ulang.', code: 'DB_ERROR' };
  }

  const { error } = await supabase.from('finance_income').insert({
    date: payload.date,
    category: payload.category,
    quantity: payload.quantity,
    unit: payload.unit,
    price_per_unit: payload.price_per_unit,
    buyer_name: payload.buyer_name ?? null,
    description: payload.description ?? null,
    user_id: user.id,
  });

  if (error) {
    console.error('[submitGenericIncome] Insert error:', error.message);
    return { success: false, error: `Gagal menyimpan: ${error.message}`, code: 'DB_ERROR' };
  }

  return { success: true };
}
