/**
 * Firebase Cloud Functions: Team-targeted match push notifications (Web Push via FCM)
 *
 * Deploy:
 *   cd firebase-functions && npm install && npm run deploy
 *
 * Listens to every matchdays collection (matchdays, matchdays_2026_2027, ...)
 * and notifies ONLY devices following either team for:
 *   - Match start (-> LIVE)
 *   - Goal during LIVE match (includes scorer from the digital report)
 *   - Final result (-> PLAYED)
 * Subscriptions live in `push_subscriptions/{token}` = { token, teams: string[] }.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

interface Match {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  status: string;
}

const norm = (s: string) => (s || "").trim().toUpperCase();

export const onMatchdayUpdate = onDocumentUpdated(
  "{collectionId}/{matchdayId}",
  async (event) => {
    const collectionId = event.params.collectionId as string;
    if (!collectionId.startsWith("matchdays")) return;

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const suffix = collectionId.replace(/^matchdays/, ""); // "" or "_2026_2027"
    const reportsCollection = `match_reports${suffix}`;

    const oldMatches: Match[] = before.matches || [];
    const newMatches: Match[] = after.matches || [];

    for (let i = 0; i < newMatches.length; i++) {
      const o = oldMatches[i];
      const n = newMatches[i];
      if (!o || !n || norm(o.home) !== norm(n.home) || norm(o.away) !== norm(n.away)) continue;

      const hg = n.homeGoals ?? 0;
      const ag = n.awayGoals ?? 0;
      let title: string | null = null;
      let body: string | null = null;
      let iconTeam = n.home;

      if (o.status !== "LIVE" && n.status === "LIVE") {
        title = "⏱️ ¡Comienza el partido!";
        body = `${n.home} vs ${n.away}`;
      } else if (
        n.status === "LIVE" && o.status === "LIVE" &&
        (hg > (o.homeGoals ?? 0) || ag > (o.awayGoals ?? 0))
      ) {
        const scoringTeam = hg > (o.homeGoals ?? 0) ? n.home : n.away;
        iconTeam = scoringTeam;
        const scorer = await findLastScorer(reportsCollection, n.home, n.away, scoringTeam);
        title = "⚽ ¡GOL!";
        body = `${scorer ? `Anota ${scorer}. ` : ""}${n.home} ${hg} - ${ag} ${n.away}`;
      } else if (o.status !== "PLAYED" && n.status === "PLAYED") {
        title = "🏁 ¡Final del partido!";
        body = `${n.home} ${hg} - ${ag} ${n.away}`;
      }

      if (!title || !body) continue;

      try {
        const icon = await getShield(iconTeam);
        const url = `/?tab=matches&match=${encodeURIComponent(`${n.home}-${n.away}`)}`;
        await sendToFollowers([norm(n.home), norm(n.away)], {
          title, body, icon, url, tag: `match-${n.home}-${n.away}`,
        });
      } catch (e) {
        console.error("Push send failed", e);
      }
    }
  }
);

async function getShield(team: string): Promise<string> {
  try {
    const db = getFirestore();
    for (const id of [team, norm(team)]) {
      const snap = await db.collection("team_images").doc(id).get();
      const shield = snap.data()?.shield;
      if (shield) return shield;
    }
  } catch { /* ignore */ }
  return "/icons/icon-192.png";
}

function maxMinute(s?: string): number {
  if (!s) return -1;
  const nums = String(s).match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 0;
}

async function findLastScorer(col: string, home: string, away: string, team: string): Promise<string | null> {
  try {
    const snap = await getFirestore().collection(col).doc(`${home}-${away}`).get();
    const players: any[] = snap.data()?.[team]?.players || [];
    const scorers = players.filter((p) => (p?.goals ?? 0) > 0);
    if (!scorers.length) return null;
    scorers.sort((a, b) => maxMinute(b.goalMin) - maxMinute(a.goalMin));
    return scorers[0].alias || scorers[0].name || null;
  } catch {
    return null;
  }
}

async function sendToFollowers(
  teams: string[],
  data: { title: string; body: string; icon: string; url: string; tag: string }
) {
  const db = getFirestore();
  const snap = await db.collection("push_subscriptions")
    .where("teams", "array-contains-any", teams).get();
  if (snap.empty) return;

  const tokens = Array.from(new Set(snap.docs.map((d) => d.data().token as string).filter(Boolean)));
  if (!tokens.length) return;

  const messaging = getMessaging();
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    // Data-only so the service worker controls icon (team shield) and click URL
    const res = await messaging.sendEachForMulticast({
      tokens: chunk,
      data,
      android: { priority: "high" },
      webpush: { headers: { Urgency: "high" }, fcmOptions: { link: data.url } },
    });

    if (res.failureCount > 0) {
      const batch = db.batch();
      res.responses.forEach((r, idx) => {
        const code = r.error?.code;
        if (!r.success && code && [
          "messaging/invalid-registration-token",
          "messaging/registration-token-not-registered",
        ].includes(code)) {
          batch.delete(db.collection("push_subscriptions").doc(chunk[idx]));
        }
      });
      await batch.commit();
    }
  }
}
