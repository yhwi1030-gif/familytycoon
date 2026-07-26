import React, { useState } from 'react';

interface QuestBuilderProps {
  onAddQuest: (questData: { title: string; category: string; type: 'main' | 'flash'; rewardValue: number; dueTime?: string }) => void;
  onClose: () => void;
}

export const QuestBuilder: React.FC<QuestBuilderProps> = ({ onAddQuest, onClose }) => {
  const [type, setType] = useState<'main' | 'flash'>('main');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('학습');
  const [rewardValue, setRewardValue] = useState(20);
  const [dueTime, setDueTime] = useState('18:00'); // 기본 마감 시간 18:00 설정

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddQuest({
      title,
      category,
      type,
      rewardValue,
      dueTime: type === 'flash' ? dueTime : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-100">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white">✨ 새로운 길드 퀘스트 설계</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 퀘스트 타입 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">퀘스트 대분류</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('main'); setRewardValue(20); }}
                className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                  type === 'main'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                메인 (루틴 / EXP 전용)
              </button>
              <button
                type="button"
                onClick={() => { setType('flash'); setRewardValue(500); }}
                className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                  type === 'flash'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                돌발 (심부름 / Gold 전용)
              </button>
            </div>
          </div>

          {/* 분류 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">세부 카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
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
              placeholder="예: 강아지 몽이 산책 시키기"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 font-medium"
              required
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
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 font-bold"
                min="1"
              />
              <span className="text-sm font-bold text-indigo-400">
                {type === 'main' ? 'EXP' : 'G'}
              </span>
            </div>
          </div>

          {/* 마감 시간 입력 (돌발 퀘스트 전용 - 직접 입력 / 선택 옵션화) */}
          {type === 'flash' && (
            <div className="space-y-3.5 animate-in fade-in duration-250 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                ⏱️ 퀘스트 마감 제한 시간
              </label>
              
              {/* 직접 시간 지정 vs 빠른 분/시간 선택 토글 버튼 */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    // 프리셋 선택 -> 기본 '30분 내' 설정
                    setDueTime('30분 내');
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    !dueTime.includes(':')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⏱️ 빠른 마감시간 선택
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 직접 시각 입력 -> 기본 시각 '18:00' 설정
                    setDueTime('18:00');
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    dueTime.includes(':')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✍️ 특정 시각 직접 입력
                </button>
              </div>

              {/* 입력 모드 분기 */}
              {!dueTime.includes(':') ? (
                /* 빠른 선택 프리셋 버튼 구역 */
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
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
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
                /* 특정 시각 타임 피커 입력 구역 */
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* 가이드 추천 안내 */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px] text-slate-400">
            {type === 'main'
              ? '💡 메인 퀘스트는 매일 00:00에 리셋되며, 완료 시 캐릭터 레벨 성장 경험치만 부여됩니다.'
              : '💡 돌발 퀘스트는 완료 시 실제 화폐와 연동되는 골드(1G=1원)가 지급되며, 자녀가 역제안(밀당)을 할 수 있습니다.'}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold transition text-xs"
            >
              취소
            </button>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md"
            >
              ⚡ 퀘스트 전송 및 발행
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
