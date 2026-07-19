'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { childRequestQuestApproval, childRequestGoldPayout, childCounterProposeQuest } from '@/lib/questController';
import { Profile, Quest, StoreItem, AppNotification } from '@/types';
import { getStressStatus, getPassiveBuffs } from '@/lib/gameEngine';
import {
  Award, Zap, CheckCircle2, ShieldAlert, Coins, HelpCircle,
  Camera, ShoppingBag, Plus, RefreshCw, LogOut, Sliders, ChevronRight
} from 'lucide-react';

interface PlayerDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ user, onLogout }) => {
  const [child, setChild] = useState<Profile>(user);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // 카메라 촬영 완료 인증 팝업 모사 상태
  const [activeCameraQuest, setActiveCameraQuest] = useState<Quest | null>(null);
  
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
      // 카메라 찰칵 촬영 팝업 활성화
      setActiveCameraQuest(q);
    } else {
      // 생활 퀘스트는 단클릭 즉각 인증
      childRequestQuestApproval(q.id, q.title, '');
      loadData();
      alert(`🛡️ [인증 완료] [${q.title}] 인증 요청을 길드마스터에게 전송했습니다.`);
    }
  };

  // 카메라 사진 촬영 전송 컨펌
  const handleCameraCaptureConfirm = () => {
    if (activeCameraQuest) {
      childRequestQuestApproval(
        activeCameraQuest.id,
        activeCameraQuest.title,
        'https://picsum.photos/400/300' // 모사 이미지 주소
      );
      setActiveCameraQuest(null);
      loadData();
    }
  };

  // 밀당 역제안 전송
  const handleNegotiationSubmit = () => {
    if (activeNegotiateQuest) {
      childCounterProposeQuest(activeNegotiateQuest.id, negotiateGold);
      setActiveNegotiateQuest(null);
      loadData();
      alert(`🤝 길드마스터에게 보상 조정 (${negotiateGold}G) 역제안을 올렸습니다.`);
    }
  };

  // 셀프 퀘스트 전송
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

  // 아이템 구매 요청
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

  // 실제 현금 인출 요청
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🛡️</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Family Dungeon <span className="text-emerald-400 font-medium text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Player Mode</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">{child.name} 모험가</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSelfQuestOpen(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> 셀프 모험 제안
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-750"
          >
            <LogOut className="w-3.5 h-3.5" /> 뒤로가기
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 왼쪽 영역 (7칸): 내 아바타 상태창 및 퀘스트 수행창 */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* 내 아바타 상태창 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-3xl rounded-full" />
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* 캐릭터 일러스트 및 기본정보 */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24 rounded-3xl bg-emerald-950/20 border-2 border-emerald-500/30 flex items-center justify-center text-6xl shadow-inner relative select-none">
                  🛡️
                  <span className="absolute -bottom-1.5 bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-md border border-slate-900">
                    Lv.{child.level}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-extrabold text-slate-100">{child.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{child.title || '모험가'}</p>
                </div>
              </div>

              {/* 스탯 및 버프 상태 */}
              <div className="flex-1 w-full space-y-4">
                {/* 레벨 바 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>레벨 성장 경험치</span>
                    <span className="text-emerald-400">{child.exp} / {child.level * 100} EXP</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                      style={{ width: `${(child.exp / (child.level * 100)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">🪙 보상 골드</span>
                    <span className="text-sm font-black text-amber-400">{child.gold.toLocaleString()} G</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">💥 피로도</span>
                    <span className={`text-sm font-black ${child.stress >= 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {child.stress} / 100
                    </span>
                  </div>
                </div>

                {/* 패시브 버프 목록 */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> 부모 양육태도 연동 패시브 버프
                  </h4>
                  {activeBuffs.length === 0 ? (
                    <p className="text-[10px] text-slate-600 font-bold italic">활성화된 버프가 없습니다.</p>
                  ) : (
                    activeBuffs.map((buff, i) => (
                      <div key={i} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                        🛡️ {buff}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 스트레스 피격 디버프 상황 공지 */}
            <div className={`mt-5 p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2 ${stressInfo.color}`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p>{stressInfo.title}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stressInfo.desc}</p>
              </div>
            </div>
          </div>

          {/* 오늘 수행할 퀘스트 판넬 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
            <h3 className="text-md font-bold text-white mb-6 border-b border-slate-850 pb-3 flex items-center justify-between">
              <span>⚔️ 오늘의 퀘스트 목록</span>
              <span className="text-[10px] text-slate-500 font-bold">1클릭 완료 / 3클릭 사진 인증</span>
            </h3>

            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 bg-slate-950/60 border border-slate-850 rounded-2xl hover:bg-slate-900 transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    q.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {q.category}
                      </span>
                      {q.type === 'flash' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          돌발 미션
                        </span>
                      )}
                      {q.type === 'self' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          셀프 모험
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-200">{q.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                      <span>보상: {q.rewardType === 'exp' ? `➕ ${q.rewardExp} EXP` : `🪙 ${q.rewardGold} G`}</span>
                      {q.dueTime && <span className="text-amber-500/80">⏱️ 마감시간: {q.dueTime}까지</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {q.status === 'completed' ? (
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 완료됨
                      </span>
                    ) : q.status === 'request_approval' ? (
                      <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20 animate-pulse">
                        ⌛ 승인 심사 대기 중
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {q.type === 'flash' && (
                          <button
                            onClick={() => {
                              setActiveNegotiateQuest(q);
                              setNegotiateGold(q.rewardGold);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                          >
                            🤝 골드 역제안
                          </button>
                        )}
                        <button
                          onClick={() => handleQuestCompleteClick(q)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1"
                        >
                          {q.category === '학습' || q.category === '독서' ? (
                            <>
                              <Camera className="w-3.5 h-3.5" /> 사진 인증
                            </>
                          ) : (
                            '완료 체크'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 오른쪽 영역 (5칸): 레벨락 해제 상점 및 환전 정산 신청 */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* 레벨락 해제 상점 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" /> 레벨 제한 길드 상점
              </h3>
              <button
                onClick={() => setIsPayoutOpen(true)}
                className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition font-bold"
              >
                🪙 현금 정산 요청
              </button>
            </div>

            <div className="space-y-3">
              {storeItems.map((item) => {
                const isLocked = child.level < item.requiredLevel;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      isLocked
                        ? 'bg-slate-950/40 border-slate-900 opacity-50'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
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
                            className="mt-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition shadow-md"
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

          {/* 수신된 부모 길드마스터의 훈육/독려 메시지 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
            <h3 className="text-md font-bold text-white mb-4 border-b border-slate-850 pb-3">
              💬 길드 마스터 메시지 수신함
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notifications.filter(n => n.message.includes('"')).length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs font-bold italic">
                  아직 수신된 전령 메시지가 없습니다.
                </div>
              ) : (
                notifications.filter(n => n.message.includes('"')).map((n) => (
                  <div key={n.id} className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-xs font-semibold leading-relaxed text-indigo-300">
                    <p className="text-[9px] text-indigo-400/70 mb-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                    {n.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

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
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
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
