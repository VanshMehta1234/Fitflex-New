import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'md';
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = false
}) => {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  
  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />;
      case 'dark': return <Moon className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />;
      case 'system': return <Monitor className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />;
      default: return <Sun className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />;
    }
  };
  
  const getLabel = () => {
    if (!showLabel) return null;
    
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
      default: return 'Light';
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(className)}
      aria-label={`Current theme: ${theme}. Click to switch.`}
    >
      {getIcon()}
      {getLabel()}
    </Button>
  );
};

export default ThemeToggle; 