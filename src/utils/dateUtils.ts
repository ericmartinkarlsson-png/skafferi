import { ExpiryStatus } from '../types';

/**
 * Calculates days remaining until expiration date
 * @param dateString YYYY-MM-DD
 */
export function getDaysUntil(dateString?: string): number {
  if (!dateString) return 9999;
  const target = new Date(dateString);
  if (isNaN(target.getTime())) return 9999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns user-friendly Swedish expiration status and styling
 */
export function getExpiryStatus(dateString?: string): ExpiryStatus {
  if (!dateString) {
    return {
      status: 'none',
      daysLeft: 9999,
      label: 'Inget datum satt',
      colorClass: 'text-stone-500',
      badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
    };
  }

  const days = getDaysUntil(dateString);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      status: 'expired',
      daysLeft: days,
      label: absDays === 1 ? 'Gick ut igår!' : `Gick ut för ${absDays} dagar sedan`,
      colorClass: 'text-rose-600 font-semibold',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 border animate-pulse',
    };
  }

  if (days === 0) {
    return {
      status: 'urgent',
      daysLeft: 0,
      label: 'Går ut IDAG!',
      colorClass: 'text-rose-600 font-semibold',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 border font-bold',
    };
  }

  if (days <= 3) {
    return {
      status: 'urgent',
      daysLeft: days,
      label: days === 1 ? 'Går ut imorgon!' : `Går ut om ${days} dagar`,
      colorClass: 'text-amber-700 font-semibold',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 border font-medium',
    };
  }

  if (days <= 7) {
    return {
      status: 'warning',
      daysLeft: days,
      label: `Går ut om ${days} dagar`,
      colorClass: 'text-amber-600',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 border',
    };
  }

  return {
    status: 'good',
    daysLeft: days,
    label: `${days} dagar kvar (${dateString})`,
    colorClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 border',
  };
}

/**
 * Format date for Swedish display e.g. "18 sep 2026"
 */
export function formatSwedishDate(dateString?: string): string {
  if (!dateString) return 'Inget datum';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get date string offset by days (e.g. +7 days for easy expiration presets)
 */
export function getDateWithOffset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}
