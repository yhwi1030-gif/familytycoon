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
    // 이전 사용자의 흔적이 남지 않도록 로컬 세션 키를 명확히 초기화 후 신규 식별자 바인딩
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ff_current_user_id');
      localStorage.setItem('ff_current_user_id', profile.id);
    }
    setCurrentUser(profile);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ff_current_user_id');
    }
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
