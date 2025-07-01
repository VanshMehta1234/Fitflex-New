export interface StoreItem {
  id: string;
  name: string;
  description: string;
  xp_cost: number;
  category: StoreCategory;
  image_url?: string;
  icon?: string;
  is_active: boolean;
  stock_quantity?: number;
  is_unlimited_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorePurchase {
  id: string;
  user_id: string;
  item_id: string;
  xp_cost: number;
  quantity: number;
  created_at: string;
  // Relations
  item?: StoreItem;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface UserInventory {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  // Relations
  item?: StoreItem;
}

export type StoreCategory = 
  | 'fitness_gear'
  | 'supplements'
  | 'apparel'
  | 'accessories'
  | 'digital_content'
  | 'experiences'
  | 'special_items';

export interface StoreStats {
  total_items: number;
  total_purchases: number;
  total_xp_spent: number;
  popular_items: Array<{
    item_id: string;
    name: string;
    purchase_count: number;
  }>;
  recent_purchases: StorePurchase[];
} 