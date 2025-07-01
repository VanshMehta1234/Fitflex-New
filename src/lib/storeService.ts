import { supabase } from '../supabase';
import { StoreItem, StorePurchase, UserInventory, StoreCategory, StoreStats } from '../types/store';
import { getUserTotalXp } from './xpService';

// Cache for store items to prevent unnecessary API calls
let storeItemsCache: StoreItem[] | null = null;
// let cacheTimestamp: number = 0;
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all active store items with caching
 */
export const getStoreItems = async (forceRefresh: boolean = false): Promise<StoreItem[]> => {
  const now = Date.now();
  
//   // Return cached data if it's still valid and we're not forcing refresh
//   if (!forceRefresh && storeItemsCache && (now - cacheTimestamp) < CACHE_DURATION) {
//     return storeItemsCache;
//   }
  
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching store items:', error);
      return storeItemsCache || [];
    }
    
    // Update cache
    storeItemsCache = data || [];
    
    return storeItemsCache;
  } catch (error) {
    console.error('Error in getStoreItems:', error);
    return storeItemsCache || [];
  }
};

/**
 * Get store items by category
 */
export const getStoreItemsByCategory = async (category: StoreCategory): Promise<StoreItem[]> => {
  try {
    const allItems = await getStoreItems();
    return allItems.filter(item => item.category === category);
  } catch (error) {
    console.error('Error in getStoreItemsByCategory:', error);
    return [];
  }
};

/**
 * Get a single store item by ID
 */
export const getStoreItem = async (itemId: string): Promise<StoreItem | null> => {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', itemId)
      .single();
    
    if (error) {
      console.error('Error fetching store item:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getStoreItem:', error);
    return null;
  }
};

/**
 * Purchase an item from the store
 */
export const purchaseStoreItem = async (
  userId: string, 
  itemId: string, 
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get item details
    const item = await getStoreItem(itemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    if (!item.is_active) {
      return { success: false, error: 'Item is not available' };
    }
    
    // Check stock
    if (!item.is_unlimited_stock && item.stock_quantity !== null && item.stock_quantity !== undefined) {
      if (item.stock_quantity < quantity) {
        return { success: false, error: 'Insufficient stock' };
      }
    }
    
    // Check user's XP
    const userXp = await getUserTotalXp(userId);
    const totalCost = item.xp_cost * quantity;
    
    if (userXp < totalCost) {
      return { success: false, error: 'Insufficient XP' };
    }
    
    // Start transaction
    const { data: purchaseData, error: purchaseError } = await supabase.rpc('purchase_store_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_quantity: quantity,
      p_xp_cost: item.xp_cost
    });
    
    if (purchaseError) {
      console.error('Error purchasing item:', purchaseError);
      return { success: false, error: 'Purchase failed' };
    }
    
    // Invalidate store cache since stock might have changed
    storeItemsCache = null;
    
    return { success: true };
  } catch (error) {
    console.error('Error in purchaseStoreItem:', error);
    return { success: false, error: 'Purchase failed' };
  }
};

/**
 * Get user's purchase history
 */
export const getUserPurchases = async (userId: string): Promise<StorePurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('store_purchases')
      .select(`
        *,
        item:store_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserPurchases:', error);
    return [];
  }
};

/**
 * Get user's inventory
 */
export const getUserInventory = async (userId: string): Promise<UserInventory[]> => {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select(`
        *,
        item:store_items(*)
      `)
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user inventory:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserInventory:', error);
    return [];
  }
};

// Admin functions

/**
 * Get all store items (including inactive ones) for admin
 */
export const getAllStoreItemsAdmin = async (): Promise<StoreItem[]> => {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all store items:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllStoreItemsAdmin:', error);
    return [];
  }
};

/**
 * Create a new store item (admin only)
 */
export const createStoreItem = async (itemData: Partial<StoreItem>): Promise<{ success: boolean; error?: string; item?: StoreItem }> => {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .insert([{
        name: itemData.name,
        description: itemData.description,
        xp_cost: itemData.xp_cost,
        category: itemData.category,
        image_url: itemData.image_url,
        icon: itemData.icon,
        is_active: itemData.is_active ?? true,
        stock_quantity: itemData.stock_quantity,
        is_unlimited_stock: itemData.is_unlimited_stock ?? true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating store item:', error);
      return { success: false, error: 'Failed to create item' };
    }
    
    // Invalidate cache
    storeItemsCache = null;
    
    return { success: true, item: data };
  } catch (error) {
    console.error('Error in createStoreItem:', error);
    return { success: false, error: 'Failed to create item' };
  }
};

/**
 * Update a store item (admin only)
 */
export const updateStoreItem = async (itemId: string, updates: Partial<StoreItem>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('store_items')
      .update(updates)
      .eq('id', itemId);
    
    if (error) {
      console.error('Error updating store item:', error);
      return { success: false, error: 'Failed to update item' };
    }
    
    // Invalidate cache
    storeItemsCache = null;
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateStoreItem:', error);
    return { success: false, error: 'Failed to update item' };
  }
};

/**
 * Delete a store item (admin only)
 */
export const deleteStoreItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('store_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('Error deleting store item:', error);
      return { success: false, error: 'Failed to delete item' };
    }
    
    // Invalidate cache
    storeItemsCache = null;
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteStoreItem:', error);
    return { success: false, error: 'Failed to delete item' };
  }
};

/**
 * Get store statistics for admin dashboard
 */
export const getStoreStats = async (): Promise<StoreStats> => {
  try {
    const { data: statsData, error } = await supabase.rpc('get_store_stats');
    
    if (error) {
      console.error('Error fetching store stats:', error);
      return {
        total_items: 0,
        total_purchases: 0,
        total_xp_spent: 0,
        popular_items: [],
        recent_purchases: []
      };
    }
    
    return statsData || {
      total_items: 0,
      total_purchases: 0,
      total_xp_spent: 0,
      popular_items: [],
      recent_purchases: []
    };
  } catch (error) {
    console.error('Error in getStoreStats:', error);
    return {
      total_items: 0,
      total_purchases: 0,
      total_xp_spent: 0,
      popular_items: [],
      recent_purchases: []
    };
  }
};

/**
 * Get all purchases for admin view
 */
export const getAllPurchasesAdmin = async (): Promise<StorePurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('store_purchases')
      .select(`
        *,
        item:store_items(*),
        user:profiles(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 purchases
    
    if (error) {
      console.error('Error fetching all purchases:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllPurchasesAdmin:', error);
    return [];
  }
};

/**
 * Clear store cache (useful for forced refresh)
 */
export const clearStoreCache = (): void => {
  storeItemsCache = null;
  // cacheTimestamp = 0;
}; 