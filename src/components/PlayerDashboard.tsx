'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { childRequestQuestApproval, childRequestGoldPayout, childCounterProposeQuest } from '@/lib/questController';
import { Profile, Quest, StoreItem, AppNotification } from '@/types';
import { getStressStatus, getPassiveBuffs } from '@/lib/gameEngine';
import { RadarChart } from '@/components/RadarChart';
import {
  Award, Zap, CheckCircle2, ShieldAlert, Coins, HelpCircle,
  Camera, ShoppingBag, Plus, RefreshCw, LogOut, Sliders, ChevronRight
} from 'lucide-react';

interface PlayerDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ user, onLogout }) => {
  // 탭 상태 ('home' | 'quest' | 'store')
  const [activeTab, setActiveTab] = useState<'home' | 'quest' | 'store'>('home');
  const [child, setChild] = useState<Profile>(user);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // 퀘스트 접기/펼치기 제어 상태 (자녀 모드용)
  const [isMainQuestsCollapsed, setIsMainQuestsCollapsed] = useState(false);
  const [isFlashQuestsCollapsed, setIsFlashQuestsCollapsed] = useState(false);

  // 실시간 타이머 및 던전 문 제어 상태
  const [timeState, setTimeState] = useState({
    currentTimeStr: '00:00:00',
    timeLeftStr: '00시간 00분 00초',
    gateProgress: 0
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      
      const currentTimeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      // 자정(24:00)까지의 카운트다운
      const totalSecsInDay = 24 * 3600;
      const currentTotalSecs = hrs * 3600 + mins * 60 + secs;
      const diffSecs = totalSecsInDay - currentTotalSecs;
      
      const diffHrs = Math.floor(diffSecs / 3600);
      const diffMins = Math.floor((diffSecs % 3600) / 60);
      const diffSecsLeft = diffSecs % 60;
      const timeLeftStr = `${String(diffHrs).padStart(2, '0')}시간 ${String(diffMins).padStart(2, '0')}분 ${String(diffSecsLeft).padStart(2, '0')}초`;
      
      // 문 계산: 오전 8시(0%) ~ 밤 12시(100%)
      const startSecs = 8 * 3600;
      let gateProgress = 0;
      if (currentTotalSecs >= startSecs) {
        gateProgress = ((currentTotalSecs - startSecs) / (totalSecsInDay - startSecs)) * 100;
        if (gateProgress > 100) gateProgress = 100;
      } else {
        gateProgress = 100; // 자정 ~ 오전 8시 사이에는 완전 닫힘
      }
      
      setTimeState({ currentTimeStr, timeLeftStr, gateProgress });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 카메라 촬영 완료 인증 팝업 모사 상태
  const [activeCameraQuest, setActiveCameraQuest] = useState<Quest | null>(null);
  
  // 카메라 모드 상태 ('idle' | 'capture' | 'upload')
  const [cameraMode, setCameraMode] = useState<'idle' | 'capture' | 'upload'>('idle');
  // 스캔한 가짜 파일 전송용 파일명 모사
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // 역제안(밀당) 모달 상태
  const [activeNegotiateQuest, setActiveNegotiateQuest] = useState<Quest | null>(null);
  const [negotiateGold, setNegotiateGold] = useState(500);

  // 셀프 퀘스트 빌더
  const [isSelfQuestOpen, setIsSelfQuestOpen] = useState(false);
  const [selfQuestTitle, setSelfQuestTitle] = useState('');
  const [selfQuestGold, setSelfQuestGold] = useState(300);

  // 실제 돈 환원 요청 모달
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(1000);

  const loadData = () => {
    const list = api.getProfiles();
    const current = list.find(p => p.id === user.id);
    if (current) setChild(current);
    setQuests(api.getQuests());
    setStoreItems(api.getStoreItems());
    setNotifications(api.getNotifications());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleQuestCompleteClick = (q: Quest) => {
    if (q.category === '학습' || q.category === '독서') {
      setActiveCameraQuest(q);
      setCameraMode('idle');
      setUploadedFile(null);
    } else {
      childRequestQuestApproval(q.id, q.title, '', child.id, child.name);
      loadData();
      alert(`🛡️ [인증 완료] [${q.title}] 인증 요청을 길드마스터에게 전송했습니다.`);
    }
  };

  const handleCameraCaptureConfirm = () => {
    if (activeCameraQuest) {
      const displayUrl = cameraMode === 'upload' ? 'https://picsum.photos/400/300?random=1' : 'https://picsum.photos/400/300';
      childRequestQuestApproval(
        activeCameraQuest.id,
        activeCameraQuest.title,
        displayUrl,
        child.id,
        child.name
      );
      setActiveCameraQuest(null);
      setCameraMode('idle');
      setUploadedFile(null);
      loadData();
    }
  };

  const handleNegotiationSubmit = () => {
    if (activeNegotiateQuest) {
      childCounterProposeQuest(activeNegotiateQuest.id, negotiateGold);
      setActiveNegotiateQuest(null);
      loadData();
      alert(`🤝 길드마스터에게 보상 조정 (${negotiateGold}G) 역제안을 올렸습니다.`);
    }
  };

  const handleSelfQuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfQuestTitle.trim()) return;

    api.addQuest({
      title: selfQuestTitle,
      category: '기타',
      type: 'self',
      rewardType: 'both',
      rewardExp: 30,
      rewardGold: selfQuestGold
    });

    api.addNotification({
      message: `🧚‍♀️ 자녀가 주도적으로 셀프 퀘스트 [${selfQuestTitle}]을 스스로 설계하여 도전 중입니다.`,
      type: 'self_quest_proposal'
    });

    setSelfQuestTitle('');
    setIsSelfQuestOpen(false);
    loadData();
    alert(`⚡ 셀프 모험 [${selfQuestTitle}]을 스스로 등록하여 도전을 시작했습니다!`);
  };

  const handlePurchaseItem = (item: StoreItem) => {
    if (child.level < item.requiredLevel) {
      alert(`🔒 레벨 제한! 캐릭터 레벨 ${item.requiredLevel} 이상이 필요합니다.`);
      return;
    }
    if (child.gold < item.price) {
      alert(`🪙 골드가 부족합니다. 돌발 퀘스트를 클리어해 골드를 모으세요!`);
      return;
    }

    const updatedChild = { ...child, gold: child.gold - item.price };
    api.updateProfile(updatedChild);

    const updatedItem: StoreItem = { ...item, status: 'requested' };
    api.updateStoreItem(updatedItem);

    api.addNotification({
      message: `🛍️ 자녀가 길드 상점에서 [${item.name}] 구매 승인을 요청했습니다.`,
      type: 'item_request',
      targetId: item.id
    });

    loadData();
    alert(`🛍️ [구매 요청] [${item.name}] 구매 요청을 전송했습니다. 길드마스터가 승인하면 쿠폰이 발행됩니다.`);
  };

  const handlePayoutSubmit = () => {
    if (child.level < 5) {
      alert('🔒 골드 실제 현금화는 캐릭터 레벨 5 이상부터 요청할 수 있습니다.');
      return;
    }
    if (child.gold < payoutAmount) {
      alert('🪙 보유 골드가 부족합니다.');
      return;
    }

    const success = childRequestGoldPayout(payoutAmount);
    if (success) {
      setIsPayoutOpen(false);
      loadData();
      alert(`💰 ${payoutAmount}원 현금 전환 요청을 완료했습니다!`);
    }
  };

  const stressInfo = getStressStatus(child.stress);
  const activeBuffs = getPassiveBuffs(child.style);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans pb-16">
      
      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EBE6DD] py-3 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🛡️</div>
          <div>
            <h1 className="text-sm md:text-md font-black tracking-tight text-slate-900 flex items-center gap-1.5 font-bw">
              패밀리 던전 타이쿤 <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-sans">플레이어 모드</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold">{child.name}</p>
          </div>
        </div>

