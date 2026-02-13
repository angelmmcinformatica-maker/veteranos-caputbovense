import { useEffect, useRef } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Matchday } from '@/types/league';

/**
 * Parses DD-MM-YYYY or DD/MM/YYYY + HH:MM into a Date
 */
function parseMatchDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const dateParts = dateStr.split(/[-\/]/);
  if (dateParts.length !== 3) return null;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);
  const timeParts = timeStr.split(':');
  if (timeParts.length < 2) return null;
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) return null;
  return new Date(year, month, day, hours, minutes);
}

/**
 * Automatically updates match status to LIVE in Firebase when
 * the current time falls within a match's scheduled window (0-105 min from start).
 * This is critical for Cloud Functions to trigger push notifications.
 */
export function useAutoLiveStatus(matchdays: Matchday[], refetch: () => void) {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!matchdays.length || hasChecked.current) return;
    hasChecked.current = true;

    const checkAndUpdate = async () => {
      const now = new Date();
      let updated = false;

      for (const matchday of matchdays) {
        if (!matchday.matches?.length) continue;

        let matchdayNeedsUpdate = false;
        const updatedMatches = matchday.matches.map((match) => {
          // Only process PENDING/SCHEDULED matches
          if (match.status !== 'PENDING' && match.status !== 'SCHEDULED') return match;

          const matchStart = parseMatchDateTime(match.date, match.time);
          if (!matchStart) return match;

          const diffMs = now.getTime() - matchStart.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));

          // Match is in progress (0-105 minutes)
          if (diffMinutes >= 0 && diffMinutes <= 105) {
            matchdayNeedsUpdate = true;
            return { ...match, status: 'LIVE' as const };
          }

          return match;
        });

        if (matchdayNeedsUpdate) {
          try {
            const docRef = doc(db, 'matchdays', matchday.id);
            await updateDoc(docRef, { matches: updatedMatches });
            updated = true;
            console.log(`[AutoLive] Updated matchday ${matchday.jornada} - set matches to LIVE`);
          } catch (err) {
            console.error(`[AutoLive] Failed to update matchday ${matchday.id}:`, err);
          }
        }
      }

      if (updated) {
        refetch();
      }
    };

    checkAndUpdate();
  }, [matchdays, refetch]);
}
