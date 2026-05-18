'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateFlockPayload {
  name: string;
  breed: string;
  hatch_date: string;
  initial_population: number;
  acquisition_cost_total: number;
  estimated_productive_days: number;
  farm_asset_id?: string;
}

export type FlockActionResult =
  | { success: true }
  | { success: false; error: string; code: 'INVALID_INPUT' | 'DB_ERROR' };

export async function createFlock(payload: CreateFlockPayload): Promise<FlockActionResult> {
  if (!payload.name || !payload.hatch_date || payload.initial_population < 1) {
    return { success: false, error: 'Mohon lengkapi semua kolom wajib.', code: 'INVALID_INPUT' };
  }

  const supabase = await createClient();

  const { error: flockError } = await supabase.from('flocks').insert({
    name:                      payload.name,
    breed:                     payload.breed,
    hatch_date:                payload.hatch_date,
    initial_population:        payload.initial_population,
    current_population:        payload.initial_population,
    status:                    'Aktif',
    acquisition_cost_total:    payload.acquisition_cost_total > 0 ? payload.acquisition_cost_total : null,
    estimated_productive_days: payload.estimated_productive_days || 600,
    farm_asset_id:             payload.farm_asset_id ?? null,
  });

  if (flockError) {
    return { success: false, error: `Gagal menyimpan batch: ${flockError.message}`, code: 'DB_ERROR' };
  }

  revalidatePath('/flocks');
  return { success: true };
}

// ─── DAILY RECORD SUBMISSION ────────────────────────────────────────────────
export interface DailyRecordPayload {
  flock_id: string;
  date: string;
  shift: 'Pagi' | 'Sore';
  good_eggs: number;
  broken_eggs: number;
  mortality: number;
  feed_consumed_kg: number;
}

export async function submitDailyRecord(payload: DailyRecordPayload): Promise<FlockActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized', code: 'INVALID_INPUT' };
  }

  // ── Validasi stok pakan sebelum insert ────────────────────────────────────
  if (payload.feed_consumed_kg > 0) {
    const { data: stockData, error: stockError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('category', 'Pakan');

    if (stockError) {
      return { success: false, error: `Gagal membaca stok pakan: ${stockError.message}`, code: 'DB_ERROR' };
    }

    const totalStock = (stockData ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);

    if (payload.feed_consumed_kg > totalStock) {
      return {
        success: false,
        error: `Stok pakan tidak mencukupi. Tersedia: ${totalStock.toLocaleString('id-ID')} Kg, dibutuhkan: ${payload.feed_consumed_kg.toLocaleString('id-ID')} Kg. Tambah stok di menu Inventaris terlebih dahulu.`,
        code: 'INVALID_INPUT',
      };
    }
  }

  const { error } = await supabase.from('daily_records').insert({
    flock_id:         payload.flock_id,
    date:             payload.date,
    good_eggs:        payload.good_eggs,
    broken_eggs:      payload.broken_eggs,
    mortality:        payload.mortality,
    feed_consumed_kg: payload.feed_consumed_kg,
    shift:            payload.shift,
    user_id:          user.id,
  });

  if (error) {
    // Unique constraint: data for this flock + date + shift already exists
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Data untuk tanggal dan shift ini sudah tercatat. Gunakan shift yang berbeda atau ubah tanggalnya.',
        code: 'DB_ERROR',
      };
    }
    return { success: false, error: `Gagal menyimpan data harian: ${error.message}`, code: 'DB_ERROR' };
  }

  // ── Deduct mortality from flock population (server-side, atomic with this action) ──
  if (payload.mortality > 0) {
    const { data: flock } = await supabase
      .from('flocks')
      .select('current_population')
      .eq('id', payload.flock_id)
      .single();

    if (flock) {
      const newPop = Math.max(0, Number(flock.current_population) - payload.mortality);
      await supabase
        .from('flocks')
        .update({ current_population: newPop })
        .eq('id', payload.flock_id);
    }
  }

  revalidatePath('/daily-records');
  revalidatePath('/inventory');
  revalidatePath('/pusat-data');
  revalidatePath('/flocks');

  return { success: true };
}
