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
  
  // 탭 상태 ('home' | 'quest' | 'store')
  const [activeTab, setActiveTab] = useState<'home' | 'quest' | 'store'>('home');
  
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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🧙‍♀️</div>
          <div>
            <h1 className="text-sm md:text-md font-black tracking-tight text-white flex items-center gap-1.5">
              패밀리 던전 타이쿤 <span className="text-indigo-400 font-bold text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">길드마스터 모드</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-semibold">{user.name}</p>
          </div>
        </div>

        {/* 대시보드 메인 탭 전환 버튼 구역 (기획안 6페이지 준수) */}
        <nav className="flex items-center bg-slate-950 border border-slate-850 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            홈 (타이쿤 성장)
          </button>
          <button
            onClick={() => setActiveTab('quest')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quest'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            퀘스트
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'store'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
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
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-750"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* 1. 홈 탭 (타이쿤 성장 분석 리포트 + 실시간 검수 통지) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 타이쿤 성장 리포트 */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-850 pb-3">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> 타이쿤 성장 리포트
              </h3>

              {child ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 space-y-4">
                    <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                      <span className="text-3xl select-none">{child.avatar}</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-100">{child.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{child.title || '성향 진단 미완료'}</p>
                      </div>
                    </div>

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

                    <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850">
                      <span className="text-xs font-bold text-slate-400">🪙 누적 보상 골드</span>
                      <span className="text-md font-black text-amber-400">{child.gold.toLocaleString()} G</span>
                    </div>

                    <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-2xl border border-slate-850/60">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>💥 아바타 피로도 (스트레스)</span>
                        <span>{child.stress} / 100</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
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

            {/* 실시간 퀘스트 인증 요청 센터 */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-850 pb-3">
                🔔 실시간 인증 요청 센터
              </h3>
              <div className="space-y-3">
                {quests.filter(q => q.status === 'request_approval').length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-bold">
                    현재 자녀가 승인 대기 중인 퀘스트 요청이 없습니다.
                  </div>
                ) : (
                  quests.filter(q => q.status === 'request_approval').map(q => (
                    <div key={q.id} className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-indigo-900/30">
                            {q.category}
                          </span>
                          {q.childName && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              👤 {q.childName}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-200 mt-1.5">{q.title}</h4>
                      </div>
                      <button
                        onClick={() => handleQuestAction(q)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                      >
                        {q.category === '독서' ? '✨ AI 독서 치트키' : '완료 승인'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 실시간 활동 알림창 로그 */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-850 pb-3 flex justify-between items-center">
                <span>알림창 히스토리 로그</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ff_notifications');
                    setNotifications([]);
                  }} 
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-bold"
                >전체 비우기</button>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850/60 text-[11px]">
                    <span className="text-slate-500 text-[9px] block mb-0.5">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    {n.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. 퀘스트 탭 (퀘스트 컨트롤 타워 & 독려 전송) */}
        {activeTab === 'quest' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  ⚔️ 퀘스트 컨트롤 타워
                </h3>
                <button
                  onClick={() => setIsQuestBuilderOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  ➕ 신규 퀘스트 설계
                </button>
              </div>

              <div className="space-y-3">
                {quests.map(q => (
                  <div key={q.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {q.category} | {q.type === 'main' ? '메인' : '돌발'}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-200 mt-1">{q.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        보상: {q.rewardType === 'exp' ? `➕ ${q.rewardExp} EXP` : `🪙 ${q.rewardGold} G`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'completed' ? (
                        <span className="text-xs text-emerald-400 font-bold">✓ 완료됨</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCheer('sweet', q.title)}
                            className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition"
                          >
                            😊 다정하게
                          </button>
                          <button
                            onClick={() => handleCheer('strict', q.title)}
                            className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition"
                          >
                            🔥 단호하게
                          </button>
                          <button
                            onClick={() => handleCheer('funny', q.title)}
                            className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition"
                          >
                            🤠 유머러스
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 상점 탭 (골드 정산 & 이용권 결재 관리) */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-6 border-b border-slate-850 pb-3">
                🪙 상점 교환 & 이용권 심사 센터
              </h3>

              <div className="space-y-3">
                {notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'item_request' || n.type === 'self_quest_proposal')).length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-bold border-2 border-dashed border-slate-850 rounded-2xl">
                    현재 대기 중인 구매 결재나 현금화 신청 내역이 없습니다.
                  </div>
                ) : (
                  notifications.filter(n => !n.resolved && (n.type === 'gold_request' || n.type === 'item_request' || n.type === 'self_quest_proposal')).map(noti => (
                    <div key={noti.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                      <p className="text-xs font-bold text-slate-200">{noti.message}</p>
                      
                      {noti.meta?.proposedGold && (
                        <div className="bg-slate-900 p-2.5 rounded-xl text-[10px] text-indigo-400 font-bold flex justify-between">
                          <span>자녀 역제안가:</span>
                          <span className="text-amber-400 font-black">{noti.meta.proposedGold} G</span>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleResolveNotification(noti, 'reject')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition"
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
          </div>
        )}

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
