export type Tenant = {
  id: string;
  business_name: string;
  owner_name: string | null;
  created_at: string;
};

export type Flock = {
  id: string;
  tenant_id: string;
  name: string;
  initial_population: number;
  current_population: number;
  acquisition_cost: number;
  estimated_productive_months: number;
  created_at: string;
};

export type DailyProduction = {
  id: string;
  flock_id: string;
  tenant_id: string;
  date: string;
  good_eggs: number;
  damaged_eggs: number;
  mortality: number;
  created_at: string;
};

export type ExpenseCategory = 'Feed' | 'Medicine' | 'Labor' | 'Utility' | 'Other';
export type ExpenseType = 'Fixed' | 'Variable';

export type Expense = {
  id: string;
  tenant_id: string;
  category: ExpenseCategory;
  type: ExpenseType;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
};

export type FeedInventory = {
  id: string;
  tenant_id: string;
  date: string;
  quantity: number;
  price_per_unit: number;
  brand: string | null;
  created_at: string;
};

export type FeedConsumption = {
  id: string;
  flock_id: string;
  tenant_id: string;
  date: string;
  quantity_consumed: number;
  created_at: string;
};

export type AssetDepreciation = {
  id: string;
  tenant_id: string;
  asset_name: string;
  acquisition_cost: number;
  monthly_depreciation: number;
  created_at: string;
};
