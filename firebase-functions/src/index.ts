/**
 * Firebase Cloud Function: Smart Match Notifications
 * 
 * Deploy instructions:
 * 1. cd firebase-functions
 * 2. npm install
 * 3. npx firebase deploy --only functions
 * 
 * This function listens to changes in the 'matchdays' collection
 * and sends push notifications for 3 specific events:
 * - Match goes LIVE
 * - Goal scored during LIVE match
 * - Match ends (PLAYED)
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
  date?: string;
  time?: string;
}

/**
 * Compares before/after state of each match in a matchday document
 * and sends targeted push notifications only for meaningful events.
 */
export const onMatchdayUpdate = onDocumentUpdated(
  "matchdays/{matchdayId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;

    const oldMatches: Match[] = before.matches || [];
    const newMatches: Match[] = after.matches || [];

    // Compare each match by index (matches array is positional)
    for (let i = 0; i < newMatches.length; i++) {
      const oldMatch = oldMatches[i];
      const newMatch = newMatches[i];

      if (!oldMatch || !newMatch) continue;

      // Identify home/away for message body
      const home = newMatch.home;
      const away = newMatch.away;
      const homeGoals = newMatch.homeGoals ?? 0;
      const awayGoals = newMatch.awayGoals ?? 0;

      let title: string | null = null;
      let body: string | null = null;

      // 1. Match goes LIVE (status changed TO 'LIVE')
      if (oldMatch.status !== "LIVE" && newMatch.status === "LIVE") {
        title = "🔴 ¡Arranca el partido!";
        body = `${home} vs ${away}`;
      }
      // 2. Goal scored while LIVE (goals increased, status remains LIVE)
      else if (
        newMatch.status === "LIVE" &&
        oldMatch.status === "LIVE" &&
        ((newMatch.homeGoals ?? 0) > (oldMatch.homeGoals ?? 0) ||
         (newMatch.awayGoals ?? 0) > (oldMatch.awayGoals ?? 0))
      ) {
        title = "⚽ ¡GOOOOL!";
        body = `${home} ${homeGoals} - ${awayGoals} ${away}`;
      }
      // 3. Match ends (status changed TO 'PLAYED')
      else if (oldMatch.status !== "PLAYED" && newMatch.status === "PLAYED") {
        title = "🏁 Resultado Final";
        body = `${home} ${homeGoals} - ${awayGoals} ${away}`;
      }

      // If no relevant event, skip this match
      if (!title || !body) continue;

      // Send notification to all subscribed tokens
      await sendToAllTokens(title, body, `match-${home}-${away}`);
    }
  }
);

/**
 * Sends a push notification to ALL registered device tokens.
 * Automatically cleans up invalid tokens.
 */
async function sendToAllTokens(title: string, body: string, tag: string) {
  const db = getFirestore();
  const tokensSnap = await db.collection("notification_tokens").get();

  if (tokensSnap.empty) return;

  const tokens: string[] = [];
  tokensSnap.forEach((doc) => {
    const data = doc.data();
    if (data.token) tokens.push(data.token);
  });

  if (tokens.length === 0) return;

  const messaging = getMessaging();

  // Use sendEachForMulticast for batch sending
  const message = {
    tokens,
    // 'data' payload ensures SW can always read title/body (critical for Android background)
    data: {
      title,
      body,
      icon: "/icons/icon-192.png",
      tag,
    },
    // 'notification' payload for platforms that use it natively
    notification: {
      title,
      body,
    },
    // Android-specific: high priority for instant delivery
    android: {
      priority: "high" as const,
    },
    // Web push: custom urgency
    webpush: {
      headers: {
        Urgency: "high",
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  // Clean up invalid tokens
  if (response.failureCount > 0) {
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code &&
        [
          "messaging/invalid-registration-token",
          "messaging/registration-token-not-registered",
        ].includes(resp.error.code)
      ) {
        invalidTokens.push(tokens[idx]);
      }
    });

    // Delete invalid tokens from Firestore
    const batch = db.batch();
    for (const token of invalidTokens) {
      const snap = await db
        .collection("notification_tokens")
        .where("token", "==", token)
        .get();
      snap.forEach((doc) => batch.delete(doc.ref));
    }
    await batch.commit();
  }
}
