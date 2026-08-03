'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { parentApproveQuest, childCounterProposeQuest } from '@/lib/questController';
import { Profile, Quest, AppNotification } from '@/types';
import { RadarChart } from '@/components/RadarChart';
import { AIReadingModal } from '@/components/AIReadingModal';
import { QuestBuilder } from '@/components/QuestBuilder';
import {
  TrendingUp, Award, Zap, AlertCircle, ShoppingBag, ShieldAlert,
  Clock, Plus, Check, RefreshCw, LogOut, CheckCircle, HelpCircle, ArrowRight, ArrowLeft
} from 'lucide-react';

interface ParentDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, onLogout }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [child, setChild] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // 모달 제어 상태
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isQuestBuilderOpen, setIsQuestBuilderOpen] = useState(false);
  
  // 탭 상태 ('home' | 'quest' | 'store')
  const [activeTab, setActiveTab] = useState<'home' | 'quest' | 'store'>('home');
  
  // 다자녀 개별 확인을 위한 선택 상태
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  // 퀘스트 독려 어조 전송 상태
  const [cheeringStatus, setCheeringStatus] = useState<string | null>(null);

  // 퀘스트 컨트롤 타워 섹션 접기/펼치기 상태 제어 (기획 추가 사항)
  const [isMainQuestsCollapsed, setIsMainQuestsCollapsed] = useState(false);
  const [isFlashQuestsCollapsed, setIsFlashQuestsCollapsed] = useState(false);

  // setInterval 클로저 내부에서 최신 selectedChildId 상태값을 캡처하기 위한 Ref 참조
  const selectedChildIdRef = React.useRef<string | null>(null);
  
  // selectedChildId 변경 시마다 Ref 동기화
  useEffect(() => {
    selectedChildIdRef.current = selectedChildId;
  }, [selectedChildId]);

  const loadData = async (overrideId?: string) => {
    const pList = await api.getProfiles();
    setProfiles(pList);
    
    const children = pList.filter(p => p.role === 'child');
    if (children.length > 0) {
      // 1. overrideId 우선 -> 2. ref에 저장된 실시간 최신 선택 ID -> 3. 첫 자녀
      let activeId = overrideId || selectedChildIdRef.current;
      if (!activeId || !children.some(c => c.id === activeId)) {
        activeId = children[0].id;
      }
      
      setSelectedChildId(activeId);
      selectedChildIdRef.current = activeId;
      
      const targetChild = children.find(c => c.id === activeId);
      if (targetChild) setChild(targetChild);
    } else {
      setChild(null);
    }
    
    const qList = await api.getQuests();
    const todayStr = new Date().toDateString();
    const filteredQuests = qList.filter(q => {
      const qDate = new Date(q.createdAt || new Date()).toDateString();
      return qDate === todayStr;
    });
    setQuests(filteredQuests);
    const nList = await api.getNotifications();
    setNotifications(nList);
  };

  useEffect(() => {
    loadData();
    // 3초 간격 실시간 모의 갱신 루프 (Ref 값을 참조하므로 탭 전환 시 복원 버그가 근본 차단됩니다.)
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleQuestAction = async (q: Quest) => {
    if ((q.category === '독서' || q.category === '학습') && q.status === 'request_approval') {
      setSelectedQuest(q);
      setIsReadingModalOpen(true);
    } else {
      // 일반 승인 처리
      await parentApproveQuest(q.id, 'approve');
      await loadData();
    }
  };

  const handleAIApprove = async () => {
    if (selectedQuest) {
      await parentApproveQuest(selectedQuest.id, 'approve');
      setIsReadingModalOpen(false);
      setSelectedQuest(null);
      await loadData();
    }
  };

  const handleAIReject = async () => {
    if (selectedQuest) {
      await parentApproveQuest(selectedQuest.id, 'retry');
      setIsReadingModalOpen(false);
      setSelectedQuest(null);
      await loadData();
    }
  };

  const handleResetQuest = async (id: string) => {
    const all = await api.getQuests();
    const target = all.find(q => q.id === id);
    if (target) {
      target.status = 'active';
      target.imageUrl = undefined;
      await api.saveQuests(all);
      await loadData();
    }
  };

  // 신규 퀘스트 발행 완료 콜백
  const handleAddQuest = async (data: { title: string; category: string; type: 'main' | 'flash'; rewardValue: number; dueTime?: string; iconUrl?: string }) => {
    await api.addQuest({
      title: data.title,
      category: data.category,
      type: data.type,
      rewardType: data.type === 'main' ? 'exp' : 'gold',
      rewardExp: data.type === 'main' ? data.rewardValue : 0,
      rewardGold: data.type === 'flash' ? data.rewardValue : 0,
      dueTime: data.dueTime,
      iconUrl: data.iconUrl
    });
    // 알림 전송
    await api.addNotification({
      message: `⚡ 길드마스터가 새로운 ${data.type === 'main' ? '메인' : '돌발'} 미션 [${data.title}]을 발행했습니다!`,
      type: 'general'
    });
    await loadData();
  };

  // 독려 메시지 전송 (톤앤매너 다변화 및 5종 프리셋 무작위 선택)
  const handleCheer = async (tone: 'sweet' | 'strict' | 'funny', questTitle: string) => {
    const childName = child ? child.name.split(' ')[0] : '모험가';
    
    const messages = {
      sweet: [
        `💚 "오늘 하루도 고생 많았어! [${questTitle}] 완료하고 오늘의 20 EXP까지 싹 챙겨서 깔끔하게 마감해볼까? ❤️"`,
        `💚 "오늘 [${questTitle}] 완료하면 완벽한 하루! 엄마(아빠)가 맛있는 간장 계란밥/간식 준비해둘게 칭찬 쿠폰 대기 중!"`,
        `💚 "조금 피곤하지? 딱 10분만 집중해서 [${questTitle}] 끝내고 같이 자유시간 즐기자, ${childName} 파이팅!"`,
        `💚 "우리 ${childName}의 집중력 스킬 발동할 시간! 오늘 [${questTitle}] 퀘스트도 가볍게 클리어해줄 거라 믿어 ✨"`,
        `💚 "오늘 [${questTitle}] 완료하면 오늘의 루틴 끝! 차근차근 해내는 모습이 진짜 멋져."`
      ],
      strict: [
        `🔥 "오늘의 던전 문이 밤 12시에 닫힙니다! [${questTitle}] 완료하고 경험치 증발하기 전에 얼른 클리어해라 오버 🚀"`,
        `🔥 "할 일 미루기 스킬 금지! 지금 딱 집중해서 [${questTitle}] 풀고 쿨하게 쉬는 게 진짜 고수다."`,
        `🔥 "연속 성공 기록 깨지면 엄마(아빠)가 더 아쉬워! 지금 바로 [${questTitle}] 열고 클리어 버튼 누르자."`,
        `🔥 "약속한 [${questTitle}] 시간이다! 미루면 나중에 두 배로 힘들어진다는 거 알지? 빠르게 끝내자 🔥"`,
        `🔥 "오늘의 EXP가 [${questTitle}]에서 주인을 기다리다 울고 있다... 지금 바로 구출하러 가자!"`
      ],
      funny: [
        `🤠 "[긴급] ${questTitle}: '나를 이대로 방치할 셈인가...?' 퀘스트가 너의 손길을 기다린다 😈"`,
        `🤠 "이 메시지를 본 당신! [${questTitle}] 20 EXP를 획득할 운명입니다. 지금 바로 클릭해서 경험치를 챙기시오 🤠"`,
        `🤠 "뇌 근육 강화 운동 시간 도착! 딱 5분만 집중해서 [${questTitle}] 해결하고 쿨하게 레벨업하자 💪"`,
        `🤠 "[${questTitle}] 완료 시 '엄마(아빠)의 무한 칭찬' 패시브 스킬이 즉시 발동됩니다. 획득하시겠습니까?"`,
        `🤠 "오늘 [${questTitle}] 안 깨면 엄마(아빠)가 옆에서 춤출 예정... (경고함 🕺)"`
      ]
    };

    // 무작위로 하나의 메시지 템플릿 선택
    const pool = messages[tone];
    const chosenMessage = pool[Math.floor(Math.random() * pool.length)];
    
    await api.addNotification({
      message: chosenMessage,
      type: 'general'
    });
    
    setCheeringStatus(questTitle);
    setTimeout(() => setCheeringStatus(null), 2500);
  };

  // 상점 교환/이용권 수락 및 거절 처리
  const handleResolveNotification = async (noti: AppNotification, action: 'approve' | 'reject') => {
    const profiles = await api.getProfiles();
    const childIdx = profiles.findIndex(p => p.role === 'child');
    const child = childIdx !== -1 ? profiles[childIdx] : null;

    if (action === 'approve') {
      // 1. 승인 알림 추가
      await api.addNotification({
        message: `🎉 [승인 완료] ${noti.message.replace('요청했습니다.', '건이 최종 승인 완료되었습니다.')}`,
        type: 'general'
      });

      // 2. 상점 아이템 구매 완료 처리 및 자녀 인벤토리(가방) 추가 연동
      if (noti.type === 'item_request' && noti.targetId) {
        const storeItems = await api.getStoreItems();
        const item = storeItems.find(i => i.id === noti.targetId);
        if (item) {
          item.status = 'purchased';
          await api.updateStoreItem(item);

          if (child) {
            const currentInventory = child.inventory || [];
            child.inventory = [...currentInventory, item.id];
            await api.updateProfile(child);
          }
        }
      }
      
      // 3. 이용권 실물 사용 요청 승인 처리 (정산 알림 추가)
      if (noti.type === 'item_use_request' && noti.meta?.itemName) {
        await api.addNotification({
          message: `🎟️ [사용 승인 완료] 자녀가 요청한 [${noti.meta.itemName}] 실물 사용이 승인 정산 완료되었습니다.`,
          type: 'general'
        });
      }
    } else {
      // 반려 처리시 아이템 구매 가능한 상태로 롤백
      if (noti.type === 'item_request' && noti.targetId) {
        const storeItems = await api.getStoreItems();
        const item = storeItems.find(i => i.id === noti.targetId);
        if (item) {
          item.status = 'available';
          await api.updateStoreItem(item);
        }
      }
      // 이용권 사용 반려 처리
      if (noti.type === 'item_use_request' && noti.meta?.itemName) {
        await api.addNotification({
          message: `⚠️ [사용 반려] 자녀의 [${noti.meta.itemName}] 사용이 반려되었습니다. (아이템 복구 필요시 자녀 인벤토리에 환원)`,
          type: 'general'
        });
        
        // 아이템 소모 롤백 처리
        if (child && noti.meta?.itemId) {
          const currentInventory = child.inventory || [];
          child.inventory = [...currentInventory, noti.meta.itemId];
          await api.updateProfile(child);
        }
      }
      // 반려 알림 추가
      await api.addNotification({
        message: `⚠️ [협상/반려] ${noti.message.replace('요청했습니다.', '건이 조정 반려/협상 보류 처리되었습니다.')}`,
        type: 'general'
      });
    }
    await api.resolveNotification(noti.id);
    await loadData();
  };

  const handleApproveSelfQuestProposal = async (q: Quest) => {
    const all = await api.getQuests();
    const target = all.find(item => item.id === q.id);
    if (target) {
      target.status = 'active';
      await api.saveQuests(all);
      
      const notis = await api.getNotifications();
      const noti = notis.find(n => n.type === 'self_quest_proposal' && n.targetId === q.id);
      if (noti) {
        await api.resolveNotification(noti.id);
      }
      
      await api.addNotification({
        message: `🛡️ [제안 수락] 자녀의 셀프 미션 [${q.title}]을 승인하여 수락하였습니다.`,
        type: 'general'
      });
      
      await loadData();
      alert(`🛡️ [제안 수락] 자녀의 셀프 미션 [${q.title}]을 승인하여 수락하였습니다.`);
    }
  };

  const handleRejectSelfQuestProposal = async (q: Quest) => {
    const all = await api.getQuests();
    const filtered = all.filter(item => item.id !== q.id);
    await api.saveQuests(filtered);
    
    const notis = await api.getNotifications();
    const noti = notis.find(n => n.type === 'self_quest_proposal' && n.targetId === q.id);
    if (noti) {
      await api.resolveNotification(noti.id);
    }

    await api.addNotification({
      message: `❌ [제안 거절] 자녀의 셀프 미션 제안을 반려하였습니다.`,
      type: 'general'
    });

    await loadData();
    alert(`❌ [제안 거절] 자녀의 셀프 미션 제안을 반려하였습니다.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans pb-16">
      
      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EBE6DD] py-3 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🧙‍♀️</div>
          <div>
            <h1 className="text-sm md:text-md font-black tracking-tight flex items-center gap-1.5 font-bw">
              <span className="bg-gradient-to-r from-[#AC52F2] to-[#E879F9] bg-clip-text text-transparent inline-block">패밀리 던전 타이쿤</span> <span className="text-indigo-600 font-bold text-[9px] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-sans">길드마스터 모드</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold">{user.name}</p>
          </div>
        </div>

        {/* 대시보드 메인 탭 전환 버튼 구역 (기획안 6페이지 준수) */}
        <nav className="flex items-center bg-slate-100 border border-slate-200 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            홈 (타이쿤 성장)
          </button>
          <button
            onClick={() => setActiveTab('quest')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quest'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            퀘스트
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'store'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            상점
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuestBuilderOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-md"
          >
            <Plus className="w-3 h-3" /> 설계
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-300 shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" /> 뒤로가기
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
        
        {/* 1. 홈 탭 (타이쿤 성장 분석 리포트 + 실시간 검수 통지) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 타이쿤 성장 리포트 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#EBE6DD] pb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-bw">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> 타이쿤 성장 리포트
                </h3>
                {/* 다자녀 선택 탭 */}
                {profiles.filter(p => p.role === 'child').length > 1 && (
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 self-stretch sm:self-auto overflow-x-auto">
                    {profiles.filter(p => p.role === 'child').map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedChildId(c.id);
                          setChild(c);
                          loadData(c.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black transition whitespace-nowrap ${
                          selectedChildId === c.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{c.avatar}</span>
                        <span>{c.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {child ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 space-y-4">
                    
                    {/* 캐릭터 표시창 배경부분 - 웹페이지 배경색 #FAF8F5 일치화 및 세로 2배, 캐릭터 2배 크기 조절 */}
                    <div className="flex items-center gap-4 bg-[#FAF8F5] py-7 px-4 h-32 rounded-2xl border border-[#EBE6DD]">
                      <div className="w-24 h-24 rounded-xl bg-white border border-[#EBE6DD] overflow-hidden flex items-center justify-center relative shrink-0 p-1 shadow-sm">
                        <img 
                          src={
                            child.childClass === 'scholar' ? '/INT.svg' :
                            child.childClass === 'pioneer' ? '/STR.svg' :
                            child.childClass === 'guardian' ? '/CRT.svg' :
                            child.childClass === 'bard' ? '/CPN.svg' :
                            '/INT.svg' // fallback
                          } 
                          alt="Class Avatar" 
                          className="w-full h-full object-contain animate-pulse" 
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800">{child.name}</h4>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{child.title || '성향 진단 미완료'}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>캐릭터 레벨 (Lv.{child.level})</span>
                        <span className="text-indigo-600 font-extrabold">{child.exp} / {child.level * 100} EXP</span>
                      </div>
                      <div className="w-full bg-[#FAF8F5] h-1.5 rounded-full overflow-hidden border border-[#EBE6DD]">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                          style={{ width: `${(child.exp / (child.level * 100)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-white/80 py-1.5 px-3.5 rounded-2xl border border-[#EBE6DD] shadow-sm">
                      <span className="text-[11px] font-bold text-slate-500">🪙 누적 보상 골드</span>
                      <span className="text-sm font-black text-amber-600">{child.gold.toLocaleString()} G</span>
                    </div>

                    <div className="space-y-1 bg-white/80 py-1.5 px-3 rounded-2xl border border-[#EBE6DD] shadow-sm">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>💥 아바타 피로도 (스트레스)</span>
                        <span className="font-bold">{child.stress} / 100</span>
                      </div>
                      <div className="w-full bg-[#FAF8F5] h-1 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-500 ${
                            child.stress >= 80 ? 'bg-red-500' : child.stress >= 50 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${child.stress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-7 flex justify-center">
                    <RadarChart stats={child.stats!} size={240} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-bold">
                  등록된 자녀 모험가가 없습니다. 프로필 화면에서 자녀를 생성하세요.
                </div>
              )}
            </div>

            {/* 실시간 퀘스트 인증 요청 센터 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-[#EBE6DD] pb-3 font-bw">
                🔔 실시간 인증 요청 센터
              </h3>
              <div className="space-y-3">
                {quests.filter(q => q.status === 'request_approval').length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold">
                    현재 자녀가 승인 대기 중인 퀘스트 요청이 없습니다.
                  </div>
                ) : (
                  quests.filter(q => q.status === 'request_approval').map(q => (
                    <div key={q.id} className="p-4 bg-white/80 border border-[#EBE6DD] rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {q.category}
                          </span>
                          {q.childName && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                              👤 {q.childName}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{q.title}</h4>
                      </div>
                      {q.type === 'self' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectSelfQuestProposal(q)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                          >
                            거절
                          </button>
                          <button
                            onClick={() => handleApproveSelfQuestProposal(q)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 flex items-center gap-1"
                          >
                            🛡️ 제안 수락
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuestAction(q)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                        >
                          {q.category === '독서' ? '✨ AI 독서 치트키' : '완료 승인'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 실시간 활동 알림창 로그 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-[#EBE6DD] pb-3 flex justify-between items-center font-bw">
                <span>알림창 히스토리 로그</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ff_notifications');
                    setNotifications([]);
                  }} 
                  className="text-[10px] text-slate-400 hover:text-slate-700 font-bold"
                >전체 비우기</button>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-[10px] font-bold">
                    기록된 활동 알림이 없습니다.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-white/85 border border-[#EBE6DD] text-[11px] text-slate-800 shadow-sm flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <span className="text-slate-400 text-[9px] block mb-0.5 font-bold">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        <p className="font-semibold leading-relaxed text-slate-700">{n.message}</p>
                      </div>
                      {n.type === 'quest_request' && n.targetId && (
                        <button
                          onClick={async () => {
                            const questsAll = await api.getQuests();
                            const targetQ = questsAll.find(q => q.id === n.targetId);
                            if (targetQ) {
                              if (targetQ.status !== 'request_approval') {
                                alert('이미 처리(완료)된 퀘스트입니다.');
                                return;
                              }
                              await handleQuestAction(targetQ);
                            } else {
                              alert('존재하지 않거나 삭제된 퀘스트입니다.');
                            }
                          }}
                          className="shrink-0 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[10px] font-black rounded-lg transition shadow-sm"
                        >
                          🔎 검수하기
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 퀘스트 탭 (퀘스트 컨트롤 타워 & 독려 전송) */}
        {activeTab === 'quest' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 상단 퀘스트 공통 헤더 */}
            <div className="flex justify-between items-center bg-white p-4 border border-[#EBE6DD] rounded-2xl shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-bw">
                  ⚔️ 퀘스트 컨트롤 타워
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">자녀의 활동 루틴과 일시적인 미션을 총괄 통제합니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm('⚠️ 정말로 모든 퀘스트(메인 및 돌발 전체)를 강제 초기화(삭제)하시겠습니까?')) {
                      await api.clearQuests();
                      await loadData();
                      alert('🧹 모든 퀘스트가 강제 초기화되었습니다.');
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 flex items-center gap-1"
                >
                  🧹 모든 퀘스트 초기화
                </button>
                <button
                  onClick={() => setIsQuestBuilderOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow active:scale-95"
                >
                  ➕ 신규 퀘스트 설계
                </button>
              </div>
            </div>

            {/* SECTION 1: 메인 퀘스트 (일일 루틴) 섹션 */}
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
                    📅 메인 퀘스트 섹션 (일일 루틴)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold">
                  <span>{isMainQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isMainQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isMainQuestsCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                  {/* 테이블 헤더 */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-slate-400 border-b border-slate-200">
                    <div className="col-span-4">활동명 (메인 루틴)</div>
                    <div className="col-span-3 text-center">리셋 / 정보</div>
                    <div className="col-span-5 text-right">퀘스트 완료 독려 메시지 전송</div>
                  </div>

                  {quests.filter(q => q.type === 'main').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold italic">
                      등록된 메인 퀘스트가 없습니다.
                    </div>
                  ) : (
                    quests.filter(q => q.type === 'main').map(q => (
                      <div key={q.id} className="p-4 bg-[#FDFBF7] border border-[#EBE6DD] rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 sm:col-span-4">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {q.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{q.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">보상: ➕ {q.rewardExp} EXP</p>
                        </div>
                        <div className="col-span-1 sm:col-span-3 text-left sm:text-center flex flex-col sm:items-center justify-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            📅 일일 루틴
                          </span>
                          {(q.status === 'completed' || q.status === 'request_approval' || q.status === 'rejected') && (
                            <button
                              onClick={() => handleResetQuest(q.id)}
                              className="text-[9px] font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-250 px-2 py-0.5 rounded-md transition duration-200 shadow-sm flex items-center justify-center gap-0.5"
                            >
                              🔄 진행중 리셋
                            </button>
                          )}
                        </div>
                        <div className="col-span-1 sm:col-span-5 flex flex-wrap gap-1.5 justify-start sm:justify-end items-center">
                          {q.status === 'completed' ? (
                            <span className="text-xs text-emerald-600 font-bold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">✓ 완료됨</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCheer('sweet', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-emerald-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                😊 다정하게
                              </button>
                              <button
                                onClick={() => handleCheer('strict', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-rose-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                🔥 단호하게
                              </button>
                              <button
                                onClick={() => handleCheer('funny', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-amber-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                🤠 유머러스
                              </button>
                              {q.status === 'request_approval' && (
                                <button
                                  onClick={() => handleQuestAction(q)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition shadow active:scale-95 ml-1"
                                >
                                  검수하기
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: 돌발 퀘스트 (심부름) 섹션 - 그린 계열 테마 */}
            <div className="bg-[#FAFDF8] border border-[#DCE8D0] rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div 
                onClick={() => setIsFlashQuestsCollapsed(!isFlashQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-[#DCE8D0]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'flash').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5 font-bw">
                    ⚡ 돌발 퀘스트 섹션 (심부름 / 미션)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 text-xs font-bold">
                  <span>{isFlashQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isFlashQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isFlashQuestsCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                  {/* 테이블 헤더 */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-emerald-800/80 border-b border-[#E2F0D8]">
                    <div className="col-span-4">활동명 (돌발 미션)</div>
                    <div className="col-span-3 text-center">퀘스트 마감시간 / 정보</div>
                    <div className="col-span-5 text-right">퀘스트 완료 독려 메시지 전송</div>
                  </div>

                  {quests.filter(q => q.type === 'flash').length === 0 ? (
                    <div className="text-center py-12 text-emerald-750 text-xs font-bold border-2 border-dashed border-[#DCE8D0] rounded-2xl bg-[#FAFDF8]">
                      현재 활성화된 돌발 퀘스트가 없습니다.
                    </div>
                  ) : (
                    quests.filter(q => q.type === 'flash').map(q => (
                      <div key={q.id} className="p-4 bg-white border border-[#E2F0D8] rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 sm:col-span-4">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {q.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{q.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">보상: 🪙 {q.rewardGold} G</p>
                        </div>
                        <div className="col-span-1 sm:col-span-3 text-left sm:text-center flex flex-col sm:items-center justify-center gap-1.5">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
                              ⏱️ {q.dueTime || '18:00'} 마감
                            </span>
                            <span className="text-[8px] text-slate-500 mt-1 font-semibold">(미수행 시 골드 소멸)</span>
                          </div>
                          {(q.status === 'completed' || q.status === 'request_approval' || q.status === 'rejected') && (
                            <button
                              onClick={() => handleResetQuest(q.id)}
                              className="text-[9px] font-bold text-rose-500 hover:text-white bg-rose-55 hover:bg-rose-600 border border-rose-250 px-2 py-0.5 rounded-md transition duration-200 shadow-sm flex items-center justify-center gap-0.5"
                            >
                              🔄 진행중 리셋
                            </button>
                          )}
                        </div>
                        <div className="col-span-1 sm:col-span-5 flex flex-wrap gap-1.5 justify-start sm:justify-end items-center">
                          {q.status === 'completed' ? (
                            <span className="text-xs text-emerald-600 font-bold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">✓ 완료됨</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCheer('sweet', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-emerald-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                😊 다정하게
                              </button>
                              <button
                                onClick={() => handleCheer('strict', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-rose-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                🔥 단호하게
                              </button>
                              <button
                                onClick={() => handleCheer('funny', q.title)}
                                className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-bold text-amber-600 rounded-lg transition border border-slate-200 flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                🤠 유머러스
                              </button>
                              {q.status === 'request_approval' && (
                                <button
                                  onClick={() => handleQuestAction(q)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition shadow active:scale-95 ml-1"
                                >
                                  검수하기
                                </button>
                              )}
                            </>
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

        {/* 3. 상점 탭 (골드 정산 & 이용권 결재 관리) */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* 대기중인 구매/이용권 심사 대기열 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-[#EBE6DD] pb-3 flex items-center gap-2 font-bw">
                ⚖️ 상점 교환 & 이용권 심사 센터
              </h3>
              <div className="space-y-3">
                {notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'item_request' || n.type === 'item_use_request')).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold border-2 border-dashed border-[#EBE6DD] rounded-2xl bg-white/30">
                    현재 대기 중인 구매 결재나 실물 이용권 사용 신청 내역이 없습니다.
                  </div>
                ) : (
                  notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'item_request' || n.type === 'item_use_request')).map(noti => (
                    <div key={noti.id} className={`p-4 border rounded-2xl space-y-3 shadow-sm ${noti.type === 'item_use_request' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-[#EBE6DD]'}`}>
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-800">{noti.message}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ${
                          noti.type === 'item_use_request' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          noti.type === 'gold_request' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {noti.type === 'item_use_request' ? '🎟️ 실물사용 요청' : noti.type === 'gold_request' ? '💰 용돈전환' : '🛍️ 구매결재'}
                        </span>
                      </div>
                      
                      {noti.meta?.proposedGold && (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] text-indigo-600 font-bold flex justify-between">
                          <span>자녀 역제안가:</span>
                          <span className="text-amber-600 font-black">{noti.meta.proposedGold} G</span>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleResolveNotification(noti, 'reject')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                        >
                          거절 / 협상
                        </button>
                        <button
                          onClick={() => handleResolveNotification(noti, 'approve')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md"
                        >
                          승인 수락
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 승인한 완료 이력 로그 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-[#EBE6DD] pb-3 flex items-center gap-2 font-bw">
                📋 승인/반려 완료 이력 로그
              </h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {notifications.filter(n => n.resolved || n.message.includes('[승인 완료]') || n.message.includes('[사용 승인 완료]') || n.message.includes('[협상/반려]') || n.message.includes('[사용 반려]')).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold italic">
                    최근 처리 완료된 이력이 없습니다.
                  </div>
                ) : (
                  notifications.filter(n => n.resolved || n.message.includes('[승인 완료]') || n.message.includes('[사용 승인 완료]') || n.message.includes('[협상/반려]') || n.message.includes('[사용 반려]')).map(noti => (
                    <div key={noti.id} className="p-3 bg-white/80 border border-[#EBE6DD] rounded-xl text-xs font-semibold leading-relaxed text-slate-700 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[9px] text-slate-400 mb-1">{new Date(noti.createdAt).toLocaleString()}</p>
                        <p>{noti.message}</p>
                      </div>
                      <span className={`text-[9px] font-black shrink-0 px-2 py-0.5 rounded ml-3 ${
                        noti.message.includes('반려') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {noti.message.includes('반려') ? '처리 반려' : '승인 완료'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* AI 독서 스캔 모달 */}
      <AIReadingModal
        quest={selectedQuest}
        isOpen={isReadingModalOpen}
        onClose={() => { setIsReadingModalOpen(false); setSelectedQuest(null); }}
        onApprove={handleAIApprove}
        onReject={handleAIReject}
      />

      {/* 퀘스트 빌더 모달 */}
      {isQuestBuilderOpen && (
        <QuestBuilder
          onAddQuest={handleAddQuest}
          onClose={() => setIsQuestBuilderOpen(false)}
        />
      )}

    </div>
  );
};
