import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useXp } from './XpContext';
import { StoreItem, StorePurchase, UserInventory, StoreCategory } from '../types/store';
import { 
  getStoreItems, 
  getStoreItemsByCategory, 
  purchaseStoreItem, 
  getUserPurchases, 
  getUserInventory,
  clearStoreCache
} from '../lib/storeService';
import toast from 'react-hot-toast';

interface StoreContextType {
  // Store items
  storeItems: StoreItem[];
  isLoadingItems: boolean;
  
  // User data
  userPurchases: StorePurchase[];
  userInventory: UserInventory[];
  isLoadingUserData: boolean;
  
  // Categories
  categories: StoreCategory[];
  selectedCategory: StoreCategory | 'all';
  
  // Actions
  setSelectedCategory: (category: StoreCategory | 'all') => void;
  refreshStoreItems: (forceRefresh?: boolean) => Promise<void>;
  refreshUserData: () => Promise<void>;
  purchaseItem: (itemId: string, quantity?: number) => Promise<boolean>;
  
  // Computed values
  filteredItems: StoreItem[];
  canAfford: (item: StoreItem, quantity?: number) => boolean;
}

interface StoreProviderProps {
  children: React.ReactNode;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: StoreProviderProps) {
  const { user } = useAuth();
  const { userXp, refreshXpData } = useXp();
  
  // State
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [userPurchases, setUserPurchases] = useState<StorePurchase[]>([]);
  const [userInventory, setUserInventory] = useState<UserInventory[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | 'all'>('all');
  
  // Categories - static list to prevent re-renders
  const categories: StoreCategory[] = useMemo(() => [
    'fitness_gear',
    'supplements', 
    'apparel',
    'accessories',
    'digital_content',
    'experiences',
    'special_items'
  ], []);
  
  // Fetch store items
  const refreshStoreItems = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoadingItems(true);
    try {
      const items = await getStoreItems(forceRefresh);
      setStoreItems(items);
    } catch (error) {
      console.error('Error refreshing store items:', error);
      toast.error('Failed to load store items');
    } finally {
      setIsLoadingItems(false);
    }
  }, []);
  
  // Fetch user data
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingUserData(true);
    try {
      const [purchases, inventory] = await Promise.all([
        getUserPurchases(user.id),
        getUserInventory(user.id)
      ]);
      
      setUserPurchases(purchases);
      setUserInventory(inventory);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoadingUserData(false);
    }
  }, [user?.id]);
  
  // Purchase item
  const purchaseItem = useCallback(async (itemId: string, quantity: number = 1): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Please login to make purchases');
      return false;
    }
    
    const item = storeItems.find(item => item.id === itemId);
    if (!item) {
      toast.error('Item not found');
      return false;
    }
    
    const totalCost = item.xp_cost * quantity;
    if (userXp < totalCost) {
      toast.error(`Insufficient XP. You need ${totalCost - userXp} more XP.`);
      return false;
    }
    
    try {
      const result = await purchaseStoreItem(user.id, itemId, quantity);
      
      if (result.success) {
        toast.success(`Successfully purchased ${item.name}!`);
        
        // Refresh data
        await Promise.all([
          refreshStoreItems(true), // Force refresh to update stock
          refreshUserData(),
          refreshXpData() // Update user's XP
        ]);
        
        return true;
      } else {
        toast.error(result.error || 'Purchase failed');
        return false;
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('Purchase failed');
      return false;
    }
  }, [user?.id, storeItems, userXp, refreshStoreItems, refreshUserData, refreshXpData]);
  
  // Computed values
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return storeItems;
    }
    return storeItems.filter(item => item.category === selectedCategory);
  }, [storeItems, selectedCategory]);
  
  const canAfford = useCallback((item: StoreItem, quantity: number = 1): boolean => {
    return userXp >= (item.xp_cost * quantity);
  }, [userXp]);
  
  // Load initial data
  useEffect(() => {
    refreshStoreItems();
  }, [refreshStoreItems]);
  
  useEffect(() => {
    if (user?.id) {
      refreshUserData();
    }
  }, [user?.id, refreshUserData]);
  
  const value = useMemo(() => ({
    // Store items
    storeItems,
    isLoadingItems,
    
    // User data
    userPurchases,
    userInventory,
    isLoadingUserData,
    
    // Categories
    categories,
    selectedCategory,
    
    // Actions
    setSelectedCategory,
    refreshStoreItems,
    refreshUserData,
    purchaseItem,
    
    // Computed values
    filteredItems,
    canAfford
  }), [
    storeItems,
    isLoadingItems,
    userPurchases,
    userInventory,
    isLoadingUserData,
    categories,
    selectedCategory,
    refreshStoreItems,
    refreshUserData,
    purchaseItem,
    filteredItems,
    canAfford
  ]);
  
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 