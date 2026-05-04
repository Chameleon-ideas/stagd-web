// ============================================================
// STAGD — Utilities
// ============================================================

import type { AvailabilityStatus, City, EventType } from './types';

// ── Currency ─────────────────────────────────────────────────

/**
 * Format a PKR amount for display.
 * e.g. 2000 → "PKR 2,000"
 */
export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

/**
 * Format a price for display on event cards.
 * Returns "Free" for 0, formatted PKR otherwise.
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free';
  return formatPKR(amount);
}

// ── Dates ─────────────────────────────────────────────────────

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', DATE_FORMAT);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', TIME_FORMAT);
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatScanTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Returns true if event starts within 7 days */
export function isHappeningSoon(iso: string): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

// ── Availability ─────────────────────────────────────────────

export function availabilityLabel(status: AvailabilityStatus): string {
  const map: Record<AvailabilityStatus, string> = {
    available: 'Available',
    busy: 'Busy',
    unavailable: 'Unavailable',
  };
  return map[status];
}

export function availabilityClass(status: AvailabilityStatus): string {
  const map: Record<AvailabilityStatus, string> = {
    available: 'badge-available',
    busy: 'badge-busy',
    unavailable: 'badge-unavailable',
  };
  return map[status];
}

// ── Event Type ───────────────────────────────────────────────

export function eventTypeLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    concert: 'Concert',
    workshop: 'Workshop',
    gallery: 'Gallery',
    spoken_word: 'Spoken Word',
    exhibition: 'Exhibition',
    talk: 'Talk',
    other: 'Event',
  };
  return map[type];
}

export function eventTypeBadgeClass(type: EventType): string {
  const map: Record<EventType, string> = {
    concert: 'badge-concert',
    workshop: 'badge-workshop',
    gallery: 'badge-gallery',
    spoken_word: 'badge-poetry',
    exhibition: 'badge-exhibition',
    talk: 'badge-talk',
    other: 'badge-event-other',
  };
  return map[type];
}

export function eventTypeAccentVar(type: EventType): string {
  const map: Record<EventType, string> = {
    concert: 'var(--color-concert)',
    workshop: 'var(--color-workshop)',
    gallery: 'var(--color-gallery)',
    spoken_word: 'var(--color-poetry)',
    exhibition: 'var(--color-gallery)', // Use gallery color for exhibition
    talk: 'var(--color-workshop)', // Use workshop color for talks
    other: 'var(--color-other)',
  };
  return map[type];
}

// ── City ─────────────────────────────────────────────────────

export const CITIES: City[] = ['Karachi', 'Lahore', 'Islamabad'];

// ── Deep links (web → app) ────────────────────────────────────

export function deepLink(path: string): string {
  return `stagd://${path}`;
}

export function hireDeepLink(username: string): string {
  return deepLink(`hire/${username}`);
}

export function profileDeepLink(username: string): string {
  return deepLink(`profile/${username}`);
}

export function ticketDeepLink(ticketId: string): string {
  return deepLink(`ticket/${ticketId}`);
}

// ── Truncate ─────────────────────────────────────────────────

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

// ── Class names ───────────────────────────────────────────────

/** Minimal className utility */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── App store links ───────────────────────────────────────────

export const APP_STORE_URL = 'https://apps.apple.com/app/stagd';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/stagd';
