import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface AIReadingModalProps {
  questTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const AIReadingModal: React.FC<AIReadingModalProps> = ({
  questTitle,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              ✨ AI 독서 치트키 실시간 스캔
            </span>
            <h3 className="text-xl font-extrabold text-white">[{questTitle}] 인증 검수</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
        </div>

        {/* AI 분석 내용 */}
        <div className="space-y-4 mb-6">
          {/* 책 30초 핵심 요약 */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 자녀가 찍은 독서 노트 30초 요약
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              &quot;오늘 민우는 그리스 로마 신화의 제우스 파트를 읽었습니다. 올림포스 최고의 신인 제우스가 힘을 얻는 과정과 번개 능력을 손에 쥔 배경을 꼼꼼하게 정리하고 배운 점을 기록했습니다.&quot;
            </p>
          </div>

          {/* AI 추천 하브루타 질문 */}
          <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-900/30">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> AI 추천 하브루타 질문 (부모가 건넬 잔소리 대신 대화 질문)
            </h4>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/20 mb-2 text-xs font-semibold text-slate-300 italic">
              &quot;민우야, 제우스가 하늘에서 번개를 처음 손에 쥐고 쓸 때 어떤 기분이었을까? 만약 너라면 그 힘을 어디에 먼저 썼을 것 같아?&quot;
            </div>
            <p className="text-[11px] text-indigo-400 font-medium">
              💡 칭찬하며 승인할 시 자녀의 성실성(WIL) +20, 지력(INT) +15, 스트레스 -10 효과가 즉각 반영됩니다.
            </p>
          </div>

          {/* 반려 시 경고 */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            반려 시 자녀의 도덕성은 향상되지만 반발 스트레스가 +20 가중됩니다.
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReject}
            className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold transition text-sm shadow-md"
          >
            ❌ 다시 읽기 반려
          </button>
          <button
            onClick={onApprove}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-sm shadow-md flex items-center justify-center gap-1.5"
          >
            👍 칭찬하며 승인 (EXP 지급)
          </button>
        </div>

      </div>
    </div>
  );
};
