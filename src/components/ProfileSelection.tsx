'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Profile } from '@/types';
import { Shield, User, Key, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { ChatbotOnboarding } from '@/components/ChatbotOnboarding';

interface ProfileSelectionProps {
  onSelect: (profile: Profile) => void;
}

export const ProfileSelection: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [onboardingRole, setOnboardingRole] = useState<'parent' | 'child' | null>(null);

  // 인트로 시작 페이지 대기 유무
  const [showIntro, setShowIntro] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setProfiles(api.getProfiles());
  }, []);

  const handleStartAdventure = () => {
    setShowLoading(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setLoadingPercent(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowIntro(false);
          setShowLoading(false);
        }, 300);
      }
    }, 150);
  };

  const handleProfileClick = (p: Profile) => {
    setSelectedProfile(p);
    setPinInput('');
    setPinError(false);
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (pinInput === selectedProfile.pin) {
      setIsPinModalOpen(false);
      api.setCurrentUserId(selectedProfile.id);
      onSelect(selectedProfile);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleEditClick = (p: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProfile(p);
    setEditName(p.name);
    setEditPin(p.pin);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    const updated = {
      ...selectedProfile,
      name: editName,
      pin: editPin
    };
    const list = api.updateProfile(updated);
    setProfiles(list);
    setIsEditing(false);
    setSelectedProfile(null);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm("정말로 이 프로필을 길드에서 영구 삭제하시겠습니까?")) {
      const list = api.deleteProfile(id);
      setProfiles(list);
      setIsEditing(false);
      setSelectedProfile(null);
    }
  };

  const handleAddProfile = (role: 'parent' | 'child') => {
    setOnboardingRole(role);
  };

  const handleOnboardingComplete = (data: any) => {
    const list = api.getProfiles();
    const newId = roleCount(onboardingRole!) > 0 ? `${onboardingRole!}${roleCount(onboardingRole!) + 1}` : `${onboardingRole!}2`;
    
    const newProfile: Profile = {
      id: newId,
      role: onboardingRole!,
      name: onboardingRole === 'parent' ? `길드마스터 ${roleCount('parent') + 1}` : `아기 모험가 ${roleCount('child') + 1}`,
      avatar: onboardingRole === 'parent' ? '🧙‍♀️' : '🛡️',
      pin: onboardingRole === 'parent' ? '1234' : '0000',
      title: data.title,
      level: onboardingRole === 'child' ? 1 : 0,
      exp: 0,
      gold: onboardingRole === 'child' ? 1000 : 0,
      stress: onboardingRole === 'child' ? 30 : 0,
      style: data.style,
      childClass: data.childClass,
      stats: data.stats || { intelligence: 10, willpower: 10, autonomy: 10, cooperation: 10, sensibility: 10 }
    };

    const updatedList = [...list, newProfile];
    localStorage.setItem('ff_profiles', JSON.stringify(updatedList));
    setProfiles(updatedList);
    setOnboardingRole(null);
  };

  const roleCount = (role: 'parent' | 'child') => {
    return profiles.filter(p => p.role === role).length;
  };

  // 모의 데이터 초기화 리셋 단추
  const handleReset = () => {
    if (confirm("모든 데이터를 초기 기본 세팅으로 리셋하시겠습니까?")) {
      api.resetToDefault();
    }
  };

  if (onboardingRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <ChatbotOnboarding
          role={onboardingRole}
          onComplete={handleOnboardingComplete}
          onCancel={() => setOnboardingRole(null)}
        />
      </div>
    );
  }

  // --- 기획서 1페이지 인트로 대기 시작화면 렌더링 ---
  if (showIntro) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* 네온 배경 장식 */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="max-w-md w-full text-center space-y-8 z-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              🏆 자녀생활습관 만들기 타이쿤
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              패밀리 던전 타이쿤
            </h1>
            <p className="text-sm font-semibold text-slate-400">
              보호자 마스터 & 자녀 플레이어 연동 게임
            </p>
          </div>

          {/* 로우폴리 프리뷰 박스 */}
          <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl relative">
            <img src="/start-01.jfif" alt="Family Tycoon Map" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-4">
            {!showLoading ? (
              <button
                onClick={handleStartAdventure}
                className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm rounded-2xl transition duration-300 transform active:scale-95 shadow-lg shadow-pink-500/20 tracking-wider"
              >
                🎮 입장하기 (로그인)
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>LOADING ADVENTURE...</span>
                  <span className="text-indigo-400">{loadingPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-150"
                    style={{ width: `${loadingPercent}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-bold">
              * 입장하기 버튼을 누르면 캐릭터 선택 및 프로필 로드 화면으로 진입합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between py-12 px-4 select-none">
      
      {/* 최상단 타이틀 */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          🏆 자녀 생활습관 메이커 타이쿤
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          패밀리 던전 타이쿤
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-semibold">
          모험을 시작하시겠습니까? 원하는 프로필을 선택해 진입하세요.
        </p>
      </div>

      {/* 타이쿤 게임 맵 및 그래픽 컨셉 비주얼 배너 */}
      <div className="max-w-4xl mx-auto w-full mt-8">
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-2/5 aspect-[16/9] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative group">
            <img 
              src="/start-01.jfif" 
              alt="Family Tycoon Map Concept" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-3">
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                🏰 2D 로우폴리 월드맵 프리뷰
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-left">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              👾 타이쿤 네온 컨셉 팩 활성화됨
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              네온 핑크와 딥 블랙 테마의 로우폴리(Low-Poly) 스타일이 적용된 웹 타이쿤 스킨이 로드되었습니다. 
              보호자와 모험가가 함께 가족 전용 던전의 율법 퀘스트를 달성하여 길드를 육성하고, 레벨 제한 해제 상점을 정복해 나가세요!
            </p>
          </div>
        </div>
      </div>

      {/* 본문 프로필 격자 그리드 */}
      <div className="max-w-4xl mx-auto w-full my-12">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> 길드 멤버 프로필 선택
            </h3>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 데이터 리셋
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => handleProfileClick(p)}
                className="group relative cursor-pointer bg-slate-950/70 border border-slate-850 hover:border-indigo-500/50 hover:bg-slate-900/90 rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
              >
                {/* 핀/수정 편집 단추 */}
                <button
                  onClick={(e) => handleEditClick(p, e)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-white bg-slate-900 p-1.5 rounded-lg hover:bg-slate-850 border border-slate-800/80 transition"
                  title="프로필 수정"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <div className="w-16 h-16 rounded-2xl bg-indigo-950/30 group-hover:bg-indigo-950/50 border border-slate-800 flex items-center justify-center overflow-hidden transition select-none mb-4">
                  {p.role === 'parent' ? (
                    <span className="text-4xl">{p.avatar}</span>
                  ) : (
                    <img 
                      src={
                        p.childClass === 'scholar' ? '/INT.svg' :
                        p.childClass === 'pioneer' ? '/STR.svg' :
                        p.childClass === 'guardian' ? '/CRT.svg' :
                        p.childClass === 'bard' ? '/CPN.svg' :
                        '/INT.svg'
                      } 
                      alt="Class Icon" 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-slate-100">{p.name}</div>
                  <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-block">
                    {p.role === 'parent' ? '보호자(Master)' : `자녀(Lv.${p.level})`}
                  </div>
                </div>

                {p.title && (
                  <div className="text-[10px] text-slate-400 font-semibold mt-3 max-w-[120px] truncate">
                    {p.title.split(' ')[0]}
                  </div>
                )}
              </div>
            ))}

            {/* 프로필 추가 단추 */}
            {profiles.length < 6 && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleAddProfile('parent')}
                  className="h-1/2 flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-300 transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> 보호자 추가
                </button>
                <button
                  onClick={() => handleAddProfile('child')}
                  className="h-1/2 flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/30 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-300 transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> 자녀(모험가) 추가
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 핀번호 입력 모달 */}
      {isPinModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> 계정 진입 보호 PIN 설정
              </h3>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6 text-center">
              <div className="w-14 h-14 bg-indigo-950/20 border border-slate-850 rounded-xl flex items-center justify-center text-3xl mx-auto mb-2 select-none">
                {selectedProfile.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{selectedProfile.name} 님</p>
                <p className="text-xs text-slate-400 mt-1">4자리 핀 번호를 입력해주세요.</p>
                <p className="text-[10px] text-indigo-400 mt-2 font-semibold">
                  💡 힌트: 보호자 {selectedProfile.pin === '1234' ? '1234' : selectedProfile.pin === '5678' ? '5678' : '신규 설정'}, 자녀는 &apos;0000&apos;
                </p>
              </div>

              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-36 text-center bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-2xl tracking-widest text-indigo-400 focus:border-indigo-500 outline-none font-bold"
                required
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-red-500 font-bold">⚠️ PIN 번호가 일치하지 않습니다.</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition text-xs shadow-lg"
              >
                🔓 입장하기 (로그인)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 */}
      {isEditing && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                ✏️ 프로필 정보 설정
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">4자리 PIN 비밀번호</label>
                <input
                  type="password"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 tracking-widest outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold transition text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition text-xs shadow-md"
                >
                  저장
                </button>
              </div>

              {/* 관리 위원회 전용: 프로필 영구 삭제 버튼 (기획서 1페이지 프로필 관리 보완) */}
              <div className="pt-4 border-t border-slate-850/60 text-center">
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(selectedProfile.id)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl font-bold transition text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ❌ 이 프로필 영구 삭제
                </button>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  * 프로필 삭제 시 해당 모험가의 스탯 기록 및 보상 획득 정보가 즉시 파괴됩니다.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 최하단 저작권 캡션 */}
      <div className="text-center text-xs text-slate-600 font-semibold mt-4">
        © 2026 Family Dungeon Tycoon. All Rights Reserved.
      </div>
    </div>
  );
};
