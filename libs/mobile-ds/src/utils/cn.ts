import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Concatène des classes Tailwind de façon conditionnelle en résolvant les
 * conflits (la dernière classe d'un même groupe l'emporte).
 *
 * @example cn('px-2 py-1', isLarge && 'px-4') // -> 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
