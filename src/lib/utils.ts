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

/**
 * Validates and logs information about a profile image
 * This helps debug issues with profile images not displaying
 */
export function validateProfileImage(src: string | undefined | null, userId: string = 'unknown'): string | undefined {
  if (!src) {
    console.log(`Profile image for ${userId} is empty`);
    return undefined;
  }
  
  // Check if it's a data URL
  if (src.startsWith('data:image/')) {
    // Data URLs are valid
    console.log(`Profile image for ${userId} is a data URL`);
    return src;
  }
  
  // Check if it's an http(s) URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    console.log(`Profile image for ${userId} is an HTTP URL: ${src.substring(0, 30)}...`);
    return src;
  }
  
  // If it's neither, it might be invalid
  console.warn(`Profile image for ${userId} has an invalid format: ${src.substring(0, 30)}...`);
  return src;
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