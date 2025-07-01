import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { PageHeader, PageContainer } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { 
  getAllStoreItemsAdmin, 
  createStoreItem, 
  updateStoreItem, 
  deleteStoreItem,
  getStoreStats,
  getAllPurchasesAdmin
} from '../lib/storeService';
import { StoreItem, StoreCategory, StoreStats, StorePurchase } from '../types/store';
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
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle
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
        const result = await updateStoreItem(editingItem.id, formData as Partial<StoreItem>);
        if (result.success) {
          toast.success('Item updated successfully');
          handleCloseForm();
          loadData();
        } else {
          toast.error(result.error || 'Failed to update item');
        }
      } else {
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
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

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
        title: 'Active Items',
        value: storeItems.filter(item => item.is_active).length,
        icon: Eye,
        color: 'text-green-600'
      },
      {
        title: 'Total Purchases',
        value: storeStats.total_purchases,
        icon: ShoppingBag,
        color: 'text-purple-600'
      },
      {
        title: 'XP Spent',
        value: `${storeStats.total_xp_spent?.toLocaleString() || 0} XP`,
        icon: Star,
        color: 'text-amber-600'
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
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Store Management"
          description="Manage XP store items and view analytics"
          icon={Package}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => handleOpenForm()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      {editingItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      {editingItem ? 'Edit Store Item' : 'Add New Store Item'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitForm} className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium">Item Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter item name"
                            required
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value: StoreCategory) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger className="mt-1">
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
                        
                        <div>
                          <Label htmlFor="xp_cost" className="text-sm font-medium">XP Cost *</Label>
                          <Input
                            id="xp_cost"
                            type="number"
                            min="0"
                            value={formData.xp_cost}
                            onChange={(e) => setFormData({ ...formData, xp_cost: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="image_url" className="text-sm font-medium">Image URL</Label>
                          <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="icon" className="text-sm font-medium">Icon</Label>
                          <Input
                            id="icon"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="Icon name or emoji"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="is_unlimited_stock" className="text-sm font-medium">Unlimited Stock</Label>
                          <Switch
                            id="is_unlimited_stock"
                            checked={formData.is_unlimited_stock}
                            onCheckedChange={(checked) => setFormData({ 
                              ...formData, 
                              is_unlimited_stock: checked,
                              stock_quantity: checked ? null : formData.stock_quantity
                            })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the item..."
                        rows={3}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    {!formData.is_unlimited_stock && (
                      <div>
                        <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min="0"
                          value={formData.stock_quantity || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            stock_quantity: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {editingItem ? 'Update Item' : 'Create Item'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseForm}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          }
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Store Items
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Recent Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Store Items ({storeItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storeItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No items yet</h3>
                    <p className="text-muted-foreground mb-6">Start by adding your first store item.</p>
                    <Button onClick={() => handleOpenForm()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {storeItems.map((item) => (
                      <Card key={item.id} className="h-full">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {item.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-2">
                                {item.is_active ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                
                                {!item.is_unlimited_stock && (item.stock_quantity || 0) <= 5 && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {getCategoryLabel(item.category)}
                              </Badge>
                              <Badge variant={item.is_active ? "default" : "outline"}>
                                {item.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span className="font-semibold">
                                  {item.xp_cost.toLocaleString()} XP
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                {item.is_unlimited_stock ? (
                                  <span className="text-emerald-600">∞ Stock</span>
                                ) : (
                                  <span className={
                                    (item.stock_quantity || 0) <= 5 
                                      ? 'text-orange-600' 
                                      : 'text-blue-600'
                                  }>
                                    {item.stock_quantity || 0} left
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenForm(item)}
                                className="flex-1 gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Purchases ({recentPurchases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPurchases.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground">Purchases will appear here when users start buying items.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 rounded-lg border">
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
    </MainLayout>
  );
} 