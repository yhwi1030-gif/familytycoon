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
    // 자동 진입 대신 사용자가 명시적으로 프로필을 탭하여 로그인 상태를 바꿀 때만 동작하도록 세션 자동 로드 로직 제거
    setCurrentUser(null);
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
