-- =======================================================
-- POULTRYOS ALGORITHMIC SCHEMA REFACTOR 
-- Single-Tenant MVC Architecture
-- =======================================================

-- 1. CLEAN UP EXISTING CONFLICTING TABLES
DROP TABLE IF EXISTS daily_productions CASCADE;
DROP TABLE IF EXISTS daily_records CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS feed_inventory CASCADE;
DROP TABLE IF EXISTS feed_consumptions CASCADE;
DROP TABLE IF EXISTS asset_depreciation CASCADE;
DROP TABLE IF EXISTS hpp_reports CASCADE;
DROP TABLE IF EXISTS farm_investments CASCADE;
DROP TABLE IF EXISTS overhead_costs CASCADE;
DROP TABLE IF EXISTS flocks CASCADE;
DROP TABLE IF EXISTS farm_profile CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- 2. FARM PROFILE & PARAMETERS
-- Stores default configuration and master data.
CREATE TABLE farm_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_name TEXT NOT NULL DEFAULT 'My Poultry Farm',
    owner_name TEXT NOT NULL DEFAULT 'Owner',
    target_hpp_per_egg NUMERIC DEFAULT 1500,
    margin_percent NUMERIC DEFAULT 20.0,
    default_egg_weight_grams NUMERIC DEFAULT 60.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize default profile
INSERT INTO farm_profile (farm_name) VALUES ('Alpha Poultry');

-- 3. FLOCKS
-- Manages distinct batches of chickens living on the farm.
CREATE TABLE flocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    hatch_date DATE NOT NULL,
    initial_population INTEGER NOT NULL,
    current_population INTEGER NOT NULL,
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Afkir', 'Selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY
-- Unified tracking for feed, medicine, and vitamins.
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Pakan', 'Obat/Vaksin', 'Lainnya')),
    quantity_kg NUMERIC NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0, -- Rata-rata harga per unit (Kg)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DAILY RECORDS 
-- Core operation table recording 1 entry per day per flock.
CREATE TABLE daily_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE RESTRICT,
    record_date DATE NOT NULL,
    eggs_good INTEGER NOT NULL DEFAULT 0,
    eggs_broken INTEGER NOT NULL DEFAULT 0,
    mortality INTEGER NOT NULL DEFAULT 0,
    feed_consumed_kg NUMERIC NOT NULL DEFAULT 0,
    additional_costs NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flock_id, record_date) -- Prevent multi-records in a single day for same flock
);

-- 6. SALES
-- Revenue table for egg distribution.
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity_eggs INTEGER NOT NULL,
    total_price NUMERIC NOT NULL,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OVERHEAD & FIXED COSTS
-- Direct monthly or one-off administrative costs.
CREATE TABLE overhead_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Biaya Tenaga Kerja Langsung', 'Biaya Overhead Pabrik', 'Biaya Bahan Baku')),
    expense_name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- ATOMICITY ENGINE: SUPABASE RPC FUNCTION
-- =======================================================
-- This function processes a daily record and deducts inventory & flock mortality
-- atomically to prevent DB desyncing from race conditions or client crashes.

CREATE OR REPLACE FUNCTION record_daily_input(
    p_flock_id UUID,
    p_date DATE,
    p_eggs_good INTEGER,
    p_eggs_broken INTEGER,
    p_mortality INTEGER,
    p_feed_consumed_kg NUMERIC,
    p_feed_inventory_id UUID,
    p_additional_costs NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record_id UUID;
    v_current_pop INTEGER;
    v_current_feed NUMERIC;
BEGIN
    -- 1. Check Flock Population Integrity
    SELECT current_population INTO v_current_pop FROM flocks WHERE id = p_flock_id FOR UPDATE;
    IF v_current_pop IS NULL THEN
        RAISE EXCEPTION 'Flock ID tidak ditemukan.';
    END IF;
    IF v_current_pop < p_mortality THEN
        RAISE EXCEPTION 'Mortalitas (%) melebihi total populasi hidup saat ini (% ekor).', p_mortality, v_current_pop;
    END IF;

    -- 2. Check Feed Inventory Integrity 
    IF p_feed_consumed_kg > 0 AND p_feed_inventory_id IS NOT NULL THEN
        SELECT quantity_kg INTO v_current_feed FROM inventory WHERE id = p_feed_inventory_id FOR UPDATE;
        IF v_current_feed IS NULL THEN
            RAISE EXCEPTION 'Inventory Pakan tidak ditemukan.';
        END IF;
        IF v_current_feed < p_feed_consumed_kg THEN
             RAISE EXCEPTION 'Stok pakan tidak mencukupi. Sisa % Kg, dipakai % Kg.', v_current_feed, p_feed_consumed_kg;
        END IF;
        
        -- Deduct Feed
        UPDATE inventory 
        SET quantity_kg = quantity_kg - p_feed_consumed_kg, updated_at = NOW()
        WHERE id = p_feed_inventory_id;
    END IF;

    -- 3. Update Flock Mortality
    IF p_mortality > 0 THEN
        UPDATE flocks 
        SET current_population = current_population - p_mortality, updated_at = NOW()
        WHERE id = p_flock_id;
    END IF;

    -- 4. Create Daily Record
    INSERT INTO daily_records (flock_id, record_date, eggs_good, eggs_broken, mortality, feed_consumed_kg, additional_costs)
    VALUES (p_flock_id, p_date, p_eggs_good, p_eggs_broken, p_mortality, p_feed_consumed_kg, p_additional_costs)
    RETURNING id INTO v_record_id;

    -- Return success payload
    RETURN jsonb_build_object(
        'success', true, 
        'record_id', v_record_id,
        'remaining_population', v_current_pop - p_mortality,
        'remaining_feed', v_current_feed - p_feed_consumed_kg
    );
END;
$$;
