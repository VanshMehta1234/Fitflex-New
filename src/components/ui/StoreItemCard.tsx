import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { StoreItem } from '../../types/store';
import { Star, Package } from 'lucide-react';

interface StoreItemCardProps {
  item: StoreItem;
  canAfford: boolean;
  onPurchase: (itemId: string) => void;
  isLoading?: boolean;
}

export const StoreItemCard = memo<StoreItemCardProps>(({ 
  item, 
  canAfford, 
  onPurchase, 
  isLoading = false 
}) => {
  const isOutOfStock = !item.is_unlimited_stock && 
    item.stock_quantity !== null && 
    item.stock_quantity !== undefined && 
    item.stock_quantity <= 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {item.description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {item.category.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* XP Cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{item.xp_cost.toLocaleString()} XP</span>
            </div>
            {!item.is_unlimited_stock && item.stock_quantity !== null && (
              <div className="text-sm text-muted-foreground">
                Stock: {item.stock_quantity}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={() => onPurchase(item.id)}
          disabled={!canAfford || isOutOfStock || isLoading}
          className="w-full"
          variant={canAfford && !isOutOfStock ? "default" : "secondary"}
        >
          {isLoading ? (
            <Package className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Star className="h-4 w-4 mr-2" />
          )}
          {isOutOfStock ? 'Out of Stock' : 
           !canAfford ? 'Insufficient XP' : 
           'Purchase'}
        </Button>
      </CardFooter>
    </Card>
  );
});

StoreItemCard.displayName = 'StoreItemCard'; 