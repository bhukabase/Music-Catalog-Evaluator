/**
 * Utility Functions
 * Common utility functions used across components
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind classes
 * @param inputs - Class names to merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 