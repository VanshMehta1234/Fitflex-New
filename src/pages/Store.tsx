import React, { useMemo, useState } from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { PageHeader, PageContainer } from '../components/Layout';
import { useStore } from '../context/StoreContext';
import { useXp } from '../context/XpContext';
import { StoreItemCard } from '../components/ui/StoreItemCard';
import { StoreCategoryFilter } from '../components/ui/StoreCategoryFilter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { 
  ShoppingBag, 
  Star, 
  Search, 
  Package, 
  RefreshCw, 
  History,
  Trophy
} from 'lucide-react';

export default function Store() {
  const { userXp, userLevel } = useXp();
  const {
    storeItems,
    filteredItems,
    isLoadingItems,
    userPurchases,
    userInventory,
    isLoadingUserData,
    categories,
    selectedCategory,
    setSelectedCategory,
    refreshStoreItems,
    purchaseItem,
    canAfford
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  // Filter items by search query
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredItems;
    
    const query = searchQuery.toLowerCase();
    return filteredItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [filteredItems, searchQuery]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: storeItems.length };
    
    categories.forEach(category => {
      counts[category] = storeItems.filter(item => item.category === category).length;
    });
    
    return counts;
  }, [storeItems, categories]);

  // Handle purchase
  const handlePurchase = async (itemId: string) => {
    setPurchasingItemId(itemId);
    try {
      await purchaseItem(itemId);
    } finally {
      setPurchasingItemId(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshStoreItems(true);
  };

  // Loading skeleton
  const ItemsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="h-72">
          <CardContent className="p-4">
            <Skeleton className="w-full h-32 mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="XP Store"
          description="Use your XP to purchase exclusive items and rewards"
          icon={ShoppingBag}
          actions={
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingItems}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingItems ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />

        {/* User XP Status */}
        <Card className="mb-6 overflow-hidden border-2 border-primary-100 dark:border-primary-900/20">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 p-4 md:px-6 md:py-5">
            <div className="flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 md:mr-4 shadow-sm">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Your XP Balance</h2>
                <div className="flex items-center mt-1">
                  <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-sm font-medium">Level {userLevel}</span>
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-xl md:text-2xl font-bold">{userXp.toLocaleString()} XP</p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Purchases
            </TabsTrigger>
          </TabsList>

          {/* Store Tab */}
          <TabsContent value="store" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Sidebar */}
              <div className="lg:w-64 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <StoreCategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      itemCounts={categoryCounts}
                    />
                  </CardContent>
                </Card>

                {/* Search */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm text-muted-foreground">Search</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Store Items */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedCategory === 'all' ? 'All Items' : 
                       selectedCategory.split('_').map(word => 
                         word.charAt(0).toUpperCase() + word.slice(1)
                       ).join(' ')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {searchFilteredItems.length} item{searchFilteredItems.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>

                {isLoadingItems ? (
                  <ItemsSkeleton />
                ) : searchFilteredItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No items found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Try adjusting your search query.' : 'No items available in this category.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchFilteredItems.map((item) => (
                      <StoreItemCard
                        key={item.id}
                        item={item}
                        canAfford={canAfford(item)}
                        onPurchase={handlePurchase}
                        isLoading={purchasingItemId === item.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUserData ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : userPurchases.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground">Start shopping to see your purchase history here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{purchase.item?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(purchase.created_at).toLocaleDateString()} • Qty: {purchase.quantity}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {purchase.xp_cost * purchase.quantity} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </MainLayout>
  );
} 