import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StandardPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function StandardPage({
  title,
  description,
  icon: Icon,
  children,
  className,
}: StandardPageProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6 max-w-7xl", className)}>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
} 