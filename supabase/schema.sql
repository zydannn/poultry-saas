-- ============================================================================
-- PoultryOS — Database Schema (PostgreSQL / Supabase)
-- Architect: AI Senior DB
-- Description: Core tables for HPP calculation, finance, daily recording,
--              and farm profile management.
--
-- HOW TO USE:
-- 1. Log in to your project at https://supabase.com
-- 2. Navigate to "SQL Editor" in the left sidebar
-- 3. Paste this entire file and click "Run"
-- ============================================================================


-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ----------------------------------------------------------------------------
-- ENUMS
-- Use ENUMs to enforce valid category values at the database level.
-- ----------------------------------------------------------------------------

-- Used by: production_cost table
CREATE TYPE cost_category_enum AS ENUM (
    'BIAYA_BAHAN_BAKU',
    'BIAYA_TENAGA_KERJA',
    'BIAYA_OVERHEAD'
);

-- Used by: finance_transaction table
CREATE TYPE transaction_type_enum AS ENUM (
    'PEMASUKAN',
    'PENGELUARAN'
);


-- ----------------------------------------------------------------------------
-- TABLE: daily_production
-- Records the raw daily farm activity (eggs, feed, mortality).
-- Each date must be unique — only one log entry per day.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_production (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    date            DATE            NOT NULL UNIQUE,
    good_eggs       INT             NOT NULL DEFAULT 0,
    broken_eggs     INT             NOT NULL DEFAULT 0,
    feed_consumed_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    mortality       INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE daily_production IS 'Daily raw operational data: egg count, feed, and mortality.';
COMMENT ON COLUMN daily_production.date IS 'The calendar date for this record. Must be unique (one entry per day).';
COMMENT ON COLUMN daily_production.good_eggs IS 'Count of sellable, undamaged eggs.';
COMMENT ON COLUMN daily_production.broken_eggs IS 'Count of broken or cracked eggs.';
COMMENT ON COLUMN daily_production.feed_consumed_kg IS 'Total feed consumed that day in kilograms.';
COMMENT ON COLUMN daily_production.mortality IS 'Number of chickens that died or were culled.';


-- ----------------------------------------------------------------------------
-- TABLE: production_cost
-- Strictly for HPP (Cost of Goods Sold) calculation.
-- Records all direct production costs: raw materials, labor, and overhead.
-- NOT for general business expenses (use finance_transaction for those).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_cost (
    id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    date        DATE                NOT NULL,
    category    cost_category_enum  NOT NULL,
    amount      DECIMAL(15, 2)      NOT NULL DEFAULT 0.00,
    notes       TEXT,
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE production_cost IS 'Direct production costs used exclusively for HPP/COGS calculation.';
COMMENT ON COLUMN production_cost.category IS 'Strict accounting category: raw materials, direct labor, or factory overhead.';
COMMENT ON COLUMN production_cost.amount IS 'Cost amount in IDR (Rupiah).';
COMMENT ON COLUMN production_cost.notes IS 'Optional free-text description (e.g., "Bulk feed purchase", "Monthly salary").';


-- ----------------------------------------------------------------------------
-- TABLE: finance_transaction
-- General cashflow ledger. Records business-level income and expenses
-- that are NOT directly part of production (e.g., egg sales, admin costs).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_transaction (
    id              UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    date            DATE                    NOT NULL,
    type            transaction_type_enum   NOT NULL,
    category_name   VARCHAR(100)            NOT NULL,
    amount          DECIMAL(15, 2)          NOT NULL DEFAULT 0.00,
    jumlah_butir    INT                     DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE finance_transaction IS 'General cashflow ledger for income (egg sales) and non-production expenses.';
COMMENT ON COLUMN finance_transaction.type IS 'PEMASUKAN = Income, PENGELUARAN = Expense.';
COMMENT ON COLUMN finance_transaction.category_name IS 'Free-text accounting category (e.g., "Penjualan Telur", "Beban Operasional").';


-- ----------------------------------------------------------------------------
-- TABLE: farm_profile
-- Single-row configuration table for farm master data and HPP targets.
-- The application should always upsert (not insert) to this table.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farm_profile (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_name               VARCHAR(255),
    owner_name              VARCHAR(255),
    location                TEXT,
    target_hpp_per_egg      DECIMAL(10, 4)  DEFAULT 0,
    current_market_price    DECIMAL(10, 4)  DEFAULT 0
);

COMMENT ON TABLE farm_profile IS 'Singleton config table for farm identity and HPP target parameters.';
COMMENT ON COLUMN farm_profile.target_hpp_per_egg IS 'Target HPP (cost per egg) in IDR to benchmark calculations against.';
COMMENT ON COLUMN farm_profile.current_market_price IS 'Current market selling price per egg in IDR. Used for BEP and profit calculations.';


-- ----------------------------------------------------------------------------
-- INDEXES
-- Optimize common queries that filter by date.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_production_date   ON daily_production   (date DESC);
CREATE INDEX IF NOT EXISTS idx_production_cost_date    ON production_cost    (date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transaction_date ON finance_transaction (date DESC);


-- ============================================================================
-- CLI TYPE GENERATION (Run this in your local terminal after applying schema)
-- Requires Supabase CLI: https://supabase.com/docs/guides/cli
--
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts
--
-- Replace YOUR_PROJECT_ID with your actual project ref from:
-- https://supabase.com/dashboard/project/_/settings/general
-- ============================================================================
