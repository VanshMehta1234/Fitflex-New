import React from 'react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/profileService';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl'
  };
  
  const initials = getInitials(alt);
  
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 relative',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {initials}
        </span>
      )}
    </div>
  );
}

export function AvatarImage({
  className,
  src,
  alt = 'Avatar',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 