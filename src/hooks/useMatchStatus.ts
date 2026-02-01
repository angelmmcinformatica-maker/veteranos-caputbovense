import { useState, useEffect } from 'react';
import type { Match } from '@/types/league';

interface MatchLiveStatus {
  displayStatus: 'PLAYED' | 'PENDING' | 'LIVE' | 'PENDING_RESULT';
  elapsedMinutes: number | null;
}

/**
 * Calculates real-time match status based on current time vs scheduled time
 * - LIVE: Match is in progress (0-105 minutes from start)
 * - PENDING_RESULT: Match should be over but no result entered (>105 minutes)
 * - PLAYED: Match has a result
 * - PENDING: Match hasn't started yet
 */
export function useMatchStatus(match: Match): MatchLiveStatus {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update every 30 seconds for real-time status
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // If already played, return immediately
  if (match.status === 'PLAYED') {
    return { displayStatus: 'PLAYED', elapsedMinutes: null };
  }

  // If already marked as LIVE by the database
  if (match.status === 'LIVE') {
    const elapsed = calculateElapsedMinutes(match, now);
    if (elapsed !== null && elapsed > 105) {
      return { displayStatus: 'PENDING_RESULT', elapsedMinutes: null };
    }
    return { displayStatus: 'LIVE', elapsedMinutes: elapsed };
  }

  // For PENDING/SCHEDULED matches, check if they should be live
  const matchStart = parseMatchDateTime(match.date, match.time);
  
  if (!matchStart) {
    return { displayStatus: 'PENDING', elapsedMinutes: null };
  }

  const diffMs = now.getTime() - matchStart.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Match hasn't started yet
  if (diffMinutes < 0) {
    return { displayStatus: 'PENDING', elapsedMinutes: null };
  }

  // Match is in progress (0-105 minutes including halftime)
  if (diffMinutes <= 105) {
    return { displayStatus: 'LIVE', elapsedMinutes: diffMinutes };
  }

  // Match should be over but no result entered
  return { displayStatus: 'PENDING_RESULT', elapsedMinutes: null };
}

/**
 * Parse match date and time into a Date object
 * Supports formats: "DD-MM-YYYY" or "DD/MM/YYYY" for date, "HH:MM" for time
 */
function parseMatchDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  // Parse date (DD-MM-YYYY or DD/MM/YYYY)
  const dateParts = dateStr.split(/[-\/]/);
  if (dateParts.length !== 3) return null;

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(dateParts[2], 10);

  // Parse time (HH:MM)
  const timeParts = timeStr.split(':');
  if (timeParts.length < 2) return null;

  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
    return null;
  }

  return new Date(year, month, day, hours, minutes);
}

/**
 * Calculate elapsed minutes from match start
 */
function calculateElapsedMinutes(match: Match, now: Date): number | null {
  const matchStart = parseMatchDateTime(match.date, match.time);
  if (!matchStart) return null;

  const diffMs = now.getTime() - matchStart.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

/**
 * Get display text for elapsed minutes (accounting for halftime)
 */
export function formatElapsedMinutes(minutes: number): string {
  if (minutes <= 45) {
    return `${minutes}'`;
  } else if (minutes <= 60) {
    // Halftime (15 min break assumed around minute 45-60)
    return 'Descanso';
  } else {
    // Second half: subtract 15 min halftime
    const gameMinutes = minutes - 15;
    if (gameMinutes > 90) {
      return `90+${gameMinutes - 90}'`;
    }
    return `${gameMinutes}'`;
  }
}
