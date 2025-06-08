import React, { useEffect, useState } from 'react';
import { Card } from './card';
import { cn } from '../../lib/utils';

interface DailyQuoteCardProps extends React.HTMLAttributes<HTMLDivElement> {}

interface Quote {
  text: string;
  author: string;
}

// Fitness quotes
const fitnessQuotes: Quote[] = [
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  },
  {
    text: "Strength does not come from physical capacity. It comes from an indomitable will.",
    author: "Mahatma Gandhi"
  },
  {
    text: "The difference between the impossible and the possible lies in a person's determination.",
    author: "Tommy Lasorda"
  },
  {
    text: "It's not about perfect. It's about effort. And when you bring that effort every single day, that's where transformation happens.",
    author: "Jillian Michaels"
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn"
  },
  {
    text: "The body achieves what the mind believes.",
    author: "Unknown"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar"
  },
  {
    text: "Your health is an investment, not an expense.",
    author: "Unknown"
  }
];

export function DailyQuoteCard({ className, ...props }: DailyQuoteCardProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  
  useEffect(() => {
    // Get a quote based on the day of the year (so it changes daily but is consistent within a day)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % fitnessQuotes.length;
    setQuote(fitnessQuotes[quoteIndex]);
  }, []);
  
  if (!quote) {
    return null;
  }
  
  return (
    <Card className={cn("p-5 border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10", className)} {...props}>
      <div className="flex flex-col">
        <blockquote className="text-lg italic mb-2 text-gray-700 dark:text-gray-300">
          "{quote.text}"
        </blockquote>
        <cite className="text-right text-sm font-medium text-gray-600 dark:text-gray-400 not-italic">
          — {quote.author}
        </cite>
      </div>
    </Card>
  );
} 