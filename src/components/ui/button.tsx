import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        
        // Variant styles
        variant === 'default' && "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700",
        variant === 'outline' && "border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
        variant === 'ghost' && "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
        variant === 'link' && "bg-transparent underline-offset-4 hover:underline text-primary-600 dark:text-primary-400",
        
        // Size styles
        size === 'sm' && "h-8 px-3 text-xs",
        size === 'md' && "h-10 px-4 py-2 text-sm",
        size === 'lg' && "h-12 px-6 text-base",
        
        className
      )}
      {...props}
    />
  );
} 