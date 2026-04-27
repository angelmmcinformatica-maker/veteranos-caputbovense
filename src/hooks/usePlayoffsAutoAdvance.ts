import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PLAYOFF_BRACKET_EDGES,
  resolveTargetSlot,
  computePatch,
} from '@/lib/playoffsAdvance';
import type { Matchday } from '@/types/league';

/**
 * Watches the live `playoffMatchdays` and, whenever a source match becomes
 * FINAL, patches the corresponding next-round match in Firestore so that the
 * winner advances automatically. Applies the fair-play rule to decide which
 * team plays as LOCAL.
 *
 * MUST only be mounted inside an admin-only context (e.g. AdminPlayoffsView)
 * because it performs Firestore writes.
 */
export function usePlayoffsAutoAdvance(playoffMatchdays: Matchday[] | undefined) {
  // Avoid re-writing the same patch in a tight loop
  const lastWriteRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!playoffMatchdays?.length) return;

    (async () => {
      try {
        for (const edge of PLAYOFF_BRACKET_EDGES) {
          try {
            const targetMd = playoffMatchdays.find((m) => m?.id === edge?.target?.matchdayId);
            const targetMatch = targetMd?.matches?.[edge?.target?.matchIndex];
            if (!targetMd || !targetMatch) continue;

            const resolved = resolveTargetSlot(playoffMatchdays, edge);
            const patch = computePatch(targetMatch, resolved);
            if (!patch) continue;

            const writeKey = `${edge.target.matchdayId}#${edge.target.matchIndex}`;
            const writeSig = `${patch.home}|${patch.away}`;
            if (lastWriteRef.current?.[writeKey] === writeSig) continue;
            lastWriteRef.current[writeKey] = writeSig;

            const updatedMatches = (targetMd.matches || []).map((m, idx) =>
              idx === edge.target.matchIndex
                ? { ...m, home: patch.home, away: patch.away }
                : m
            );

            try {
              await setDoc(
                doc(db, 'matchdays', targetMd.id),
                {
                  jornada: targetMd?.jornada ?? 0,
                  date: targetMd?.date ?? '',
                  rest: targetMd?.rest ?? null,
                  matches: updatedMatches,
                  isPlayoff: true,
                },
                { merge: true }
              );
              console.log(
                `[Playoffs auto-advance] ${edge.target.matchdayId}[${edge.target.matchIndex}] -> ${patch.home} vs ${patch.away}`
              );
            } catch (writeErr) {
              console.error('[Playoffs auto-advance] Write failed:', writeErr);
              delete lastWriteRef.current[writeKey];
            }
          } catch (edgeErr) {
            console.error('[Playoffs auto-advance] Edge processing failed:', edgeErr);
          }
        }
      } catch (outerErr) {
        console.error('[Playoffs auto-advance] Loop crashed:', outerErr);
      }
    })();
  }, [playoffMatchdays]);
}