        {/* 대시보드 메인 탭 전환 버튼 구역 (기획안 13페이지 준수) */}
        <nav className="flex items-center bg-slate-100 border border-slate-200 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'home'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            홈 (캐릭터)
          </button>
          <button
            onClick={() => setActiveTab('quest')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quest'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            퀘스트
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'store'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            상점
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSelfQuestOpen(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-md"
          >
            <Plus className="w-3 h-3" /> 내 마음대로 모험
          </button>
          <button
            onClick={onLogout}
            className="bg-slate-200 hover:bg-slate-350 text-slate-700 hover:text-slate-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-300"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* 1. 홈 탭 (캐릭터 상태 + 버프 + 전령) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 좌측 캐릭터 1/3 영역 분할 메인 박스 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* [1/3 영역] 캐릭터 창 카드 */}
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-52 h-52 rounded-3xl bg-slate-950 border-2 border-indigo-500/20 overflow-hidden flex items-center justify-center shadow-inner relative group p-[10px]">
                  <img 
                    src={
                      child.childClass === 'scholar' ? '/INT.svg' :
                      child.childClass === 'pioneer' ? '/STR.svg' :
                      child.childClass === 'guardian' ? '/CRT.svg' :
                      child.childClass === 'bard' ? '/CPN.svg' :
                      '/INT.svg' // fallback
                    } 
                    alt="Class Avatar" 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                  />
                  <span className="absolute bottom-[3px] right-[3px] bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-lg shadow-md border border-slate-900 z-10">
                    Lv.{child.level}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-100">{child.name}</h3>
                  <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-block">
                    {child.title || '성향 진단 완료'}
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-slate-850/60 space-y-3 text-left">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>성장 경험치</span>
                      <span className="text-emerald-400">{child.exp} / {child.level * 100} EXP</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                        style={{ width: `${(child.exp / (child.level * 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">🪙 골드 주머니</span>
                      <span className="text-xs font-black text-amber-400">{child.gold.toLocaleString()} G</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">💥 피로도</span>
                      <span className={`text-xs font-black ${child.stress >= 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {child.stress} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* [2/3 영역] 하단/우측 모험가 상세 지표 & 버프 장비 박스 */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* 아이템 가방 및 스탯 차트 가로 2분할 레이아웃 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* 아이템 가방 (인벤토리) */}
                  <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                        🎒 아이템 가방
                      </h4>
                      <p className="text-[9px] text-slate-500 font-medium mb-4">
                        마스터에게 획득한 이용권/아이템 보관함 (클릭 시 사용 알림 전령 발송)
                      </p>
                    </div>

                    {/* 3x3 격자 인벤토리 슬롯 */}
                    <div className="grid grid-cols-3 gap-2.5 my-auto">
                      {Array.from({ length: 9 }).map((_, idx) => {
                        const itemId = (child.inventory || [])[idx];
                        const item = itemId ? storeItems.find(i => i.id === itemId) : null;
                        
                        return (
                          <button
                            key={idx}
                            disabled={!item}
                            onClick={() => {
                              if (item) {
                                // 1. 마스터에게 알림 전령 전송
                                api.addNotification({
                                  message: `🔔 [이용권 사용 요청] 자녀(${child.name.split(' ')[0]})가 획득 보관 중이던 [${item.name}] 이용권 실물 사용을 요청했습니다.`,
                                  type: 'item_use_request',
                                  targetId: item.id,
                                  meta: { itemId: item.id, itemName: item.name, childId: child.id }
                                });
                                // 2. 인벤토리에서 해당 아이템 1개 제거 소모 처리
                                const updatedInventory = [...(child.inventory || [])];
                                updatedInventory.splice(idx, 1);
                                const updatedChild = { ...child, inventory: updatedInventory };
                                api.updateProfile(updatedChild);
                                loadData();
                                alert(`🔔 [전령 발송] 마스터에게 [${item.name}] 사용 전령 메시지를 전달했습니다!`);
                              }
                            }}
                            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1.5 transition-all duration-300 relative group ${
                              item
                                ? 'bg-slate-950 border-indigo-500/40 hover:bg-slate-900/90 hover:border-indigo-400 hover:scale-105 active:scale-95'
                                : 'bg-slate-950/20 border-slate-850 cursor-default'
                            }`}
                            title={item ? `${item.name} (클릭 시 사용)` : '빈 슬롯'}
                          >
                            {item ? (
                              <div className="w-full h-full relative flex flex-col items-center justify-between">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <span className="text-xl select-none mt-1">
                                    {item.type === 'coupon' ? '🎟️' : item.type === 'real' ? '💵' : '📦'}
                                  </span>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-950/70 py-0.5 rounded-b-xl">
                                  <span className="text-[7px] text-slate-200 font-extrabold truncate w-full text-center block px-1">
                                    {item.name.replace('[쿠폰] ', '').replace('[패스] ', '').replace('[용돈] ', '').replace('[식품] ', '').replace('[아바타] ', '').replace('[외식] ', '')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-850" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5대 스탯 및 칭호 오각형 그래프 박스 */}
                  <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl flex flex-col justify-between items-center text-center">
                    <h4 className="text-xs font-bold text-white mb-2 self-start flex items-center gap-1.5">
                      📊 모험가 스탯 차트
                    </h4>
                    <div className="flex-1 flex justify-center items-center">
                      {child.stats ? (
                        <RadarChart stats={child.stats} size={185} />
                      ) : (
                        <div className="text-xs text-slate-500">스탯 정보가 등록되지 않았습니다.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* 적용 버프 & 컨디션 박스 */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      👑 부모 양육스타일 연동 패시브 버프
                    </h4>
                    {activeBuffs.length > 0 ? (
                      activeBuffs.map((buff, i) => (
                        <div key={i} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl">
                          🛡️ {buff}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-500">현재 활성화된 패시브 버프가 없습니다.</div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${stressInfo.color}`}>
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{stressInfo.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stressInfo.desc}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* 길드마스터 훈육/독려 전령 메시지 수신함 */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl mt-6">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-850 pb-3">
                💬 길드마스터 전령 메시지 수신함
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {notifications.filter(n => n.message.includes('"')).length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs font-bold italic">
                    아직 수신된 전령 메시지가 없습니다.
                  </div>
                ) : (
                  notifications.filter(n => n.message.includes('"')).map(n => (
                    <div key={n.id} className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-xs font-semibold leading-relaxed text-indigo-300">
                      <p className="text-[9px] text-indigo-400/70 mb-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 퀘스트 탭 (퀘스트 리스트 + 3클릭 인증 & 역제안) */}
        {activeTab === 'quest' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 메인 퀘스트 섹션 (던전 진입 테마) */}
            <div className="bg-white border border-[#EBE6DD] rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div 
                onClick={() => setIsMainQuestsCollapsed(!isMainQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-[#EBE6DD]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'main').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-bw">
                    🏰 메인 던전 게이트 (일일 루틴)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold">
                  <span>{isMainQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isMainQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isMainQuestsCollapsed && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                  
                  {/* 상단: 타이머 UI */}
                  <div className="bg-[#1e1b29] text-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border border-[#3c3654] shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⏱️</span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">현재 시간</p>
                        <p className="text-sm font-black text-white font-bw">{timeState.currentTimeStr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#2d293d] px-3.5 py-1.5 rounded-xl border border-[#443e5c]">
                      <span className="text-xs text-rose-400 font-bold">던전 마감까지 남은 시간:</span>
                      <span className="text-xs font-black text-rose-300 font-bw">{timeState.timeLeftStr}</span>
                    </div>
                  </div>

                  {/* 중앙 & 우측: 던전 입구 및 징검다리 횡스크롤 */}
                  {quests.filter(q => q.type === 'main').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold italic bg-slate-50 rounded-2xl border border-slate-200">
                      등록된 메인 던전 퀘스트가 없습니다.
                    </div>
                  ) : (
                    <div className="relative w-full h-72 rounded-2xl border border-slate-300 bg-slate-950 overflow-hidden flex flex-col justify-end p-4 shadow-inner">
                      {/* 던전 배경 데코레이션 */}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#111625] via-[#1b2238] to-[#0c0f1a] opacity-95" />
                      
                      {/* 횃불 애니메이션 효과 */}
                      <div className="absolute top-4 left-6 flex flex-col items-center select-none z-10">
                        <span className="text-lg animate-bounce duration-1000">🔥</span>
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full border border-slate-700 mt-1" />
                      </div>
                      <div className="absolute top-4 right-6 flex flex-col items-center select-none z-10">
                        <span className="text-lg animate-bounce duration-1000 delay-300">🔥</span>
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full border border-slate-700 mt-1" />
                      </div>
                      
                      <div className="absolute inset-0 flex items-end justify-between px-6 z-10 pb-8">
                        {/* 징검다리 횡스크롤 영역 - 높이를 h-44로 지정하고 items-end로 정렬해 상단 캐릭터가 안 잘리게 함 */}
                        <div className="flex-1 overflow-x-auto h-44 flex items-end gap-6 pr-12 scrollbar-thin">
                          {quests.filter(q => q.type === 'main').map((q, idx, arr) => {
                            // 징검다리 상태(State) 계산
                            const isCompleted = q.status === 'completed';
                            const prevCompleted = arr.slice(0, idx).every(item => item.status === 'completed');
                            const isActive = !isCompleted && prevCompleted;
                            const isLocked = !isCompleted && !prevCompleted;
                            
                            let stateColor = 'bg-slate-800/80 border-slate-700 text-slate-400 shadow-md';
                            if (isCompleted) {
                              stateColor = 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20';
                            } else if (isActive) {
                              stateColor = 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/30 animate-pulse border-2';
                            }
                            
                            return (
                              <div 
                                key={q.id} 
                                onClick={() => {
                                  if (!isCompleted && !isLocked) {
                                    handleQuestCompleteClick(q);
                                  }
                                }}
                                className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center p-2 text-center cursor-pointer transition transform hover:scale-105 select-none relative mb-1 ${stateColor}`}
                              >
                                {/* 캐릭터 앉아 있는 연출 (ACTIVE) */}
                                {isActive && (
                                  <div className="absolute -top-12 z-20 flex flex-col items-center animate-bounce">
                                    <span className="text-3xl filter drop-shadow">{child.avatar || '🛡️'}</span>
                                    <span className="text-[7px] text-amber-300 bg-slate-950 px-1 rounded-full border border-amber-500 font-bold">진행중</span>
                                  </div>
                                )}
                                
                                {isCompleted ? (
                                  <span className="text-xl mb-1">👣</span>
                                ) : isLocked ? (
                                  <span className="text-lg text-slate-655 mb-1">🔒</span>
                                ) : (
                                  <span className="text-xl mb-1">⚔️</span>
                                )}
                                
                                <p className="text-[9px] font-black leading-tight max-w-[80px] truncate">{q.title}</p>
                                <p className="text-[7px] text-slate-400 mt-0.5">{q.rewardExp} EXP</p>
                                
                                {q.status === 'request_approval' && (
                                  <span className="absolute -bottom-2 bg-indigo-600 text-[6px] font-black text-white px-1 py-0.5 rounded border border-indigo-400 animate-pulse">검수중</span>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* 모든 퀘스트가 완료되었을 경우의 골 게이트 위치 캐릭터 */}
                          {quests.filter(q => q.type === 'main').every(q => q.status === 'completed') && (
                            <div className="flex-shrink-0 w-20 flex flex-col items-end justify-center animate-bounce pb-2">
                              <div className="flex flex-col items-center">
                                <span className="text-4xl">{child.avatar || '🛡️'}</span>
                                <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold mt-1">도착!</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 우측 던전 게이트 (Portcullis Gate) */}
                        <div className="w-24 h-36 flex-shrink-0 relative bg-slate-900 rounded-t-2xl border-t-4 border-amber-900 border-x-2 border-x-amber-950 overflow-hidden flex flex-col justify-end">
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 to-transparent" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] font-black text-purple-400 tracking-wider z-10 leading-normal select-none">
                            <span>던전<br/>입구</span>
                          </div>
                          
                          {/* 실시간으로 하강하는 쇠창살 문 (Portcullis Gate) */}
                          <div 
                            className="absolute inset-0 bg-transparent flex justify-around p-1 h-full transition-transform duration-1000 z-20"
                            style={{ transform: `translateY(${-100 + timeState.gateProgress}%)` }}
                          >
                            {/* 쇠창살 기둥들 */}
                            <div className="w-1.5 h-full bg-slate-600 border-x border-slate-800 rounded-b-sm relative shadow-md">
                              <div className="absolute bottom-0 w-full h-2 bg-slate-900 rounded-b-sm" />
                            </div>
                            <div className="w-1.5 h-full bg-slate-600 border-x border-slate-800 rounded-b-sm relative shadow-md">
                              <div className="absolute bottom-0 w-full h-2 bg-slate-900 rounded-b-sm" />
                            </div>
                            <div className="w-1.5 h-full bg-slate-600 border-x border-slate-800 rounded-b-sm relative shadow-md">
                              <div className="absolute bottom-0 w-full h-2 bg-slate-900 rounded-b-sm" />
                            </div>
                            <div className="w-1.5 h-full bg-slate-600 border-x border-slate-800 rounded-b-sm relative shadow-md">
                              <div className="absolute bottom-0 w-full h-2 bg-slate-900 rounded-b-sm" />
                            </div>
                            
                            {/* 가로 보강대 */}
                            <div className="absolute top-1/4 inset-x-0 h-1.5 bg-slate-700 border-y border-slate-850" />
                            <div className="absolute top-2/4 inset-x-0 h-1.5 bg-slate-700 border-y border-slate-850" />
                            <div className="absolute top-3/4 inset-x-0 h-1.5 bg-slate-700 border-y border-slate-850" />
                          </div>
                        </div>
                      </div>
                      
                      {/* 게이트 상태 표시 텍스트 */}
                      <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 font-bold bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800 mt-2">
                        <span>🏰 던전 폐쇄 진행도: <span className="text-rose-400 font-black">{Math.floor(timeState.gateProgress)}%</span></span>
                        <span>⏰ 24:00 자동 완전 폐쇄 (오전 08:00 오픈)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 돌발 퀘스트 섹션 (심부름) */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl transition-all duration-300">
              <div 
                onClick={() => setIsFlashQuestsCollapsed(!isFlashQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-slate-850"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'flash').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    ⚡ 돌발 퀘스트 섹션 (심부름 / 미션)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-bold">
                  <span>{isFlashQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isFlashQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isFlashQuestsCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                  {quests.filter(q => q.type === 'flash').length === 0 ? (
                    <div className="text-center py-12 text-slate-650 text-xs font-bold border-2 border-dashed border-slate-850/70 rounded-2xl bg-slate-950/20">
                      현재 활성화된 돌발 퀘스트가 없습니다.
                    </div>
                  ) : (
                    quests.filter(q => q.type === 'flash').map(q => (
                      <div
                        key={q.id}
                        className={`p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex justify-between items-center ${
                          q.status === 'completed' ? 'opacity-65' : ''
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-850">
                            {q.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-200 mt-1">{q.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold">
                              보상: 🪙 {q.rewardGold} G
                            </span>
                            <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-black flex items-center gap-1">
                              ⏱️ {q.dueTime || '18:00'} 마감
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.status === 'completed' ? (
                            <span className="text-xs text-emerald-400 font-bold">✓ 완료됨</span>
                          ) : q.status === 'request_approval' ? (
                            <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 animate-pulse">
                              ⌛ 검수 대기중
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveNegotiateQuest(q);
                                  setNegotiateGold(q.rewardGold);
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl border border-slate-700 transition"
                              >
                                🤝 역제안
                              </button>
                              <button
                                onClick={() => handleQuestCompleteClick(q)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                              >
                                {q.category === '학습' || q.category === '독서' ? '📸 사진 인증' : '완료 체크'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 상점 탭 (상점 아이템 목록 + 현금화 정산 신청) */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🛍️ 레벨 제한 길드 상점
                </h3>
                <button
                  onClick={() => setIsPayoutOpen(true)}
                  className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition font-bold"
                >
                  🪙 현금화 정산 신청
                </button>
              </div>

              <div className="space-y-3">
                {storeItems.map(item => {
                  const isLocked = child.level < item.requiredLevel;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                        isLocked
                          ? 'bg-slate-950/40 border-slate-900 opacity-50'
                          : 'bg-slate-950 border-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                            {item.name}
                            {isLocked && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                🔒 Lv.{item.requiredLevel} 잠금
                              </span>
                            )}
                            {item.status === 'requested' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white animate-pulse">
                                결재 대기
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">{item.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-amber-400 block">{item.price} G</span>
                          {!isLocked && item.status !== 'requested' && (
                            <button
                              onClick={() => handlePurchaseItem(item)}
                              className="mt-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition"
                            >
                              구매하기
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 카메라 찰칵 사진 촬영 모사 모달 */}
      {activeCameraQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
                📸 카메라 인증 촬영
              </span>
              <h3 className="text-lg font-bold text-white">[{activeCameraQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">공부 노트 또는 독서 흔적을 카메라로 찍어 전송하세요.</p>
            </div>

            {/* 카메라 뷰 모사 구역 */}
            <div className="aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-600 relative overflow-hidden shadow-inner select-none">
              <Camera className="w-12 h-12 text-slate-700 animate-pulse mb-2" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LIVE CAMERA VIEW MOCK</span>
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-[10px] text-slate-400 font-bold border-t border-slate-900">
                [화면을 터치하거나 확인 단추를 눌러 캡쳐]
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveCameraQuest(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                취소
              </button>
              <button
                onClick={handleCameraCaptureConfirm}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                📸 사진 촬영 및 전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 밀당 골드 역제안 모달 */}
      {activeNegotiateQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🤝 퀘스트 보상 밀당(역제안)
              </span>
              <h3 className="text-md font-bold text-white">[{activeNegotiateQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">보상 금액에 대해 역제안해보세요.</p>
            </div>

            <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center font-bold text-xs">
                <span className="text-slate-400">제안 금액</span>
                <span className="text-amber-400 text-md font-black">{negotiateGold} G</span>
              </div>
              <input
                type="range"
                min={activeNegotiateQuest.rewardGold}
                max={activeNegotiateQuest.rewardGold * 2}
                step={50}
                value={negotiateGold}
                onChange={(e) => setNegotiateGold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>최소 {activeNegotiateQuest.rewardGold}G</span>
                <span>최대 {activeNegotiateQuest.rewardGold * 2}G</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveNegotiateQuest(null)}
                className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handleNegotiationSubmit}
                className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                ⚡ 역제안 협상 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 셀프 퀘스트 빌더 모달 */}
      {isSelfQuestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white">🧚‍♀️ 셀프 모험 설계 (Self-Quest)</h3>
              <button onClick={() => setIsSelfQuestOpen(false)} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
            </div>

            <form onSubmit={handleSelfQuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">스스로 만들 모험 이름</label>
                <input
                  type="text"
                  placeholder="예: 30분 동안 수학 오답 정리하기"
                  value={selfQuestTitle}
                  onChange={(e) => setSelfQuestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">목표 보상 설정 (골드)</label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={selfQuestGold}
                  onChange={(e) => setSelfQuestGold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                💡 셀프 퀘스트는 하루 최대 2개만 전송할 수 있으며, 성공 시 경험치와 골드가 동시 지급됩니다. 무의미한 도배 방지를 위해 슬롯 제한이 적용됩니다.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelfQuestOpen(false)}
                  className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  ⚡ 스스로 모험 제안
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 현금 정산 인출 모달 */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🪙 골드 현금 전환 요청
              </span>
              <h3 className="text-md font-bold text-white">실제 현금 인출</h3>
              <p className="text-xs text-slate-400 mt-1">보유한 골드를 실제 화폐(1G=1원)로 전환하여 용돈 계좌이체를 요청합니다.</p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>내 보유 골드</span>
                <span className="text-amber-400 font-black">{child.gold.toLocaleString()} G</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-900">
                <span>신청할 인출량</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-24 text-right bg-slate-900 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 font-bold"
                  />
                  <span>G</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handlePayoutSubmit}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl text-xs shadow-md"
              >
                🪙 전환 결재 올리기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 카메라 찰칵 사진 촬영 모사 모달 */}
      {activeCameraQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                📸 완료 증빙 전송
              </span>
              <h3 className="text-base font-extrabold text-white">[{activeCameraQuest.title}]</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">증빙 방식(카메라 직접 촬영 또는 스캔 파일 첨부)을 선택하세요.</p>
            </div>

            {/* 초기 상태: 모드 선택 유도 */}
            {cameraMode === 'idle' && (
              <div className="py-8 px-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3">
                <button
                  type="button"
                  onClick={() => setCameraMode('capture')}
                  className="w-full py-3 bg-indigo-600/90 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white font-black rounded-xl text-xs transition duration-200 shadow-md flex items-center justify-center gap-1.5"
                >
                  📷 실시간 카메라로 사진 촬영
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('upload');
                    setUploadedFile('study_note_scanned_0726.pdf');
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 hover:scale-105 active:scale-95 text-slate-200 font-bold rounded-xl text-xs transition duration-200 border border-slate-700/80 flex items-center justify-center gap-1.5"
                >
                  📁 스캔한 파일 불러오기 및 전송
                </button>
              </div>
            )}

            {/* 카메라 뷰 모사 구역 */}
            {cameraMode === 'capture' && (
              <div className="space-y-4">
                <div className="aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-600 relative overflow-hidden shadow-inner select-none">
                  <Camera className="w-12 h-12 text-slate-700 animate-pulse mb-2" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LIVE CAMERA VIEW MOCK</span>
                  
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-[10px] text-slate-400 font-bold border-t border-slate-900">
                    [화면을 터치하여 실시간 인증 샷 캡쳐]
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraMode('idle')}
                    className="w-1/3 py-2 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
                  >
                    이전으로
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraCaptureConfirm}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md"
                  >
                    📸 촬영 완료 및 승인 요청
                  </button>
                </div>
              </div>
            )}

            {/* 스캔 파일 업로드 구역 */}
            {cameraMode === 'upload' && (
              <div className="space-y-4">
                <div className="p-6 bg-slate-955 rounded-2xl border border-dashed border-indigo-500/30 flex flex-col items-center justify-center text-slate-400">
                  <span className="text-3xl mb-2 select-none">📄</span>
                  <span className="text-xs font-black text-slate-350">{uploadedFile}</span>
                  <span className="text-[9px] text-emerald-400 mt-1 font-bold">✓ 파일 스캔 완료 (준비됨)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraMode('idle');
                      setUploadedFile(null);
                    }}
                    className="w-1/3 py-2 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
                  >
                    다시 선택
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraCaptureConfirm}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md"
                  >
                    📁 스캔한 파일 최종 전송하기
                  </button>
                </div>
              </div>
            )}

            {cameraMode === 'idle' && (
              <button
                onClick={() => {
                  setActiveCameraQuest(null);
                  setCameraMode('idle');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 밀당 골드 역제안 모달 */}
      {activeNegotiateQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🤝 퀘스트 보상 밀당(역제안)
              </span>
              <h3 className="text-md font-bold text-white">[{activeNegotiateQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">길드마스터가 제안한 {activeNegotiateQuest.rewardGold}G 보상에 대해 역제안해보세요.</p>
            </div>

            {/* 슬라이더 제어 */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center font-bold text-xs">
                <span className="text-slate-400">제안 금액</span>
                <span className="text-amber-400 text-md font-black">{negotiateGold} G</span>
              </div>
              <input
                type="range"
                min={activeNegotiateQuest.rewardGold}
                max={activeNegotiateQuest.rewardGold * 2}
                step={50}
                value={negotiateGold}
                onChange={(e) => setNegotiateGold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>최소 {activeNegotiateQuest.rewardGold}G</span>
                <span>최대 {activeNegotiateQuest.rewardGold * 2}G</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveNegotiateQuest(null)}
                className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handleNegotiationSubmit}
                className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                ⚡ 역제안 협상 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 셀프 퀘스트 빌더 모달 */}
      {isSelfQuestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white">🧚‍♀️ 셀프 모험 설계 (Self-Quest)</h3>
              <button onClick={() => setIsSelfQuestOpen(false)} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
            </div>

            <form onSubmit={handleSelfQuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">스스로 만들 모험 이름</label>
                <input
                  type="text"
                  placeholder="예: 30분 동안 수학 오답 정리하기"
                  value={selfQuestTitle}
                  onChange={(e) => setSelfQuestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">목표 보상 설정 (골드)</label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={selfQuestGold}
                  onChange={(e) => setSelfQuestGold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                💡 셀프 퀘스트는 하루 최대 2개만 전송할 수 있으며, 성공 시 경험치와 골드가 동시 지급됩니다. 무의미한 도배 방지를 위해 슬롯 제한이 적용됩니다.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelfQuestOpen(false)}
                  className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  ⚡ 스스로 모험 제안
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 현금 정산 인출 모달 */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🪙 골드 현금 전환 요청
              </span>
              <h3 className="text-md font-bold text-white">실제 현금 인출</h3>
              <p className="text-xs text-slate-400 mt-1">보유한 골드를 실제 화폐(1G=1원)로 전환하여 용돈 계좌이체를 요청합니다.</p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>내 보유 골드</span>
                <span className="text-amber-400 font-black">{child.gold.toLocaleString()} G</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-900">
                <span>신청할 인출량</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-24 text-right bg-slate-900 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 font-bold"
                  />
                  <span>G</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handlePayoutSubmit}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl text-xs shadow-md"
              >
                🪙 전환 결재 올리기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
