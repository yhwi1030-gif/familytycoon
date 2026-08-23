import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Quest } from '@/types';

interface AIReadingModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const AIReadingModal: React.FC<AIReadingModalProps> = ({
  quest,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  if (!isOpen || !quest) return null;

  // URL 뒤의 ## 구분자 파싱하여 Upstage 레이아웃 파서 추출물 분리
  let displayImageUrl = quest.imageUrl || '';
  let upstageParsedText = '';
  if (displayImageUrl.includes('##')) {
    const parts = displayImageUrl.split('##');
    displayImageUrl = parts[0];
    try {
      upstageParsedText = decodeURIComponent(parts[1]);
    } catch (e) {
      upstageParsedText = parts[1];
    }
  }

  const isBook = quest.category === '독서';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              ✨ Upstage Document OCR & Layout Scan
            </span>
            <h3 className="text-lg font-extrabold text-white">[{quest.title}] 인증 검수</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
        </div>

        {/* 메인 내용 영역 */}
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
          {/* 자녀가 올린 스캔/촬영 이미지 */}
          {displayImageUrl && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold mb-1.5">✓ 전송된 실시간 인증 사진/스캔본</p>
              <img 
                src={displayImageUrl} 
                alt="자녀 인증샷" 
                className="w-full max-h-96 object-contain bg-slate-950 rounded-2xl border border-slate-800 shadow-inner p-1"
              />
            </div>
          )}

          {/* Upstage OCR & Layout Parser 분석결과 카드 */}
          {upstageParsedText ? (
            <div className="bg-indigo-950/20 rounded-2xl p-4 border border-indigo-900/30">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                🤖 Upstage Layout Parser 분석 리포트
              </h4>
              <div className="text-[11px] text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                {upstageParsedText}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 자녀가 찍은 독서 노트 30초 요약
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                &quot;오늘 민우는 그리스 로마 신화의 제우스 파트를 읽었습니다. 올림포스 최고의 신인 제우스가 힘을 얻는 과정과 번개 능력을 손에 쥔 배경을 꼼꼼하게 정리하고 배운 점을 기록했습니다.&quot;
              </p>
            </div>
          )}

          {/* AI 추천 하브루타 질문 */}
          <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-900/30">
            <h4 className="text-xs font-bold text-indigo-350 uppercase tracking-wider flex items-center gap-1 mb-2">
              ❓ AI 추천 하브루타 대화 질문 (잔소리 대신 건네보세요)
            </h4>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/20 mb-2 text-xs font-semibold text-slate-300 italic">
              {isBook 
                ? `\"민우야, 책 속의 주인공이 만약 다른 선택을 했다면 결말이 어떻게 달라졌을까? 너라면 어땠을 것 같아?\"` 
                : `\"민우야, 이 수학 문제 풀면서 가장 헷갈렸던 부분은 어디였어? 풀었을 때 어떤 성취감이 들었어?\"`}
            </div>
            <p className="text-[10px] text-indigo-400 font-medium">
              💡 칭찬하며 승인할 시 자녀의 성실성(WIL) 및 지력(INT) 보너스 효과가 즉각 반영됩니다.
            </p>
          </div>

          {/* 반려 시 경고 */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            반려 시 자녀의 도덕성/끈기는 향상되지만 반발 스트레스가 +15 가중됩니다.
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onReject}
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold transition text-xs shadow-md"
          >
            ❌ 다시 하기 반려
          </button>
          <button
            onClick={onApprove}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md flex items-center justify-center gap-1.5"
          >
            👍 칭찬하며 승인 (보상 지급)
          </button>
        </div>

      </div>
    </div>
  );
};
