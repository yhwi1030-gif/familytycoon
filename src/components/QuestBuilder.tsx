import React, { useState } from 'react';
import { Trash2, Plus, Send } from 'lucide-react';
import { Stats } from '@/types';

interface QuestBuilderProps {
  onAddQuests: (quests: Array<{ title: string; category: string; type: 'main' | 'flash'; rewardValue: number; dueTime?: string; iconUrl?: string; scheduledDate?: string; rewardStats?: Partial<Stats> }>) => void;
  onClose: () => void;
}

export const QuestBuilder: React.FC<QuestBuilderProps> = ({ onAddQuests, onClose }) => {
  const [type, setType] = useState<'main' | 'flash'>('main');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('학습');
  const [rewardValue, setRewardValue] = useState(20);
  const [dueTime, setDueTime] = useState('18:00'); // 기본 마감 시간 18:00 설정
  
  // 예약 일정 타입 설정 ('today' | 'future')
  const [scheduleType, setScheduleType] = useState<'today' | 'future'>('today');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });

  // 임시 보관 퀘스트 큐 리스트
  const [tempQuests, setTempQuests] = useState<Array<{ title: string; category: string; type: 'main' | 'flash'; rewardValue: number; dueTime?: string; scheduledDate?: string; rewardStats?: Partial<Stats> }>>([]);

  // Upstage AI 이미지 생성 시뮬레이션 상태
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const getAutoStats = (titleStr: string, catStr: string) => {
    const t = titleStr.toLowerCase();
    const stats = { intelligence: 0, willpower: 0, autonomy: 0, cooperation: 0, sensibility: 0 };
    if (!t) return stats;
    
    if (catStr === '독서' || t.includes('독서') || t.includes('책') || t.includes('읽기') || t.includes('독서록')) {
      stats.intelligence = 15;
      stats.willpower = 10;
      stats.sensibility = 15;
    } else if (catStr === '학습' || t.includes('학습지') || t.includes('숙제') || t.includes('공부') || t.includes('수학') || t.includes('국어') || t.includes('영어') || t.includes('한자') || t.includes('구몬') || t.includes('문제집')) {
      stats.intelligence = 20;
      stats.willpower = 15;
    } else if (catStr === '청소' || t.includes('청소') || t.includes('정리') || t.includes('이불') || t.includes('빗자루') || t.includes('방청소') || t.includes('거실')) {
      stats.willpower = 15;
      stats.autonomy = 15;
    } else if (catStr === '심부름' || t.includes('우유') || t.includes('마트') || t.includes('편의점') || t.includes('사오기') || t.includes('심부름')) {
      stats.autonomy = 15;
      stats.cooperation = 15;
    } else if (catStr === '반려동물' || t.includes('산책') || t.includes('댕댕이') || t.includes('밥주기') || t.includes('강아지')) {
      stats.cooperation = 20;
      stats.sensibility = 15;
    } else if (catStr === '생활' || t.includes('양치') || t.includes('세수') || t.includes('기상') || t.includes('잠자기') || t.includes('이닦기')) {
      stats.willpower = 20;
      stats.autonomy = 10;
    } else {
      stats.autonomy = 10;
      stats.cooperation = 10;
    }
    return stats;
  };

  const handleAddToList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setTempQuests([
      ...tempQuests,
      {
        title,
        category,
        type,
        rewardValue,
        dueTime: type === 'flash' ? dueTime : undefined,
        scheduledDate: scheduleType === 'future' ? scheduledDate : undefined,
        rewardStats: getAutoStats(title, category)
      }
    ]);
    
    // 다음 입력 편의를 위해 제목 초기화
    setTitle('');
  };

  const handleRemoveFromList = (idx: number) => {
    setTempQuests(tempQuests.filter((_, i) => i !== idx));
  };

  const handlePublishAll = () => {
    let finalQuests = [...tempQuests];
    
    if (title.trim()) {
      finalQuests.push({
        title,
        category,
        type,
        rewardValue,
        dueTime: type === 'flash' ? dueTime : undefined,
        scheduledDate: scheduleType === 'future' ? scheduledDate : undefined,
        rewardStats: getAutoStats(title, category)
      });
    }

    if (finalQuests.length === 0) return;

    // Upstage AI 2D 로우폴리 이미지 생성 개시
    setIsGeneratingIcon(true);
    setGenerationStep(1);

    const timer1 = setTimeout(() => setGenerationStep(2), 1000);
    const timer2 = setTimeout(() => setGenerationStep(3), 2200);

    setTimeout(() => {
      // 입력 문구를 바탕으로 각 미션별 알맞은 2D 로우폴리 매칭 아이콘 자동 생성
      const processedQuests = finalQuests.map(q => {
        let finalIconUrl = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=120&auto=format&fit=crop'; // 기본 펜/스케치
        const t = q.title.toLowerCase();
        
        if (q.category === '독서' || t.includes('독서') || t.includes('책')) {
          finalIconUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop';
        } else if (q.category === '학습' || t.includes('학습지') || t.includes('숙제') || t.includes('공부')) {
          finalIconUrl = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=120&auto=format&fit=crop';
        } else if (q.category === '생활' || t.includes('양치') || t.includes('이불') || t.includes('기상')) {
          if (t.includes('양치') || t.includes('칫솔') || t.includes('이닦기')) {
            finalIconUrl = 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=120&auto=format&fit=crop';
          } else if (t.includes('이불') || t.includes('정리') || t.includes('침대')) {
            finalIconUrl = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=120&auto=format&fit=crop';
          } else {
            finalIconUrl = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=120&auto=format&fit=crop';
          }
        } else if (q.category === '심부름' || t.includes('우유') || t.includes('사오기') || t.includes('마트')) {
          finalIconUrl = 'https://images.unsplash.com/photo-1528750955906-c98b84384950?w=120&auto=format&fit=crop';
        } else if (q.category === '청소' || t.includes('빗자루') || t.includes('거실') || t.includes('청소')) {
          finalIconUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&auto=format&fit=crop';
        } else if (q.category === '반려동물' || t.includes('산책') || t.includes('사료')) {
          finalIconUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=120&auto=format&fit=crop';
        }

        return {
          ...q,
          iconUrl: finalIconUrl
        };
      });

      onAddQuests(processedQuests);
      setIsGeneratingIcon(false);
      onClose();
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-100 transition-all duration-300 ${
        tempQuests.length > 0 ? 'max-w-3xl' : 'max-w-md'
      }`}>
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✨ 새로운 길드 퀘스트 설계</span>
            {tempQuests.length > 0 && (
              <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-sans font-black">
                {tempQuests.length}개 보관중
              </span>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
        </div>

        {isGeneratingIcon ? (
          <div className="py-8 px-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-center space-y-5 relative overflow-hidden select-none">
            {/* 레이저 스캔 모션 */}
            <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-[bounce_2s_infinite] top-0" />

            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner animate-pulse">
              🎨
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white">
                {generationStep === 1 ? 'Upstage AI 이미지 생성기 분석 중...' : generationStep === 2 ? '다중 퀘스트 2D 로우폴리 아바타 아이콘 변환...' : '아이콘 벡터 렌더링 완료!'}
              </h4>
              <p className="text-[10px] text-indigo-400 mt-1 font-semibold">
                총 {tempQuests.length + (title.trim() ? 1 : 0)}개의 퀘스트 배치 인코딩 가동 중
              </p>
            </div>

            {/* 상태바 */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: generationStep === 1 ? '30%' : generationStep === 2 ? '75%' : '100%' }}
              />
            </div>

            {/* 디코더 로그 */}
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-[10px] font-mono text-left text-slate-400 space-y-1 h-24 overflow-y-auto shadow-inner">
              {generationStep >= 1 && <p className="text-indigo-400">✓ [AI] Upstage Solar Text-to-Image 파이프라인 기동</p>}
              {generationStep >= 1 && <p className="text-slate-350">✓ [AI] 다중 퀘스트 제목 키워드 분석 및 레이아웃 스캔</p>}
              {generationStep >= 2 && <p className="text-indigo-400">✓ [AI] 저사양 2D Low-Poly 아이콘 스타일 배치 인코딩</p>}
              {generationStep >= 2 && <p className="text-slate-350">✓ [AI] 개별 퀘스트 맞춤형 메쉬 구조화 렌더링</p>}
              {generationStep >= 3 && <p className="text-emerald-400">✓ [AI] 모든 퀘스트 아이콘 벡터 디코딩 및 일괄 패키징 성공!</p>}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${tempQuests.length > 0 ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'}`}>
            
            {/* 왼쪽 열: 임시 보관함 목록 (복수 퀘스트 등록 시에만 노출) */}
            {tempQuests.length > 0 && (
              <div className="md:col-span-5 space-y-3.5 border-r border-slate-800/80 pr-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    📦 발행 예정 퀘스트 큐
                  </h4>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {tempQuests.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-2xl flex justify-between items-center shadow-sm">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {q.category}
                            </span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {q.type === 'main' ? '루틴' : '돌발'}
                            </span>
                            {q.scheduledDate && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                🕒 {q.scheduledDate} 예약
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-100 mt-1 truncate">{q.title}</h5>
                          <p className="text-[9px] text-slate-500 mt-0.5">보상: {q.rewardValue}{q.type === 'main' ? 'EXP' : 'G'}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromList(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <button
                    onClick={handlePublishAll}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>🚀 {tempQuests.length}개 퀘스트 일괄 발송</span>
                  </button>
                </div>
              </div>
            )}

            {/* 오른쪽 열: 퀘스트 입력 폼 */}
            <div className={`${tempQuests.length > 0 ? 'md:col-span-7' : 'w-full'} space-y-4`}>
              <form onSubmit={(e) => { e.preventDefault(); handleAddToList(); }} className="space-y-4">
                {/* 퀘스트 타입 */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">퀘스트 대분류</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setType('main'); setRewardValue(20); }}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        type === 'main'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      메인 (루틴 / EXP)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('flash'); setRewardValue(500); }}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        type === 'flash'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      돌발 (심부름 / Gold)
                    </button>
                  </div>
                </div>

                {/* 분류 */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">세부 카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    {type === 'main' ? (
                      <>
                        <option value="생활">🏠 생활 (기상, 양치 등)</option>
                        <option value="학습">📚 학습 (학습지, 숙제 등)</option>
                        <option value="독서">📖 독서 (독서, 기록장 등)</option>
                      </>
                    ) : (
                      <>
                        <option value="심부름">🛒 심부름 (우유, 편의점)</option>
                        <option value="청소">🧹 청소 (거실, 방 청소)</option>
                        <option value="반려동물">🐶 반려동물 (산책, 사료)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 퀘스트 이름 */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">퀘스트 미션 내용</label>
                  <input
                    type="text"
                    placeholder="예: 학습지 2페이지 풀기"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium"
                    required={tempQuests.length === 0}
                  />
                </div>

                {/* 보상 */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                    보상 설정 ({type === 'main' ? '경험치 EXP' : '골드 Gold'})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={rewardValue}
                      onChange={(e) => setRewardValue(Number(e.target.value))}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-bold"
                      min="1"
                    />
                    <span className="text-xs font-bold text-indigo-400">
                      {type === 'main' ? 'EXP' : 'G'}
                    </span>
                  </div>
                </div>

                {/* Upstage Solar3 AI 자동 능력치 추천 */}
                {(() => {
                  const currentAutoStats = getAutoStats(title, category);
                  const hasAutoStats = Object.values(currentAutoStats).some(v => v > 0);
                  return (
                    <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3.5 space-y-2">
                      <span className="text-[10px] font-black text-indigo-400 flex items-center gap-1">
                        🤖 Upstage Solar3 AI 자동 스탯 배정
                      </span>
                      {hasAutoStats ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {currentAutoStats.intelligence > 0 && <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg">🎓 지력 (INT) +{currentAutoStats.intelligence}</span>}
                          {currentAutoStats.willpower > 0 && <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg">🛡️ 성실성 (WIL) +{currentAutoStats.willpower}</span>}
                          {currentAutoStats.autonomy > 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg">⚡ 주도성 (AUT) +{currentAutoStats.autonomy}</span>}
                          {currentAutoStats.cooperation > 0 && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg">🤝 협동심 (COP) +{currentAutoStats.cooperation}</span>}
                          {currentAutoStats.sensibility > 0 && <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-lg">💖 감성 (SEN) +{currentAutoStats.sensibility}</span>}
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-semibold italic">
                          퀘스트 미션 내용을 입력하면 Solar3 AI가 스탯 보너스를 실시간 분류합니다.
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* 예약 발송 설정 추가 */}
                <div className="space-y-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    📅 발송 일정 설정
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setScheduleType('today')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                        scheduleType === 'today' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚡ 오늘 즉시 발송
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('future')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                        scheduleType === 'future' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📅 미래 발송 예약
                    </button>
                  </div>

                  {scheduleType === 'future' && (
                    <input
                      type="date"
                      value={scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                  )}
                </div>

                {/* 마감 시간 입력 (돌발 퀘스트 전용) */}
                {type === 'flash' && (
                  <div className="space-y-3.5 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      ⏱️ 마감 제한 시간
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
                      <button
                        type="button"
                        onClick={() => setDueTime('30분 내')}
                        className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                          !dueTime.includes(':') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ⏱️ 빠른 마감
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueTime('18:00')}
                        className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                          dueTime.includes(':') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ✍️ 직접 입력
                      </button>
                    </div>

                    {!dueTime.includes(':') ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '⚡ 30분 내', value: '30분 내' },
                          { label: '⏰ 1시간 내', value: '1시간 내' },
                          { label: '🌙 오늘 저녁', value: '오늘 저녁까지' },
                          { label: '💤 오늘 밤', value: '오늘 자정까지' }
                        ].map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setDueTime(preset.value)}
                            className={`py-1.5 rounded-xl text-[10px] font-semibold border transition ${
                              dueTime === preset.value
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500 font-bold"
                        required
                      />
                    )}
                  </div>
                )}

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-[10px] text-slate-400">
                  {type === 'main'
                    ? '💡 메인 퀘스트는 지정된 발송 예정일 00:00에 자녀 창에 나타나며, 완료 시 캐릭터 경험치가 부여됩니다.'
                    : '💡 돌발 퀘스트는 지정된 발송 예정일에 자녀 창에 나타나며 완료 시 골드가 지급됩니다.'}
                </div>

                {/* 액션 버튼 */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToList}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold transition text-xs flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>임시 리스트 추가</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishAll}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{tempQuests.length > 0 ? '전체 발행' : '즉시 단일 발행'}</span>
                  </button>
                </div>
                
                {tempQuests.length === 0 && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold transition text-[10px] text-center block"
                  >
                    닫기
                  </button>
                )}
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
