'use client';

import { useState, useEffect, useCallback } from 'react';
import { dbSave, dbLoad } from '@/lib/db';

const DB_KEY_PROFILE = 'afinapp_profile';

export interface UserProfile {
  displayName: string;
  avatarId: number;
  createdAt: number;
}

const AVATARS = ['🎤', '🎵', '🎶', '🎸', '🎹', '🥁', '🎷', '🎻', '🪕', '🎺', '🪗', '🎼'];

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dbLoad<UserProfile>(DB_KEY_PROFILE).then(saved => {
      if (saved) setProfile(saved);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const saveProfile = useCallback(async (name: string, avatarId: number) => {
    const newProfile: UserProfile = {
      displayName: name.trim() || 'Cantante',
      avatarId,
      createdAt: profile?.createdAt || Date.now(),
    };
    setProfile(newProfile);
    await dbSave(DB_KEY_PROFILE, newProfile);
  }, [profile]);

  const avatar = profile ? AVATARS[profile.avatarId] || AVATARS[0] : '🎤';
  const displayName = profile?.displayName || 'Cantante';

  return {
    profile,
    isProfileSet: !!profile,
    isLoaded,
    saveProfile,
    avatar,
    displayName,
    avatars: AVATARS,
  };
}
