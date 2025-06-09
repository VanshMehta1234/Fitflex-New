import React from "react";
import { cn } from "../../lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div className={cn(
      "container px-4 py-6",
      fullWidth ? "max-w-full" : "max-w-6xl mx-auto",
      className
    )}>
      {children}
    </div>
  );
}; 