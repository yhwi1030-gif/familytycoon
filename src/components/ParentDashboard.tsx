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
  Clock, Plus, Check, RefreshCw, LogOut, CheckCircle, HelpCircle, ArrowRight
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
  
  // 퀘스트 독려 어조 전송 상태
  const [cheeringStatus, setCheeringStatus] = useState<string | null>(null);

  const loadData = () => {
    const pList = api.getProfiles();
    setProfiles(pList);
    const targetChild = pList.find(p => p.role === 'child');
    if (targetChild) setChild(targetChild);
    setQuests(api.getQuests());
    setNotifications(api.getNotifications());
  };

  useEffect(() => {
    loadData();
    // 3초 간격 실시간 모의 갱신 루프
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleQuestAction = (q: Quest) => {
    if (q.category === '독서' && q.status === 'request_approval') {
      setSelectedQuest(q);
      setIsReadingModalOpen(true);
    } else {
      // 일반 승인 처리
      parentApproveQuest(q.id, 'approve');
      loadData();
    }
  };

  const handleAIApprove = () => {
    if (selectedQuest) {
      parentApproveQuest(selectedQuest.id, 'approve');
      setIsReadingModalOpen(false);
      setSelectedQuest(null);
      loadData();
    }
  };

  const handleAIReject = () => {
    if (selectedQuest) {
      parentApproveQuest(selectedQuest.id, 'retry');
      setIsReadingModalOpen(false);
      setSelectedQuest(null);
      loadData();
    }
  };

  // 신규 퀘스트 발행 완료 콜백
  const handleAddQuest = (data: { title: string; category: string; type: 'main' | 'flash'; rewardValue: number }) => {
    api.addQuest({
      title: data.title,
      category: data.category,
      type: data.type,
      rewardType: data.type === 'main' ? 'exp' : 'gold',
      rewardExp: data.type === 'main' ? data.rewardValue : 0,
      rewardGold: data.type === 'flash' ? data.rewardValue : 0
    });
    // 알림 전송
    api.addNotification({
      message: `⚡ 길드마스터가 새로운 ${data.type === 'main' ? '메인' : '돌발'} 미션 [${data.title}]을 발행했습니다!`,
      type: 'general'
    });
    loadData();
  };

  // 독려 메시지 전송
  const handleCheer = (tone: 'sweet' | 'strict' | 'funny', questTitle: string) => {
    const toneMsgs = {
      sweet: `💚 "우리 꼬마 전사님, [${questTitle}] 퀘스트 파이팅이에요! 마스터가 언제나 응원해요."`,
      strict: `🔥 "모험가 길드 율법 제1조! 지정된 [${questTitle}] 완료 시간까지 서두르세요. 시간 엄수!"`,
      funny: `🤠 "똑딱똑딱! [${questTitle}] 클리어하고 시원한 골드 획득해서 물약(간식) 사 먹으러 안 가실 건가요?"`
    };
    
    api.addNotification({
      message: toneMsgs[tone],
      type: 'general'
    });
    
    setCheeringStatus(questTitle);
    setTimeout(() => setCheeringStatus(null), 2500);
  };

  // 상점 교환/이용권 수락 및 거절 처리
  const handleResolveNotification = (noti: AppNotification, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      // 승인
      api.addNotification({
        message: `🎉 [승인 완료] ${noti.message.replace('요청했습니다.', '건이 최종 승인 완료되었습니다.')}`,
        type: 'general'
      });
    } else {
      // 반려
      api.addNotification({
        message: `⚠️ [협상/반려] ${noti.message.replace('요청했습니다.', '건이 조정 반려/협상 보류 처리되었습니다.')}`,
        type: 'general'
      });
    }
    api.resolveNotification(noti.id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🧙‍♀️</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Family Dungeon <span className="text-indigo-400 font-medium text-xs bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">Master Mode</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">{user.name} 로그인 중</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQuestBuilderOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> 퀘스트 설계
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-750"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 왼쪽 섹션 (Lg 기준 7칸): 자녀 타이쿤 리포트 및 스탯 */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* 타이쿤 성장 리포트 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-3xl rounded-full" />
            <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-850 pb-3">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> 타이쿤 성장 리포트
            </h3>

            {child ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* 수치 정보 */}
                <div className="md:col-span-5 space-y-4">
                  <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                    <span className="text-3xl select-none">{child.avatar}</span>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-100">{child.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{child.title || '성향 진단 미완료'}</p>
                    </div>
                  </div>

                  {/* 경험치 바 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>캐릭터 레벨 (Lv.{child.level})</span>
                      <span className="text-indigo-400">{child.exp} / {child.level * 100} EXP</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                        style={{ width: `${(child.exp / (child.level * 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 소지 골드 */}
                  <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      🪙 현재 누적 골드
                    </span>
                    <span className="text-md font-black text-amber-400 tracking-tight">{child.gold.toLocaleString()} G</span>
                  </div>

                  {/* 스트레스 게이지 */}
                  <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-2xl border border-slate-850/60">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        💥 아바타 피로도 (스트레스)
                      </span>
                      <span className={child.stress >= 70 ? 'text-red-400' : 'text-slate-300'}>{child.stress} / 100</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          child.stress >= 80 ? 'bg-red-500' : child.stress >= 50 ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${child.stress}%` }}
                      />
                    </div>
                    {child.stress >= 80 && (
                      <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1">
                        <ShieldAlert className="w-3 h-3" /> 아바타 일탈 임박! 퀘스트 효율 50% 반감
                      </p>
                    )}
                  </div>
                </div>

                {/* 오각형 레이더 차트 */}
                <div className="md:col-span-7 flex justify-center">
                  <RadarChart stats={child.stats!} size={220} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-bold text-sm">
                등록된 자녀 모험가가 없습니다. 프로필 화면에서 자녀를 생성하세요.
              </div>
            )}
          </div>

          {/* 퀘스트 제어 목록 (실시간 인증 요청 우선순위 정렬) */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> 실시간 완료 심사 & 퀘스트 제어
              </h3>
              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                실시간
              </span>
            </div>

            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    q.status === 'request_approval'
                      ? 'bg-indigo-950/20 border-indigo-500/40 shadow-indigo-900/10'
                      : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {q.category}
                        </span>
                        {q.status === 'request_approval' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white animate-pulse">
                            검수 대기중
                          </span>
                        )}
                        {q.status === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            완료됨
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-200">{q.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">
                        보상: {q.rewardType === 'exp' ? `➕ ${q.rewardExp} EXP` : `🪙 ${q.rewardGold} G`}
                      </p>
                    </div>

                    {/* 제어 영역 */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {q.status === 'request_approval' ? (
                        <button
                          onClick={() => handleQuestAction(q)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1"
                        >
                          ✨ {q.category === '독서' ? 'AI 독서 치트키' : '완료 승인'}
                        </button>
                      ) : q.status === 'active' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCheer('sweet', q.title)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition"
                          >
                            😊 다정하게
                          </button>
                          <button
                            onClick={() => handleCheer('strict', q.title)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition"
                          >
                            🔥 단호하게
                          </button>
                          <button
                            onClick={() => handleCheer('funny', q.title)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition"
                          >
                            🤠 유머러스
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 지급완료
                        </span>
                      )}
                    </div>
                  </div>

                  {cheeringStatus === q.title && (
                    <div className="mt-2.5 text-[10px] text-indigo-400 font-bold bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10 text-center animate-pulse">
                      🚀 자녀 계정으로 독려 알림이 전송되었습니다!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 오른쪽 섹션 (Lg 기준 5칸): 실시간 알림, 골드 전송 및 교환 정산 센터 */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* 골드 전송 & 정산 관리 센터 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-3xl rounded-full" />
            <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-850 pb-3">
              <ShoppingBag className="w-4 h-4 text-amber-400" /> 골드 정산 & 이용권 심사
            </h3>

            {/* 골드 현금화 전환 */}
            <div className="space-y-4">
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">🪙 골드 전환율</span>
                  <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">1G = 1원</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-300">
                  <span>자녀 요청 레벨 제한</span>
                  <span className="text-indigo-400">Lv.5 이상 가능</span>
                </div>
              </div>

              {/* 이용권 결재 및 골드 전송 대기 통지 격자 */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">교환/정산 대기 목록</h4>
                
                {notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'self_quest_proposal' || n.type === 'item_request')).length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs font-bold border-2 border-dashed border-slate-850 rounded-2xl">
                    대기 중인 결재/협상 내역이 없습니다.
                  </div>
                ) : (
                  notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'self_quest_proposal' || n.type === 'item_request')).map(noti => (
                    <div key={noti.id} className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-slate-200 leading-relaxed">{noti.message}</p>
                      </div>
                      
                      {noti.type === 'self_quest_proposal' && (
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-indigo-400 font-bold flex items-center justify-between">
                          <span>자녀 제시 가격:</span>
                          <span className="text-amber-400 font-black text-xs">{noti.meta?.proposedGold} G</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleResolveNotification(noti, 'reject')}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition"
                        >
                          거절 / 협상
                        </button>
                        <button
                          onClick={() => handleResolveNotification(noti, 'approve')}
                          className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md"
                        >
                          승인 수락
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 알림창 히스토리 로그 */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
            <h3 className="text-md font-bold text-white mb-6 border-b border-slate-850 pb-3 flex items-center justify-between">
              <span>🔔 알림창 히스토리 로그</span>
              <button
                onClick={() => {
                  localStorage.removeItem('ff_notifications');
                  setNotifications([]);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-bold"
              >
                전체 삭제
              </button>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs font-bold">
                  기록된 알림이 존재하지 않습니다.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850/60 text-[11px] leading-relaxed text-slate-300 font-medium">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1">
                      <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                      <span className="text-indigo-500/70 font-semibold">{n.type}</span>
                    </div>
                    {n.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

      </main>

      {/* AI 독서 스캔 모달 */}
      <AIReadingModal
        questTitle={selectedQuest?.title || ''}
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
