'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SupplementPayload {
  flock_id: string;
  date: string;
  category: string;
  item_name: string;
  quantity: number;
  unit: string;
  notes?: string;
  inventory_id?: string | null;
}

export type SupplementActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitDailySupplement(
  payload: SupplementPayload
): Promise<SupplementActionResult> {
  // ── Validasi ──────────────────────────────────────────────────────────────
  if (!payload.flock_id) {
    return { success: false, error: 'Pilih batch kandang terlebih dahulu.' };
  }
  if (!payload.item_name?.trim()) {
    return { success: false, error: 'Nama item wajib diisi.' };
  }
  if (!payload.quantity || payload.quantity <= 0) {
    return { success: false, error: 'Kuantitas harus lebih dari 0.' };
  }
  if (!payload.date) {
    return { success: false, error: 'Tanggal wajib diisi.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Sesi tidak valid. Silakan login ulang.' };
  }

  // ── INSERT daily_supplements ──────────────────────────────────────────────
  const { error: insertError } = await supabase.from('daily_supplements').insert({
    user_id:      user.id,
    flock_id:     payload.flock_id,
    date:         payload.date,
    category:     payload.category,
    item_name:    payload.item_name.trim(),
    quantity:     payload.quantity,
    unit:         payload.unit,
    notes:        payload.notes?.trim() || null,
    inventory_id: payload.inventory_id || null,
  });

  if (insertError) {
    return { success: false, error: `Gagal menyimpan data: ${insertError.message}` };
  }

  // ── Jika terhubung ke inventaris: deduct stok ─────────────────────────────
  if (payload.inventory_id) {
    const { data: invItem } = await supabase
      .from('inventory')
      .select('id, quantity, unit_cost, item_name')
      .eq('id', payload.inventory_id)
      .single();

    if (invItem) {
      // Deduct quantity — inventory has CHECK (quantity >= 0), jadi akan error jika stok habis
      const newQty = Math.max(0, Number(invItem.quantity) - payload.quantity);
      const { error: stokError } = await supabase
        .from('inventory')
        .update({ quantity: newQty })
        .eq('id', invItem.id);

      if (stokError) {
        return {
          success: false,
          error: `Data suplemen tersimpan, tetapi stok inventaris gagal diperbarui: ${stokError.message}`,
        };
      }

      // Catat biaya variabel ke finance_expenses jika ada unit_cost
      const unitCost = Number(invItem.unit_cost ?? 0);
      const totalCost = unitCost * payload.quantity;
      if (totalCost > 0) {
        const { error: financeError } = await supabase.from('finance_expenses').insert({
          user_id:     user.id,
          date:        payload.date,
          category:    `Biaya ${payload.category}`,
          description: `${invItem.item_name} — ${payload.quantity.toLocaleString('id-ID')} ${payload.unit} (Batch: pemberian suplemen)`,
          amount:      totalCost,
          cost_type:   'Variable',
        });

        if (financeError) {
          return {
            success: false,
            error: `Data suplemen dan stok tersimpan, tetapi pencatatan biaya keuangan gagal: ${financeError.message}`,
          };
        }
      }
    }
  }

  revalidatePath('/daily-input');
  revalidatePath('/pusat-data');
  return { success: true };
}
