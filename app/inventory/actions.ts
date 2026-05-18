'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Payload Types ────────────────────────────────────────────────────────────
export interface FeedConsumptionPayload {
  feed_name: string;
  category: string;
  feed_consumed_kg: number;
  transaction_date: string;
}

export interface FeedPurchasePayload {
  feed_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  transaction_date: string;
}

// ─── Result Type ──────────────────────────────────────────────────────────────
export type ActionResult =
  | { success: true }
  | { success: false; error: string; code: 'INSUFFICIENT_FEED_STOCK' | 'INVALID_INPUT' | 'DB_ERROR' };

// ─── Internal Types ───────────────────────────────────────────────────────────
interface FeedLedgerRow {
  actual_stock: number;
}

/**
 * submitDailyFeedConsumption
 *
 * Validates stock then inserts a negative inventory_transaction.
 * Actual quantity deduction from inventory.quantity is handled by
 * the otomatisasi_stok_pakan DB trigger on daily_records.
 * This function is for direct consumption recording without daily_records.
 */
export async function submitDailyFeedConsumption(payload: FeedConsumptionPayload): Promise<ActionResult> {
  if (!payload.feed_consumed_kg || payload.feed_consumed_kg <= 0) {
    return { success: false, error: 'Konsumsi pakan harian harus lebih dari 0 kg.', code: 'INVALID_INPUT' };
  }

  const supabase = await createClient();

  const { data: ledgerData, error: ledgerError } = await supabase
    .from('feed_stock_ledger')
    .select('actual_stock')
    .eq('feed_name', payload.feed_name)
    .single();

  if (ledgerError && ledgerError.code !== 'PGRST116') {
    return { success: false, error: `Gagal membaca stok pakan: ${ledgerError.message}`, code: 'DB_ERROR' };
  }

  const currentStock = ledgerData ? Number((ledgerData as FeedLedgerRow).actual_stock) : 0;

  if (payload.feed_consumed_kg > currentStock) {
    return {
      success: false,
      error: `Stok pakan tidak mencukupi! Tersedia: ${currentStock.toLocaleString('id-ID')} Kg, Dibutuhkan: ${payload.feed_consumed_kg.toLocaleString('id-ID')} Kg.`,
      code: 'INSUFFICIENT_FEED_STOCK',
    };
  }

  // Find inventory item to get proper FK
  const { data: inventoryItem } = await supabase
    .from('inventory')
    .select('id')
    .eq('item_name', payload.feed_name)
    .eq('category', 'Pakan')
    .maybeSingle();

  if (!inventoryItem) {
    return { success: false, error: 'Item pakan tidak ditemukan di inventaris.', code: 'DB_ERROR' };
  }

  const { error: insertError } = await supabase
    .from('inventory_transactions')
    .insert({
      inventory_id:     inventoryItem.id,
      quantity:         -Math.abs(payload.feed_consumed_kg),
      unit_cost:        0,
      transaction_date: payload.transaction_date,
    });

  if (insertError) {
    return { success: false, error: `Gagal mencatat konsumsi pakan: ${insertError.message}`, code: 'DB_ERROR' };
  }

  revalidatePath('/inventory');
  return { success: true };
}

/**
 * submitFeedPurchase
 *
 * Alur yang benar (Perpetual Inventory Method):
 *   A. Validate inputs
 *   B. UPSERT inventory master item:
 *      - Jika item baru: INSERT dengan quantity & unit_cost
 *      - Jika sudah ada: UPDATE quantity += qty_beli, unit_cost = harga_terbaru
 *      → inventory.unit_cost dibutuhkan oleh trigger fn_record_feed_variable_cost
 *      → inventory.quantity dibutuhkan oleh trigger otomatisasi_stok_pakan
 *   C. INSERT inventory_transactions dengan inventory_id yang benar (audit trail)
 *   D. INSERT ke finance_expenses dengan cost_type='Inventaris' untuk visibilitas
 *      arus kas keluar di halaman Keuangan (dikecualikan dari kalkulasi P&L).
 */
