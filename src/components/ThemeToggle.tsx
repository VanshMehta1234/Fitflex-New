import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'md';
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false
}) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className={cn(
        "rounded-full p-2 transition-colors hover:bg-opacity-10 border-0", 
        theme === 'dark' 
          ? "text-primary hover:bg-primary/10" 
          : "text-primary hover:bg-primary/10",
        className
      )}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />
          {showLabel && 'Light Mode'}
        </>
      ) : (
        <>
          <Moon className={cn("h-[1.2rem] w-[1.2rem]", showLabel && "mr-2")} />
          {showLabel && 'Dark Mode'}
        </>
      )}
    </Button>
  );
};

export default ThemeToggle; 