import { doc, setDoc, getDoc, deleteDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db, initMessaging, getToken } from '@/lib/firebase';

// Public VAPID key (Web Push). Private key lives only in Firebase.
const VAPID_KEY = 'BMJk3r633eqaJdbWXgIBKKd1PaUQK0IyFKVwrdfUTQ2Rf0EKzDUYIKdD2IUR5EJ8MKeOhE78hDfES-nDq8HUX6c';
const LS_KEY = 'caputbovense.followedTeams';
const COLLECTION = 'push_subscriptions';

export type FollowResult = 'ok' | 'unsupported' | 'denied' | 'iframe' | 'error';

const norm = (t: string) => (t || '').trim().toUpperCase();

export function getFollowedTeams(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') || []; } catch { return []; }
}
function saveFollowed(list: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new Event('followed-teams-changed')); } catch {}
}
export function isFollowing(team: string) {
  return getFollowedTeams().includes(norm(team));
}

async function getPushToken(): Promise<string | null> {
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  const messaging = await initMessaging();
  if (!messaging) return null;
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token || null;
}

export async function followTeam(team: string): Promise<FollowResult> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return 'unsupported';
    }
    if (window.top !== window.self) return 'iframe';
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const token = await getPushToken();
    if (!token) return 'error';
    const t = norm(team);
    await setDoc(doc(db, COLLECTION, token), {
      token,
      teams: arrayUnion(t),
      userAgent: navigator.userAgent?.slice(0, 200) || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    const list = getFollowedTeams();
    if (!list.includes(t)) saveFollowed([...list, t]);
    return 'ok';
  } catch (e) {
    console.error('followTeam failed', e);
    return 'error';
  }
}

export async function unfollowTeam(team: string): Promise<void> {
  const t = norm(team);
  saveFollowed(getFollowedTeams().filter(x => x !== t));
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const token = await getPushToken();
    if (!token) return;
    const ref = doc(db, COLLECTION, token);
    await updateDoc(ref, { teams: arrayRemove(t), updatedAt: new Date().toISOString() });
    const snap = await getDoc(ref);
    const teams = (snap.data()?.teams as string[] | undefined) || [];
    if (teams.length === 0) await deleteDoc(ref);
  } catch (e) {
    console.error('unfollowTeam failed', e);
  }
}