export async function submitFeedPurchase(payload: FeedPurchasePayload): Promise<ActionResult> {
  // ── A. Validasi ────────────────────────────────────────────────────────────
  if (!payload.quantity || payload.quantity <= 0) {
    return { success: false, error: 'Kuantitas pembelian harus lebih dari 0.', code: 'INVALID_INPUT' };
  }
  if (payload.unit_cost == null || payload.unit_cost < 0) {
    return { success: false, error: 'Harga per unit tidak valid.', code: 'INVALID_INPUT' };
  }
  if (!payload.transaction_date) {
    return { success: false, error: 'Tanggal pembelian wajib diisi.', code: 'INVALID_INPUT' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Sesi tidak valid. Silakan login ulang.', code: 'DB_ERROR' };
  }

  // ── B. UPSERT inventory master item ───────────────────────────────────────
  const { data: existing } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('item_name', payload.feed_name)
    .eq('category', 'Pakan')
    .maybeSingle();

  let inventoryId: string;

  if (existing) {
    // Tambah quantity + update unit_cost ke harga pembelian terbaru
    const { data: updated, error: updateError } = await supabase
      .from('inventory')
      .update({
        quantity:  Number(existing.quantity) + payload.quantity,
        unit_cost: payload.unit_cost,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (updateError) {
      return { success: false, error: `Gagal update stok: ${updateError.message}`, code: 'DB_ERROR' };
    }
    inventoryId = updated.id;
  } else {
    // Buat item baru
    const { data: created, error: createError } = await supabase
      .from('inventory')
      .insert({
        item_name: payload.feed_name,
        category:  'Pakan',
        quantity:  payload.quantity,
        unit_cost: payload.unit_cost,
        unit:      'Kg',
        user_id:   user.id,
      })
      .select('id')
      .single();

    if (createError) {
      return { success: false, error: `Gagal membuat item stok: ${createError.message}`, code: 'DB_ERROR' };
    }
    inventoryId = created.id;
  }

  // ── C. INSERT inventory_transactions (audit trail pembelian) ───────────────
  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      inventory_id:     inventoryId,
      quantity:         Math.abs(payload.quantity),
      unit_cost:        payload.unit_cost,
      transaction_date: payload.transaction_date,
      user_id:          user.id,
    });

  if (txError) {
    return { success: false, error: `Gagal mencatat riwayat pembelian: ${txError.message}`, code: 'DB_ERROR' };
  }

  // ── D. INSERT finance_expenses untuk visibilitas arus kas di Keuangan ──────
  // cost_type dibiarkan NULL (DB constraint hanya izinkan 'Variable'/'Fixed').
  // FinanceTab mendeteksi baris ini via category.startsWith('Pembelian').
  const totalAmount = payload.quantity * payload.unit_cost;
  if (totalAmount > 0) {
    await supabase.from('finance_expenses').insert({
      date:        payload.transaction_date,
      category:    'Pembelian Pakan',
      description: `${payload.feed_name} — ${payload.quantity.toLocaleString('id-ID')} Kg @ Rp ${payload.unit_cost.toLocaleString('id-ID')}/Kg`,
      amount:      totalAmount,
      user_id:     user.id,
    });
  }

  revalidatePath('/inventory');
  revalidatePath('/keuangan');
  return { success: true };
}

/**
 * deleteInventoryTransaction
 *
 * Menghapus satu transaksi pembelian pakan dari audit trail.
 * Juga mengurangi inventory.quantity dan menghapus finance_expenses terkait.
 */
export async function deleteInventoryTransaction(transactionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.', code: 'DB_ERROR' };

  // 1. Ambil detail transaksi yang akan dihapus
  const { data: tx, error: txFetchErr } = await supabase
    .from('inventory_transactions')
    .select('id, quantity, unit_cost, transaction_date, inventory_id')
    .eq('id', transactionId)
    .single();

  if (txFetchErr || !tx) {
    return { success: false, error: 'Transaksi tidak ditemukan.', code: 'DB_ERROR' };
  }

  // Hanya hapus transaksi positif (pembelian) — bukan konsumsi
  if (tx.quantity <= 0) {
    return { success: false, error: 'Hanya entri pembelian (qty positif) yang dapat dihapus.', code: 'INVALID_INPUT' };
  }

  // 2. Kurangi inventory.quantity
  const { data: inv } = await supabase
    .from('inventory')
    .select('id, quantity, item_name')
    .eq('id', tx.inventory_id)
    .single();

  if (inv) {
    const newQty = Math.max(0, Number(inv.quantity) - Number(tx.quantity));
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', inv.id);

    // 3. Coba hapus finance_expenses yang cocok (pembelian aset inventaris)
    const totalAmount = Number(tx.quantity) * Number(tx.unit_cost);
    if (totalAmount > 0) {
      await supabase
        .from('finance_expenses')
        .delete()
        .eq('category', 'Pembelian Pakan')
        .eq('date', tx.transaction_date)
        .eq('amount', totalAmount)
        .eq('user_id', user.id);
    }
  }

  // 4. Hapus transaksi
  const { error: delErr } = await supabase
    .from('inventory_transactions')
    .delete()
    .eq('id', transactionId);

  if (delErr) {
    return { success: false, error: `Gagal menghapus transaksi: ${delErr.message}`, code: 'DB_ERROR' };
  }

  revalidatePath('/inventory');
  revalidatePath('/keuangan');
  return { success: true };
}
