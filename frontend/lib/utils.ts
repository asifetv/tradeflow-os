/**
 * Utility functions
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge classnames safely (handles Tailwind CSS merging)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
