import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx and tailwind-merge
 * This is useful for combining Tailwind CSS classes with dynamic classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const measurePerformance = async (
  label: string,
  callback: () => Promise<any>
) => {
  console.time(label);
  try {
    return await callback();
  } finally {
    console.timeEnd(label);
  }
}; 