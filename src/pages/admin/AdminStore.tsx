import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { PageHeader, PageContainer } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  getAllStoreItemsAdmin, 
  createStoreItem, 
  updateStoreItem, 
  deleteStoreItem,
  getStoreStats,
  getAllPurchasesAdmin
} from '../../lib/storeService';
import { StoreItem, StoreCategory, StoreStats, StorePurchase } from '../../types/store';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw,
  ShoppingBag,
  BarChart3,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ItemFormData {
  name: string;
  description: string;
  xp_cost: number;
  category: StoreCategory;
  image_url: string;
  icon: string;
  is_active: boolean;
  stock_quantity: number | null;
  is_unlimited_stock: boolean;
}

const defaultFormData: ItemFormData = {
  name: '',
  description: '',
  xp_cost: 0,
  category: 'fitness_gear',
  image_url: '',
  icon: '',
  is_active: true,
  stock_quantity: null,
  is_unlimited_stock: true
};

export default function AdminStore() {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<StorePurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: StoreCategory[] = [
    'fitness_gear',
    'supplements',
    'apparel',
    'accessories',
    'digital_content',
    'experiences',
    'special_items'
  ];

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [items, stats, purchases] = await Promise.all([
        getAllStoreItemsAdmin(),
        getStoreStats(),
        getAllPurchasesAdmin()
      ]);
      
      setStoreItems(items);
      setStoreStats(stats);
      setRecentPurchases(purchases);
    } catch (error) {
      console.error('Error loading admin store data:', error);
      toast.error('Failed to load store data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form handlers
  const handleOpenForm = useCallback((item?: StoreItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        xp_cost: item.xp_cost,
        category: item.category,
        image_url: item.image_url || '',
        icon: item.icon || '',
        is_active: item.is_active,
        stock_quantity: item.stock_quantity || null,
        is_unlimited_stock: item.is_unlimited_stock
      });
    } else {
      setEditingItem(null);
      setFormData(defaultFormData);
    }
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData(defaultFormData);
  }, []);

  const handleSubmitForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Update existing item
        const result = await updateStoreItem(editingItem.id, formData as Partial<StoreItem>);
        if (result.success) {
          toast.success('Item updated successfully');
          handleCloseForm();
          loadData();
        } else {
          toast.error(result.error || 'Failed to update item');
        }
      } else {
        // Create new item
        const result = await createStoreItem(formData as Partial<StoreItem>);
        if (result.success) {
          toast.success('Item created successfully');
          handleCloseForm();
          loadData();
        } else {
          toast.error(result.error || 'Failed to create item');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingItem, formData, handleCloseForm, loadData]);

  const handleDeleteItem = useCallback(async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const result = await deleteStoreItem(itemId);
      if (result.success) {
        toast.success('Item deleted successfully');
        loadData();
      } else {
        toast.error(result.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  }, [loadData]);

  // Stats calculations
  const statsCards = useMemo(() => {
    if (!storeStats) return [];
    
    return [
      {
        title: 'Total Items',
        value: storeStats.total_items,
        icon: Package,
        color: 'text-blue-600'
      },
      {
        title: 'Total Purchases',
        value: storeStats.total_purchases,
        icon: ShoppingBag,
        color: 'text-green-600'
      },
      {
        title: 'XP Spent',
        value: storeStats.total_xp_spent.toLocaleString(),
        icon: Star,
        color: 'text-amber-600'
      },
      {
        title: 'Active Items',
        value: storeItems.filter(item => item.is_active).length,
        icon: TrendingUp,
        color: 'text-purple-600'
      }
    ];
  }, [storeStats, storeItems]);

  const getCategoryLabel = (category: StoreCategory): string => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageContainer>
          <PageHeader
            title="Store Management"
            description="Manage XP store items and view analytics"
            icon={Package}
          />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Store Management"
          description="Manage XP store items and view analytics"
          icon={Package}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Store Items
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Purchases
            </TabsTrigger>
          </TabsList>

          {/* Store Items Tab */}
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Store Items</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => loadData()} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm()}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingItem ? 'Edit Store Item' : 'Create New Store Item'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitForm} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Name *</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category *</Label>
                              <Select
                                value={formData.category}
                                onValueChange={(value: StoreCategory) => 
                                  setFormData(prev => ({ ...prev, category: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {getCategoryLabel(category)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              required
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="xp_cost">XP Cost *</Label>
                              <Input
                                id="xp_cost"
                                type="number"
                                min="1"
                                value={formData.xp_cost}
                                onChange={(e) => setFormData(prev => ({ ...prev, xp_cost: parseInt(e.target.value) || 0 }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="image_url">Image URL</Label>
                              <Input
                                id="image_url"
                                type="url"
                                value={formData.image_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                              />
                              <Label htmlFor="is_active">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="is_unlimited_stock"
                                checked={formData.is_unlimited_stock}
                                onCheckedChange={(checked) => setFormData(prev => ({ 
                                  ...prev, 
                                  is_unlimited_stock: checked,
                                  stock_quantity: checked ? null : (prev.stock_quantity || 0)
                                }))}
                              />
                              <Label htmlFor="is_unlimited_stock">Unlimited Stock</Label>
                            </div>
                          </div>

                          {!formData.is_unlimited_stock && (
                            <div>
                              <Label htmlFor="stock_quantity">Stock Quantity</Label>
                              <Input
                                id="stock_quantity"
                                type="number"
                                min="0"
                                value={formData.stock_quantity || 0}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  stock_quantity: parseInt(e.target.value) || 0 
                                }))}
                              />
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={handleCloseForm}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              <Save className="h-4 w-4 mr-1" />
                              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storeItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {getCategoryLabel(item.category)}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {item.xp_cost} XP
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {storeStats?.popular_items && storeStats.popular_items.length > 0 ? (
                    <div className="space-y-3">
                      {storeStats.popular_items.map((item, index) => (
                        <div key={item.item_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span>{item.name}</span>
                          </div>
                          <Badge variant="outline">{item.purchase_count} purchases</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No purchase data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const count = storeItems.filter(item => item.category === category).length;
                      const percentage = storeItems.length > 0 ? (count / storeItems.length * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span>{getCategoryLabel(category)}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count} items</Badge>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPurchases.length === 0 ? (
                  <p className="text-muted-foreground">No purchases yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{purchase.item?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {purchase.user?.name || purchase.user?.email} • 
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {purchase.xp_cost * purchase.quantity} XP
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Qty: {purchase.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AdminLayout>
  );
} 