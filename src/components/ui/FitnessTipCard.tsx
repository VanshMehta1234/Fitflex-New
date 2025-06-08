import React, { useEffect, useState } from 'react';
import { Card } from './card';
import { cn } from '../../lib/utils';

interface FitnessTipCardProps extends React.HTMLAttributes<HTMLDivElement> {}

interface Tip {
  title: string;
  content: string;
  category: 'nutrition' | 'workout' | 'recovery' | 'motivation';
}

// Fitness tips collection
const fitnessTips: Tip[] = [
  {
    title: "Hydration Matters",
    content: "Drink at least 8 glasses of water daily. Proper hydration improves performance and helps with recovery.",
    category: "nutrition"
  },
  {
    title: "Protein Timing",
    content: "Consume protein within 30 minutes after your workout to maximize muscle recovery and growth.",
    category: "nutrition"
  },
  {
    title: "Sleep Quality",
    content: "Aim for 7-8 hours of quality sleep. Your muscles grow and recover during deep sleep phases.",
    category: "recovery"
  },
  {
    title: "Compound Exercises",
    content: "Focus on compound movements like squats, deadlifts, and pull-ups for maximum muscle activation and hormonal response.",
    category: "workout"
  },
  {
    title: "Active Recovery",
    content: "Light activities like walking or yoga on rest days can improve circulation and speed up recovery.",
    category: "recovery"
  },
  {
    title: "Progress Tracking",
    content: "Keep a workout journal to track your progress. What gets measured gets improved.",
    category: "motivation"
  },
  {
    title: "Pre-Workout Nutrition",
    content: "Eat a balanced meal with carbs and protein 1-2 hours before training for optimal energy.",
    category: "nutrition"
  },
  {
    title: "Stretching Routine",
    content: "Incorporate dynamic stretches before and static stretches after your workout for flexibility and injury prevention.",
    category: "workout"
  }
];

// Category colors for visual cues
const categoryColors: Record<Tip['category'], {bg: string, text: string, darkBg: string, darkText: string}> = {
  nutrition: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/20",
    darkText: "dark:text-green-400"
  },
  workout: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900/20",
    darkText: "dark:text-blue-400"
  },
  recovery: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    darkBg: "dark:bg-purple-900/20",
    darkText: "dark:text-purple-400"
  },
  motivation: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/20",
    darkText: "dark:text-amber-400"
  }
};

export function FitnessTipCard({ className, ...props }: FitnessTipCardProps) {
  const [tip, setTip] = useState<Tip | null>(null);
  
  useEffect(() => {
    // Change tip every day for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const tipIndex = dayOfYear % fitnessTips.length;
    setTip(fitnessTips[tipIndex]);
  }, []);
  
  if (!tip) {
    return null;
  }
  
  const categoryColor = categoryColors[tip.category];
  
  return (
    <Card className={cn("p-5", className)} {...props}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-lg">Daily Fitness Tip</h3>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            categoryColor.bg,
            categoryColor.text,
            categoryColor.darkBg,
            categoryColor.darkText
          )}>
            {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
          </span>
        </div>
        
        <h4 className="font-semibold mb-2">{tip.title}</h4>
        <p className="text-gray-700 dark:text-gray-300">{tip.content}</p>
      </div>
    </Card>
  );
} 