'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Profile } from '@/types';
import { Shield, User, Key, Plus, Trash2, Edit2, RotateCcw, Eye, EyeOff } from 'lucide-react';
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
  
  // 회원가입 전용 페이지 전환 상태 및 폼 필드 (성인만 회원가입 가능)
  const [showSignupPage, setShowSignupPage] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBirthdate, setSignupBirthdate] = useState('1990-01-01');
  const [signupGender, setSignupGender] = useState<'male' | 'female'>('male');
  const [signupEmail, setSignupEmail] = useState('');
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [showSignupGuideModal, setShowSignupGuideModal] = useState(false);
  const [tempSignupData, setTempSignupData] = useState<{ name: string; password: string; email: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 인트로 시작 페이지 대기 유무
  const [showIntro, setShowIntro] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    api.getProfiles().then(setProfiles);
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

  const handleStartSignup = () => {
    // 신규 가족 회원가입 시 기존 완성형 데모 데이터는 공란(empty) 상태로 초기화합니다.
    localStorage.setItem('ff_profiles', JSON.stringify([]));
    setProfiles([]);
    setShowSignupPage(true);
    setShowSignupGuideModal(true); // 길드마스터 반드시 등록 안내 팝업 활성화
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    const updated = {
      ...selectedProfile,
      name: editName,
      pin: editPin
    };
    const list = await api.updateProfile(updated);
    setProfiles(list);
    setIsEditing(false);
    setSelectedProfile(null);
  };

  const handleDeleteProfile = async (id: string) => {
    if (confirm("정말로 이 프로필을 길드에서 영구 삭제하시겠습니까?")) {
      const list = await api.deleteProfile(id);
      setProfiles(list);
      setIsEditing(false);
      setSelectedProfile(null);
    }
  };

  const handleAddProfile = (role: 'parent' | 'child') => {
    setOnboardingRole(role);
  };

  const handleOnboardingComplete = async (data: any) => {
    const list = await api.getProfiles();
    const isSignupFlow = onboardingRole === 'parent' && tempSignupData !== null;
    
    const newId = isSignupFlow
      ? 'parent1'
      : (roleCount(onboardingRole!) > 0 ? `${onboardingRole!}${roleCount(onboardingRole!) + 1}` : `${onboardingRole!}2`);
      
    const finalName = isSignupFlow ? tempSignupData.name : (onboardingRole === 'parent' ? `길드마스터 ${roleCount('parent') + 1}` : `아기 모험가 ${roleCount('child') + 1}`);
    const finalPin = isSignupFlow ? '1234' : (onboardingRole === 'parent' ? '1234' : '0000'); // default PIN, editable per profile card

    const newProfile: Profile = {
      id: newId,
      role: onboardingRole!,
      name: finalName,
      avatar: onboardingRole === 'parent' ? '🧙‍♀️' : '🛡️',
      pin: finalPin,
      title: data.title,
      level: 1,
      exp: 0,
      gold: 1000,
      stress: onboardingRole === 'child' ? 30 : 0,
      style: data.style,
      childClass: data.childClass,
      stats: data.stats || { intelligence: 10, willpower: 10, autonomy: 10, cooperation: 10, sensibility: 10 },
      password: isSignupFlow ? tempSignupData.password : undefined
    };

    const updatedList = isSignupFlow ? [newProfile] : [...list, newProfile];
    
    if (isSignupFlow) {
      localStorage.setItem('ff_profiles', JSON.stringify(updatedList));
      setProfiles(updatedList);
      // Supabase에도 명시적으로 저장
      await api.updateProfile(newProfile);
    } else {
      const dbList = await api.updateProfile(newProfile);
      setProfiles(dbList);
    }

    setOnboardingRole(null);
    setTempSignupData(null);
    
    if (isSignupFlow) {
      setShowIntro(false);
      alert(`🎉 [가입 완료] 성향 분석이 성공적으로 마무리되어 길드마스터 ${finalName} 님이 등록되었습니다! (초기 PIN 번호는 '1234'로 설정되었으며, 프로필 카드 관리 화면에서 수정하실 수 있습니다.)`);
    }
  };

  const handleRegisterProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      alert("이름을 입력해 주세요!");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      alert("올바른 이메일 주소를 입력해 주세요!");
      return;
    }
    
    // 비밀번호 정규식 검증: 영문, 숫자, 특수문자 포함 8자리 이상
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._\-])[A-Za-z\d@$!%*#?&._\-]{8,}$/;
    if (!passwordRegex.test(signupPassword)) {
      alert("⚠️ 비밀번호는 영문, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다.");
      return;
    }
    
    if (!agreeToPrivacy) {
      alert("개인정보 수집 및 활용 동의란에 체크하셔야 회원가입이 최종 완료됩니다.");
      return;
    }

    // 성인(만 19세 이상) 검증: 현재 2026년 기준
    const birthYear = new Date(signupBirthdate).getFullYear();
    const currentYear = 2026;
    const age = currentYear - birthYear;
    if (isNaN(age) || age < 19) {
      alert("⚠️ 회원가입은 만 19세 이상의 성인(길드마스터)만 가능합니다. 생년월일을 다시 확인해 주세요.");
      return;
    }

    // 작성한 계정 정보 임시 백업 및 성향 진단 챗봇 실행
    setTempSignupData({
      name: signupName,
      password: signupPassword,
      email: signupEmail
    });

    // reset form fields
    setSignupName('');
    setSignupPassword('');
    setSignupEmail('');
    setSignupBirthdate('1990-01-01');
    setAgreeToPrivacy(false);
    
    setShowSignupPage(false);
    setOnboardingRole('parent'); // 온보딩 챗봇 호출하여 길드마스터 성향 분석 실행
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
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <ChatbotOnboarding
          role={onboardingRole}
          onComplete={handleOnboardingComplete}
          onCancel={() => setOnboardingRole(null)}
        />
      </div>
    );
  }

  // --- 회원가입 전용 페이지 렌더링 ---
  if (showSignupPage) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* 네온 배경 장식 */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />

        {/* 회원가입 안내 모달 (최소 1명 길드마스터 필수 등록 안내) */}
        {showSignupGuideModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#EBE6DD] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <span className="text-3xl">🧙‍♀️</span>
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="text-md font-black text-slate-800 font-bw text-center">📢 길드마스터 등록 필수 안내</h4>
                <p className="text-xs text-slate-600 font-bold leading-relaxed mt-2">
                  신규 패밀리 모험이 시작되었습니다!<br />
                  길드를 활성화하기 위해 <span className="text-indigo-600 font-black underline">최소 1명의 길드마스터(보호자)</span>를 회원가입을 통해 반드시 등록하셔야 합니다.
                </p>
                <p className="text-[10px] text-slate-400 font-semibold pt-1">
                  * 회원가입 완료 후 모험가(자녀) 프로필을 대시보드에서 추가로 생성하여 플레이할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setShowSignupGuideModal(false)}
                className="w-full py-3 bg-[#644EB0] hover:bg-[#523d9c] text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-[#644EB0]/15"
              >
                확인했습니다 🛡️
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md w-full bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-xl z-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800 font-bw">🛡️ 신규 모험가 회원가입</h2>
            <p className="text-xs text-slate-500 font-medium font-sans">활동하실 모험가 프로필을 등록하여 모험을 시작하세요.</p>
          </div>

          <form onSubmit={handleRegisterProfile} className="space-y-4 text-left">
            {/* 이름 입력 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">이름</label>
              <input
                type="text"
                required
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition shadow-sm"
              />
            </div>

            {/* 이메일 입력 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">이메일 주소</label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition shadow-sm"
              />
            </div>

            {/* 생년월일 입력 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">생년월일</label>
              <input
                type="date"
                required
                value={signupBirthdate}
                onChange={e => setSignupBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition shadow-sm"
              />
              <p className="text-[9px] text-amber-600 font-semibold">* 본 서비스는 만 19세 이상의 성인(길드마스터)만 가입할 수 있습니다.</p>
            </div>

            {/* 성별 선택 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupGender('male')}
                  className={`py-3 rounded-2xl border text-xs font-black transition ${
                    signupGender === 'male'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-750 shadow-sm'
                      : 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white/60'
                  }`}
                >
                  🙋‍♂️ 남성
                </button>
                <button
                  type="button"
                  onClick={() => setSignupGender('female')}
                  className={`py-3 rounded-2xl border text-xs font-black transition ${
                    signupGender === 'female'
                      ? 'bg-pink-50 border-pink-500 text-pink-750 shadow-sm'
                      : 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white/60'
                  }`}
                >
                  🙋‍♀️ 여성
                </button>
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">비밀번호 (영문, 숫자, 특수문자 조합 8자 이상)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-200 bg-white/80 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 개인정보 활용 동의 (필수 체크란) */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/50 border border-slate-200">
              <input
                type="checkbox"
                id="agreeToPrivacy"
                checked={agreeToPrivacy}
                onChange={e => setAgreeToPrivacy(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#644EB0] focus:ring-[#644EB0] border-slate-350 cursor-pointer"
              />
              <label htmlFor="agreeToPrivacy" className="text-[10px] font-bold text-slate-700 cursor-pointer leading-tight">
                [필수] 개인정보 수집 및 활용 동의
                <span className="block text-[8px] text-slate-500 font-semibold mt-0.5">
                  서비스 가입 및 본인 확인, 패밀리 길드 관리 목적으로 회원님의 성명, 이메일, 생년월일 정보를 수집하고 활용하는 것에 동의합니다.
                </span>
              </label>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={!agreeToPrivacy}
                className="w-full py-3.5 bg-[#644EB0] hover:bg-[#523d9c] disabled:bg-slate-400 text-white font-extrabold text-xs rounded-2xl transition duration-300 transform active:scale-95 shadow-md shadow-[#644EB0]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                💾 회원가입 및 등록 완료
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignupPage(false);
                  setSignupName('');
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition"
              >
                취소하고 첫화면으로
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- 기획서 1페이지 인트로 대기 시작화면 렌더링 ---
  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* 네온 배경 장식 */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="max-w-md w-full text-center space-y-8 z-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight font-bw bg-gradient-to-r from-[#AC52F2] to-[#E879F9] bg-clip-text text-transparent inline-block">
              패밀리 던전 타이쿤
            </h1>
          </div>

          {/* 로우폴리 프리뷰 박스 */}
          <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-300 bg-white/60 shadow-2xl relative">
            <img src="/familyguildtycoon_start.jfif" alt="Family Tycoon Map" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-4">
            {!showLoading ? (
              <div className="space-y-3">
                <button
                  onClick={handleStartSignup}
                  className="w-full py-4 bg-[#644EB0] hover:bg-[#523d9c] text-white font-extrabold text-[17px] font-bw rounded-2xl transition duration-300 transform active:scale-95 shadow-lg shadow-[#644EB0]/20 tracking-wider flex items-center justify-center gap-2"
                >
                  📝 회원가입하기
                </button>
                <button
                  onClick={handleStartAdventure}
                  className="w-full py-4 bg-[#644EB0] hover:bg-[#523d9c] text-white font-extrabold text-[17px] font-bw rounded-2xl transition duration-300 transform active:scale-95 shadow-lg shadow-[#644EB0]/20 tracking-wider flex items-center justify-center gap-2"
                >
                  🎮 입장하기 (로그인)
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-2xl animate-pulse">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>LOADING ADVENTURE...</span>
                  <span className="text-indigo-600">{loadingPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
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
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans flex flex-col justify-start py-6 px-4 select-none">
      
      {/* 최상단 타이틀 */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-2 mt-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-[#AC52F2] to-[#E879F9] bg-clip-text text-transparent inline-block font-bw">
          패밀리 던전 타이쿤
        </h1>
      </div>

      {/* 본문 프로필 격자 그리드 */}
      <div className="max-w-4xl mx-auto w-full mt-10 mb-4">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl">
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
                  className="h-[46%] flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition bg-slate-950/20"
                >
                  <Plus className="w-4 h-4 mr-1 text-indigo-400" /> 보호자 추가
                </button>
                <button
                  onClick={() => handleAddProfile('child')}
                  className="h-[46%] flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl text-xs font-bold text-emerald-400 hover:text-emerald-300 transition bg-slate-950/20"
                >
                  <Plus className="w-4 h-4 mr-1 text-emerald-400" /> 자녀 추가
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
