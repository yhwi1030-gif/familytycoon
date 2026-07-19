'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Profile } from '@/types';
import { ProfileSelection } from '@/components/ProfileSelection';
import { ParentDashboard } from '@/components/ParentDashboard';
import { PlayerDashboard } from '@/components/PlayerDashboard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const loadUser = () => {
    const user = api.getCurrentUser();
    // 로컬 스토리지에 세션 유저가 등록되어 있으면 불러오고, 없으면 프로필 선택 페이지를 보게 함
    const sessionUserId = localStorage.getItem('ff_current_user_id');
    if (sessionUserId) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSelectProfile = (profile: Profile) => {
    setCurrentUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('ff_current_user_id');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <ProfileSelection onSelect={handleSelectProfile} />;
  }

  if (currentUser.role === 'parent') {
    return <ParentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <PlayerDashboard user={currentUser} onLogout={handleLogout} />;
}
