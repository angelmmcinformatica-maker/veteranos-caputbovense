import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TeamImages {
  shield?: string;
  players: Record<string, string>; // playerId -> photoUrl
}

interface UseTeamImagesResult {
  getTeamShield: (teamName: string) => string | undefined;
  getPlayerPhoto: (teamName: string, playerId: string | number) => string | undefined;
  setTeamShield: (teamName: string, url: string) => Promise<void>;
  setPlayerPhoto: (teamName: string, playerId: string | number, url: string) => Promise<void>;
  removePlayerPhoto: (teamName: string, playerId: string | number) => Promise<void>;
  loading: boolean;
}

// Global cache for images
const imagesCache = new Map<string, TeamImages>();

export function useTeamImages(): UseTeamImagesResult {
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Listen to team_images collection
    const unsubscribe = onSnapshot(
      collection(db, 'team_images'),
      (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as TeamImages;
          imagesCache.set(doc.id, {
            shield: data.shield,
            players: data.players || {},
          });
        });
        setLoading(false);
        forceUpdate((n) => n + 1);
      },
      (error) => {
        console.error('Error loading team images:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getTeamShield = useCallback((teamName: string): string | undefined => {
    return imagesCache.get(teamName)?.shield;
  }, []);

  const getPlayerPhoto = useCallback((teamName: string, playerId: string | number): string | undefined => {
    return imagesCache.get(teamName)?.players?.[String(playerId)];
  }, []);

  const setTeamShield = useCallback(async (teamName: string, url: string): Promise<void> => {
    const docRef = doc(db, 'team_images', teamName);
    const existing = imagesCache.get(teamName) || { players: {} };
    
    await setDoc(docRef, {
      ...existing,
      shield: url,
    }, { merge: true });
  }, []);

  const setPlayerPhoto = useCallback(async (teamName: string, playerId: string | number, url: string): Promise<void> => {
    const docRef = doc(db, 'team_images', teamName);
    const existing = imagesCache.get(teamName) || { players: {} };
    
    await setDoc(docRef, {
      ...existing,
      players: {
        ...existing.players,
        [String(playerId)]: url,
      },
    }, { merge: true });
  }, []);

  const removePlayerPhoto = useCallback(async (teamName: string, playerId: string | number): Promise<void> => {
    const docRef = doc(db, 'team_images', teamName);
    const existing = imagesCache.get(teamName);
    
    if (existing?.players?.[String(playerId)]) {
      const updatedPlayers = { ...existing.players };
      delete updatedPlayers[String(playerId)];
      
      await setDoc(docRef, {
        ...existing,
        players: updatedPlayers,
      }, { merge: true });
    }
  }, []);

  return {
    getTeamShield,
    getPlayerPhoto,
    setTeamShield,
    setPlayerPhoto,
    removePlayerPhoto,
    loading,
  };
}
