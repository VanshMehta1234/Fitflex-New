import React from 'react';
import { cn } from '../../lib/utils';

// Create context for tabs state
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

export function Tabs({ className, value, onValueChange, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const parentTabs = React.useContext(TabsContext);
  if (!parentTabs) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }
  
  const isSelected = parentTabs.value === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-900",
        isSelected 
          ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" 
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        className
      )}
      onClick={() => parentTabs.onValueChange(value)}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const parentTabs = React.useContext(TabsContext);
  if (!parentTabs) {
    throw new Error('TabsContent must be used within a Tabs component');
  }
  
  const isSelected = parentTabs.value === value;
  
  if (!isSelected) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      className={cn(
        "animate-fade-in mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:ring-offset-gray-900",
        className
      )}
      {...props}
    />
  );
} 