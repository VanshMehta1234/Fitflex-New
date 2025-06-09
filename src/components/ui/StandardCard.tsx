import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";
import { cn } from "../../lib/utils";

interface StandardCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "highlight" | "secondary";
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  description,
  icon: Icon,
  footer,
  children,
  className,
  contentClassName,
  variant = "default",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "highlight":
        return "border-2 border-primary/20";
      case "secondary":
        return "border border-muted bg-muted/50";
      default:
        return "border border-border";
    }
  };

  // If no title or description, return a simpler card
  if (!title && !description && !Icon && !footer) {
    return (
      <div
        className={cn(
          "bg-card text-card-foreground rounded-lg shadow-sm p-6",
          getVariantStyles(),
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <Card className={cn(getVariantStyles(), className)}>
      {(title || description || Icon) && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className={cn("pt-4", contentClassName)}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="border-t border-border px-6 py-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}; 