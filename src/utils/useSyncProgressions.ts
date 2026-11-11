import { useEffect, useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SavedProgression, ChordDefinition } from '../types';
import { GENRE_PRESETS, CHORD_DATABASE } from '../data/musicTheory';

const LOCAL_STORAGE_KEY = 'harmoniq_saved_progressions';

export function sanitizeProgressionChords(chords: any[]): ChordDefinition[] {
  if (!Array.isArray(chords)) return [];
  return chords
    .map((c) => {
      if (!c) return null;
      if (typeof c === 'string') return CHORD_DATABASE[c] || null;
      if (c.symbol && c.notes) return c as ChordDefinition;
      if (c.name && CHORD_DATABASE[c.name]) return CHORD_DATABASE[c.name];
      if (c.symbol && CHORD_DATABASE[c.symbol]) return CHORD_DATABASE[c.symbol];
      return null;
    })
    .filter((c): c is ChordDefinition => c !== null);
}

// Combine default presets
export const ALL_PRESETS: SavedProgression[] = [
  ...GENRE_PRESETS.pop,
  ...GENRE_PRESETS.rock,
  ...GENRE_PRESETS.ballad,
  ...GENRE_PRESETS.blues,
  ...GENRE_PRESETS.acoustic,
  ...GENRE_PRESETS.jazz,
  ...GENRE_PRESETS.electronic,
  ...GENRE_PRESETS.techno,
  ...GENRE_PRESETS.punk,
];

export function useSyncProgressions(user: User | null) {
  const [progressions, setProgressions] = useState<SavedProgression[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const userSaved: SavedProgression[] = JSON.parse(stored);
        const cleanSaved = userSaved.map((p) => ({
          ...p,
          chords: sanitizeProgressionChords(p.chords),
        }));
        return [...cleanSaved, ...ALL_PRESETS];
      }
      return ALL_PRESETS;
    } catch {
      return ALL_PRESETS;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'syncing' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Firestore real-time listener when user is authenticated
  useEffect(() => {
    if (!user) {
      setSyncStatus('local');
      // Load local data
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const userSaved: SavedProgression[] = JSON.parse(stored);
          const cleanSaved = userSaved.map((p) => ({
            ...p,
            chords: sanitizeProgressionChords(p.chords),
          }));
          setProgressions([...cleanSaved, ...ALL_PRESETS]);
        } else {
          setProgressions(ALL_PRESETS);
        }
      } catch {
        setProgressions(ALL_PRESETS);
      }
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    const path = `users/${user.uid}/progressions`;
    const colRef = collection(db, 'users', user.uid, 'progressions');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const remoteList: SavedProgression[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Convert Firestore timestamp to millis if needed
          let createdAt = Date.now();
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toMillis();
          } else if (typeof data.createdAt === 'number') {
            createdAt = data.createdAt;
          }

          remoteList.push({
            id: data.id || docSnap.id,
            name: data.name,
            description: data.description,
            genre: data.genre,
            chords: sanitizeProgressionChords(data.chords),
            tempoBpm: data.tempoBpm || 110,
            instrument: data.instrument || 'piano',
            createdAt,
            isPreset: false,
            melody: data.melody || undefined,
          });
        });

        // Sort descending by date
        remoteList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Save backup in local storage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteList));
        } catch {
          // ignore
        }

        setProgressions([...remoteList, ...ALL_PRESETS]);
        setIsSyncing(false);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      },
      (error) => {
        console.error('Firestore sync error:', error);
        setIsSyncing(false);
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Save or Update progression (Cloud if logged in, local storage as fallback/cache)
  const saveProgression = useCallback(
    async (newProg: SavedProgression) => {
      // 1. Update state immediately (optimistic UI)
      setProgressions((prev) => {
        const withoutOld = prev.filter((p) => p.id !== newProg.id);
        return [newProg, ...withoutOld];
      });

      // 2. Cache in localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const currentLocal: SavedProgression[] = stored ? JSON.parse(stored) : [];
        const updatedLocal = [newProg, ...currentLocal.filter((p) => p.id !== newProg.id)];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocal));
      } catch {
        // ignore
      }

      // 3. Sync with Firestore if user is authenticated
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/progressions/${newProg.id}`;
        try {
          const docRef = doc(db, 'users', user.uid, 'progressions', newProg.id);
          await setDoc(docRef, {
            id: newProg.id,
            userId: user.uid,
            name: newProg.name,
            description: newProg.description || '',
            genre: newProg.genre,
            chords: newProg.chords,
            tempoBpm: newProg.tempoBpm,
            instrument: newProg.instrument,
            melody: newProg.melody || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setIsSyncing(false);
          setSyncStatus('synced');
          setLastSyncTime(new Date());
        } catch (error) {
          setIsSyncing(false);
          setSyncStatus('error');
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    },
    [user]
  );

  // Delete progression
  const deleteProgression = useCallback(
    async (id: string) => {
      // 1. Update state immediately
      setProgressions((prev) => prev.filter((p) => p.id !== id));

      // 2. Update localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const currentLocal: SavedProgression[] = JSON.parse(stored);
          const filtered = currentLocal.filter((p) => p.id !== id);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }

      // 3. Delete in Firestore if authenticated
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/progressions/${id}`;
        try {
          const docRef = doc(db, 'users', user.uid, 'progressions', id);
          await deleteDoc(docRef);
          setIsSyncing(false);
          setSyncStatus('synced');
        } catch (error) {
          setIsSyncing(false);
          setSyncStatus('error');
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    },
    [user]
  );

  // Migration: If user just logged in and has offline local progressions, upload them
  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const localSaved: SavedProgression[] = JSON.parse(stored);
        if (localSaved.length > 0) {
          // Sync any local un-synced items
          Promise.all(
            localSaved.map(async (item) => {
              const path = `users/${user.uid}/progressions/${item.id}`;
              try {
                const docRef = doc(db, 'users', user.uid, 'progressions', item.id);
                await setDoc(
                  docRef,
                  {
                    id: item.id,
                    userId: user.uid,
                    name: item.name,
                    description: item.description || '',
                    genre: item.genre,
                    chords: item.chords,
                    tempoBpm: item.tempoBpm,
                    instrument: item.instrument,
                    melody: item.melody || null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                );
              } catch (err) {
                console.warn('Could not auto-migrate item:', item.id, err);
              }
            })
          ).catch((e) => console.warn('Migration batch error:', e));
        }
      }
    } catch {
      // ignore
    }
  }, [user]);

  return {
    progressions,
    saveProgression,
    deleteProgression,
    isSyncing,
    syncStatus,
    lastSyncTime,
  };
}
