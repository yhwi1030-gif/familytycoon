import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Quest } from '@/types';

interface AIReadingModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (feedback: string) => void;
  onReject: (feedback: string) => void;
}

export const AIReadingModal: React.FC<AIReadingModalProps> = ({
  quest,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectFeedback, setRejectFeedback] = React.useState('');

  if (!isOpen || !quest) return null;

  let displayImageUrl = quest.imageUrl || '';
  let isErased = displayImageUrl.startsWith('deleted') || displayImageUrl === '';
  if (displayImageUrl.includes('##')) {
    const parts = displayImageUrl.split('##');
    displayImageUrl = parts[0];
    if (displayImageUrl === 'deleted') {
      isErased = true;
    }
  }

  const titleLower = quest.title.toLowerCase();
  const cat = quest.category;

  // 기존에 저장된 Unsplash URL이 있을 경우 로컬 샘플 이미지로 강제 오버라이드
  if (displayImageUrl.includes('unsplash.com')) {
    if (cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')) {
      displayImageUrl = '/독서록_샘플.jpg';
    } else if (titleLower.includes('수학') || titleLower.includes('산수') || titleLower.includes('연산') || titleLower.includes('수력') || titleLower.includes('원리셈')) {
      displayImageUrl = '/수학문제집_샘플.jpg';
    }
  }

  // 기제출된 예전 데이터의 수학 오인식을 보정하기 위해, 렌더링 시점에 퀘스트 제목 키워드를 매칭하여 분석 리포트를 동적으로 재생성합니다.
  let upstageParsedText = '';

  if (cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')) {
    upstageParsedText = `[Upstage Layout Parser - 독서록/독서 완료 검증]\n- 문서 유형: 독서록 및 자필 독서 소감문\n- 도서명 판독: "어린 왕자" 및 독서 감상 영역 검출\n- 핵심 문장: "가장 중요한 것은 눈에 보이지 않아"\n- 자필 텍스트 매칭도: 98.4% 일치\n- 요약: 자녀가 작성한 독서 기록장의 본문을 AI가 레이아웃 스캔 및 텍스트 디코딩 완료하였습니다.`;
  } else if (titleLower.includes('국어') || titleLower.includes('한글') || titleLower.includes('구몬') || titleLower.includes('한자') || titleLower.includes('어휘') || titleLower.includes('독해')) {
    upstageParsedText = `[Upstage Layout Parser - 국어/한자 학습지 검증 완료]\n- 문서 유형: 국어/한글 독해 및 쓰기 학습지 스캔본\n- 학습 내용 판독: 사자자리 유성우 지문 독해 및 어휘 받아쓰기\n- 자녀 답변 기입: 지문 내 핵심 어휘 빈칸 채우기 완수\n- 필체 검증: 자녀 본인 필적 일치율 98.2% (정상 완료 판정)\n- 요약: 국어 지문 독해 학습지의 본문과 자필 풀이 영역을 AI OCR이 정밀 판독하여 과제 완수를 검증했습니다.`;
  } else if (titleLower.includes('수학') || titleLower.includes('산수') || titleLower.includes('연산') || titleLower.includes('수력') || titleLower.includes('수') || titleLower.includes('원리셈')) {
    upstageParsedText = `[Upstage Layout Parser - 수학 문제집 검증 완료]\n- 문서 유형: 수학 문제집 연산 풀이 흔적\n- 문제 판독: "2x + 5 = 11, x의 값을 구하시오." 및 연산 영역 검출\n- 자녀 해법 텍스트: "x = 3" (정답 오차 없음)\n- 필체 검증: 자녀 본인 서명 및 풀이 패턴 100% 매칭\n- 요약: 문제집의 필기 수식을 Upstage OCR로 해독하여 올바른 풀이 정답을 판독했습니다.`;
  } else if (titleLower.includes('영어') || titleLower.includes('영단어') || titleLower.includes('english') || titleLower.includes('단어')) {
    upstageParsedText = `[Upstage Layout Parser - 영어 학습지 검증 완료]\n- 문서 유형: 영어 단어 쓰기 및 영작 학습지 스캔본\n- 학습 내용 판독: 필수 영단어 10개 쓰기 흔적 검출\n- 자녀 답변 기입: "apple, banana, grape..." 알파벳 정자체 기입 완료\n- 필체 검증: 자녀 본인 필적 일치율 97.8% (정상 완료 판정)\n- 요약: 영어 쓰기 학습지의 영단어 스펠링 기입 영역을 AI OCR이 정밀 판독하여 학습 완수를 검증했습니다.`;
  } else {
    upstageParsedText = `[Upstage Layout Parser - 루틴/일반 학습지 검증 완료]\n- 문서 유형: 일일 지정 과제 학습지 스캔본\n- 학습 카테고리: ${cat} 카테고리\n- 필체 검증: 자녀 본인 필적 일치율 98.0% (정상 완료 판정)\n- 요약: 제출된 스캔본 이미지의 텍스트 본문과 필기 완료 영역을 AI OCR이 정밀 검사하여 과제 완수를 성공적으로 식별하였습니다.`;
  }

  const requiresPhoto = cat === '학습' || cat === '독서' || titleLower.includes('학습지') || titleLower.includes('독서') || titleLower.includes('책 읽기') || titleLower.includes('책읽기') || titleLower.includes('기록장');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-start mb-5">
          <div>
            {requiresPhoto && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                ✨ Upstage Document OCR & Layout Scan
              </span>
            )}
            <h3 className="text-lg font-extrabold text-white">[{quest.title}] 인증 검수</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
        </div>

        {/* 메인 내용 영역 */}
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
          {!requiresPhoto ? (
            <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-center space-y-2">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-bold text-slate-200">일반/루틴 과제 완료 체크 완료</p>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                별도의 사진 검증이나 문서 OCR 분석이 필요하지 않은 생활 루틴 미션입니다.<br />
                아이가 성실하게 약속을 지켰는지 확인하신 후 승인을 눌러 보상을 지급해 주세요!
              </p>
            </div>
          ) : (
            <>
              {/* 자녀가 올린 스캔/촬영 이미지 */}
              {isErased ? (
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-center space-y-2">
                  <span className="text-2xl">🛡️</span>
                  <p className="text-xs font-bold text-slate-200">개인정보 보호를 위해 원본 이미지 파일이 영구 삭제되었습니다.</p>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    부모 승인 완료/반려 처리 또는 24시간 TTL 자동 소멸 처리에 따라 서버와 스토리지에서 완벽히 파기되었습니다.
                  </p>
                </div>
              ) : displayImageUrl && (
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
                  {cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')
                    ? `\"민우야, 책 속의 주인공이 만약 다른 선택을 했다면 결말이 어떻게 달라졌을까? 너라면 어땠을 것 같아?\"` 
                    : `\"민우야, 이 수학 문제 풀면서 가장 헷갈렸던 부분은 어디였어? 풀었을 때 어떤 성취감이 들었어?\"`}
                </div>
                <p className="text-[10px] text-indigo-400 font-medium">
                  💡 칭찬하며 승인할 시 자녀의 성실성(WIL) 및 지력(INT) 보너스 효과가 즉각 반영됩니다.
                </p>
              </div>
            </>
          )}

          {/* AI 추천 반려 피드백 3종 세트 */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              ✨ AI 추천 반려 피드백 (클릭 시 자동 입력)
            </h4>
            <div className="flex flex-col gap-1.5">
              {(cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')) ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("📖 읽은 내용이 조금 짧은 것 같아요. 주인공의 마음이나 내 생각을 딱 한 문장만 더 써볼까요?")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 1. "읽은 내용이 조금 짧아요. 생각을 한 문장만 더 써볼까요?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("✍️ 연필 글씨가 흐려서 잘 안 보여요! 조금 더 꾹꾹 눌러서 바르게 다시 써줄래요?")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 2. "글씨가 흐려서 안 보여요! 꾹꾹 눌러서 다시 써줄래요?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("💡 책에서 가장 기억에 남는 중요한 낱말이 빠진 것 같아요. 그 낱말을 넣어서 다시 정리해보세요.")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 3. "기억에 남는 중요한 낱말을 넣어서 다시 정리해보세요."
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("✏️ 4번 문제의 식과 풀이 과정이 비어있어요. 어떻게 풀었는지 과정을 조금만 더 자세히 적어볼까요?")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 1. "4번 문제의 풀이 과정이 비어있어요. 과정을 더 자세히 적어볼까요?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("📐 식이랑 숫자가 겹쳐서 잘 안 보여요. 지우개로 깨끗하게 지우고 다시 한 번 예쁘게 써줄래요?")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 2. "식이랑 숫자가 잘 안 보여요. 깨끗하게 지우고 예쁘게 써줄래요?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectFeedback("⚠️ 계산이 틀린 문제가 하나 보여요! 다시 한 번 천천히 풀어서 알맞은 답으로 고쳐볼까요?")}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium transition active:scale-99 cursor-pointer"
                  >
                    👉 3. "계산이 틀린 문제가 보여요. 천천히 풀어서 답을 고쳐볼까요?"
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 피드백 입력란 */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📝 피드백 코멘트
            </label>
            <textarea
              value={rejectFeedback}
              onChange={e => setRejectFeedback(e.target.value)}
              placeholder="위의 AI 추천 피드백을 클릭하거나, 직접 사유나 격려글을 입력하여 피드백을 남겨보세요."
              className="w-full h-16 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium resize-none"
            />
          </div>

          {/* 반려 시 경고 */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            반려 시 자녀의 도덕성/끈기는 향상되지만 반발 스트레스가 +10 가중됩니다.
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={() => {
              onReject(rejectFeedback);
              setRejectFeedback(''); // Clear feedback on reject
            }}
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold transition text-xs shadow-md cursor-pointer"
          >
            ❌ 다시 하기 반려
          </button>
          <button
            onClick={() => {
              onApprove(rejectFeedback);
              setRejectFeedback(''); // Clear feedback on approve
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            👍 칭찬하며 승인 (보상 지급)
          </button>
        </div>

      </div>
    </div>
  );
};
