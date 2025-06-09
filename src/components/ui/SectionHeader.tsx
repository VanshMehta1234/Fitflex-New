import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2", className)}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 mt-2 sm:mt-0">{action}</div>}
    </div>
  );
} 