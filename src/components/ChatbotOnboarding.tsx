import React, { useState } from 'react';

interface ChatbotProps {
  role: 'parent' | 'child';
  onComplete: (data: { style?: string; childClass?: string; stats?: any; title: string }) => void;
  onCancel: () => void;
}

export const ChatbotOnboarding: React.FC<ChatbotProps> = ({ role, onComplete, onCancel }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  // 1. 학부모 온보딩 질문 목록 (7문항)
  const parentQuestions = [
    {
      q: "루틴 형성 스타일: 자녀의 메인 공부 습관 루틴을 만들 때 나는?",
      options: [
        { text: "함께 대화하며 약속을 정하고 지키면 보상을 준다.", style: "lighthouse" },
        { text: "정해진 일과표대로 무조건 끝마치게 강제한다.", style: "monarch" },
        { text: "하고 싶을 때 알아서 자유롭게 하도록 지지해 준다.", style: "guardian" },
        { text: "공부하는 것 자체에 크게 간섭하거나 터치하지 않는다.", style: "hunter" }
      ]
    },
    {
      q: "약속 미이행 시 대처: 자녀가 정해진 퀘스트 약속을 지키지 않았을 때 나는?",
      options: [
        { text: "이유를 묻고 다음 약속 조율을 유도한다.", style: "lighthouse" },
        { text: "경고를 주고 정해진 불이익(벌칙)을 강제 적용한다.", style: "monarch" },
        { text: "속상하겠지만 마음을 달래주고 그냥 넘어간다.", style: "guardian" },
        { text: "알아서 스스로 반성하고 다시 할 때까지 놔둔다.", style: "hunter" }
      ]
    },
    {
      q: "용돈/보상 경제 관념: 자녀에게 용돈이나 선물을 주는 방식은?",
      options: [
        { text: "집안일/심부름 등 기여에 맞춰 규칙적으로 골드를 책정한다.", style: "lighthouse" },
        { text: "필요한 물품을 내가 판단해서 사주고, 현금은 직접 주지 않는다.", style: "monarch" },
        { text: "자녀가 원할 때마다 혹은 칭찬할 일이 있을 때 즉각 지급한다.", style: "guardian" },
        { text: "용돈은 정기적으로 주고, 그 사용처는 완전히 자율에 맡긴다.", style: "hunter" }
      ]
    },
    {
      q: "자녀의 골드 역제안 대응: 자녀가 퀘스트 보상을 올려달라고 '밀당(역제안)'할 때?",
      options: [
        { text: "타당한 근거가 있다면 협상을 통해 보상 조율에 수락한다.", style: "lighthouse" },
        { text: "길드 규칙은 절대적이다. 조율 불가능하며 거절한다.", style: "monarch" },
        { text: "귀여운 애교나 설득에 대부분 흔쾌히 수락해 준다.", style: "guardian" },
        { text: "자녀 마음대로 적절한 보상 기준을 스스로 결정하도록 한다.", style: "hunter" }
      ]
    },
    {
      q: "정서적 지지와 칭찬 방식: 자녀가 성과를 냈을 때 칭찬하는 스타일은?",
      options: [
        { text: "결과보다 끝까지 도달한 자녀의 '과정과 노력'을 칭찬한다.", style: "lighthouse" },
        { text: "결과물이나 성적 수치를 정확히 짚어주며 더 높은 목표를 독려한다.", style: "monarch" },
        { text: "사랑을 듬뿍 담은 포옹과 폭풍 칭찬 및 물질적 선물을 준다.", style: "guardian" },
        { text: "잘했군 하고 지나가며 자녀 본인의 내적 뿌듯함을 느끼도록 둔다.", style: "hunter" }
      ]
    },
    {
      q: "자녀의 셀프 모험 대응: 자녀 스스로 해보겠다며 위험하거나 힘든 도전을 하겠다고 하면?",
      options: [
        { text: "위험 요소를 최소화하도록 함께 사전 준비 후 적극 응원한다.", style: "lighthouse" },
        { text: "아직 위험하고 무리라고 생각되므로 단호히 제재한다.", style: "monarch" },
        { text: "자녀가 상처받지 않게 안전망을 모두 쳐주고 동반해 준다.", style: "guardian" },
        { text: "스스로 경험하고 부딪혀서 깨달을 수 있게 전적으로 내버려 둔다.", style: "hunter" }
      ]
    },
    {
      q: "양육의 최종 목표 가치관: 내가 원하는 내 자녀의 최종 모습은?",
      options: [
        { text: "스스로 행동을 결정하고 타인을 존중할 줄 아는 민주적 리더", style: "lighthouse" },
        { text: "어떤 힘든 환경도 이겨내는 강인한 정신력과 규율을 갖춘 엘리트", style: "monarch" },
        { text: "구김살 없이 밝고 정서적으로 편안하며 도파민이 풍부한 자유 영혼", style: "guardian" },
        { text: "험난한 세상에 스스로 독립하여 살아남는 자수성가형 생존가", style: "hunter" }
      ]
    }
  ];

  // 2. 자녀 온보딩 질문 목록 (6문항으로 전면 교체)
  const childQuestions = [
    {
      q: "모험을 떠나기 전, 아주 오래된 비밀 지도를 발견했어! 너라면 어떻게 할래? (지력 역량)",
      options: [
        { text: "지도에 적힌 글씨와 그림을 하나하나 돋보기로 보듯이 자세히 읽어본다.", class: "scholar" },
        { text: "이 지도가 진짜인지, 어디로 연결되는지 도서관에 가서 책을 찾아본다.", class: "scholar" },
        { text: "지도를 보고 가본 친구가 있는지 주변에 물어본다.", class: "bard" },
        { text: "일단 지도만 챙겨서 가장 재미있어 보이는 곳으로 출발한다.", class: "pioneer" }
      ]
    },
    {
      q: "던전 입구가 커다란 바위로 막혀 있어! 이때 나의 해결 방법은? (창의성 역량)",
      options: [
        { text: "바위를 폭파시키거나 비켜가게 할 신기한 마법 주문을 직접 만들어 본다.", class: "pioneer" },
        { text: "바위 주변을 샅샅이 뒤져서 숨겨진 스위치나 비밀 통로를 찾는다.", class: "scholar" },
        { text: "팀원들에게 각자 좋은 아이디어가 있는지 물어보고 가장 좋은 방법을 고른다.", class: "bard" },
        { text: "힘센 친구를 불러오거나 힘을 합쳐서 무작정 바위를 밀어본다.", class: "guardian" }
      ]
    },
    {
      q: "매일 아침 8시에 해야 하는 '아침 체조 퀘스트'가 있어! (실천력 역량)",
      options: [
        { text: "눈 뜨자마자 \"으랏차차!\" 하고 바로 일어나서 체조를 끝낸다.", class: "pioneer" },
        { text: "5분만 더 잘까 고민하지만, 결국 늦지 않게 일어나서 체조를 한다.", class: "scholar" },
        { text: "엄마나 친구가 깨워주면 그제야 일어나서 투덜대며 체조를 한다.", class: "guardian" },
        { text: " \"오늘만 쉴까?\" 하고 생각하다가 그냥 안 하고 다시 잔다.", class: "bard" }
      ]
    },
    {
      q: "무시무시한 드래곤을 만났어! 팀원들과 어떻게 싸울래? (협동심 역량)",
      options: [
        { text: "\"내가 앞에서 막을게, 너는 뒤에서 공격해!\" 하며 친구들과 작전을 짠다.", class: "guardian" },
        { text: "친구들이 위험하지 않게 뒤에서 마법으로 도와주거나 치료해 준다.", class: "guardian" },
        { text: "\"나만 믿어!\" 하고 멋지게 앞장서서 혼자 드래곤과 싸운다.", class: "pioneer" },
        { text: "무서워서 친구들 뒤에 숨거나, 어떻게 싸우는지 지켜본다.", class: "scholar" }
      ]
    },
    {
      q: "길가에 예쁜 꽃이 피어있고, 그 옆에 작은 새가 다리를 다쳐서 울고 있어. (공감·감성 역량)",
      options: [
        { text: "\"많이 아프지?\" 하고 새를 따뜻하게 안아주고 정성껏 치료해 준다.", class: "bard" },
        { text: "꽃을 보니 기분이 좋아져서, 꽃을 한 송이 꺾어 다친 새에게 선물한다.", class: "bard" },
        { text: "새가 왜 다쳤는지 궁금해하며 주변에 위험한 것이 있는지 살펴본다.", class: "scholar" },
        { text: "\"불쌍하다\"라고 생각하지만, 바쁜 모험 중이라 그냥 지나간다.", class: "pioneer" }
      ]
    },
    {
      q: "우리 모험팀의 마을 규칙을 정하는 날이야! 넌 어떤 규칙이 좋겠어? (책임감 역량)",
      options: [
        { text: "\"한 번 정한 규칙은 무조건 지켜야 해!\" 공평하고 엄격한 규칙을 만든다.", class: "guardian" },
        { text: "\"서로 돕고 사랑하자!\" 친구들의 마음을 이해해 주는 따뜻한 규칙을 만든다.", class: "guardian" },
        { text: "\"규칙은 필요할 때만 만들자!\" 너무 많지 않고 자유로운 규칙이 좋다.", class: "pioneer" },
        { text: "\"내가 하고 싶은 대로 할래!\" 규칙이 없는 게 가장 좋다.", class: "bard" }
      ]
    }
  ];

  const currentQuestions = role === 'parent' ? parentQuestions : childQuestions;

  const handleSelect = (idx: number) => {
    const nextAnswers = [...answers, idx];
    setAnswers(nextAnswers);

    if (nextAnswers.length === currentQuestions.length) {
      // 결과 종합
      if (role === 'parent') {
        // 스타일 빈도 계산
        const counts: any = { lighthouse: 0, monarch: 0, guardian: 0, hunter: 0 };
        nextAnswers.forEach((ansIdx, qIdx) => {
          const style = parentQuestions[qIdx].options[ansIdx].style;
          counts[style] = (counts[style] || 0) + 1;
        });

        // 최고 빈도 스타일 찾기
        let bestStyle = 'lighthouse';
        let maxCount = -1;
        Object.keys(counts).forEach(k => {
          if (counts[k] > maxCount) {
            maxCount = counts[k];
            bestStyle = k;
          }
        });

        const titles: any = {
          lighthouse: '현명한 등대형(민주적)',
          monarch: '철인 군주형(독재적)',
          guardian: '자애로운 수호자형(허용적)',
          hunter: '고독한 사냥꾼형(방임적)'
        };

        onComplete({
          style: bestStyle,
          title: titles[bestStyle]
        });
      } else {
        // 클래스 빈도 계산 (A, B, C, D 선택지의 매핑된 클래스 통계)
        const counts: any = { scholar: 0, pioneer: 0, guardian: 0, bard: 0 };
        nextAnswers.forEach((ansIdx, qIdx) => {
          const cls = childQuestions[qIdx].options[ansIdx].class;
          counts[cls] = (counts[cls] || 0) + 1;
        });

        let bestClass = 'scholar';
        let maxCount = -1;
        Object.keys(counts).forEach(k => {
          if (counts[k] > maxCount) {
            maxCount = counts[k];
            bestClass = k;
          }
        });

        const titles: any = {
          scholar: '지혜의 학자형 (INT 특화)',
          pioneer: '자율의 개척자형 (STR/CRT 특화)',
          guardian: '든든한 가디언형 (DUT/CPN 특화)',
          bard: '만능 바드형 (SEN/CPN 특화)'
        };

        // 각 역량별(A, B, C, D 선택 방식) 환산 점수를 5대 스탯에 실시간 정밀 누적 계산
        // (1번: 지력 / 2번: 창의성 / 3번: 실천력 / 4번: 협동심 / 5번: 감성 / 6번: 책임감)
        let intelligence = 10;
        let willpower = 10;
        let autonomy = 10;
        let cooperation = 10;
        let sensibility = 10;

        // Q1 (비밀지도)
        if (nextAnswers[0] === 0) { intelligence += 25; willpower += 15; }
        else if (nextAnswers[0] === 1) { intelligence += 30; willpower += 10; }
        else if (nextAnswers[0] === 2) { cooperation += 20; sensibility += 10; }
        else if (nextAnswers[0] === 3) { autonomy += 30; }

        // Q2 (바위 던전)
        if (nextAnswers[1] === 0) { autonomy += 25; sensibility += 15; }
        else if (nextAnswers[1] === 1) { intelligence += 30; willpower += 10; }
        else if (nextAnswers[1] === 2) { cooperation += 30; }
        else if (nextAnswers[1] === 3) { willpower += 20; cooperation += 10; }

        // Q3 (아침체조)
        if (nextAnswers[2] === 0) { willpower += 30; autonomy += 10; }
        else if (nextAnswers[2] === 1) { willpower += 25; intelligence += 5; }
        else if (nextAnswers[2] === 2) { cooperation += 15; }
        else if (nextAnswers[2] === 3) { autonomy -= 5; } // 패널티

        // Q4 (드래곤)
        if (nextAnswers[3] === 0) { cooperation += 30; willpower += 10; }
        else if (nextAnswers[3] === 1) { cooperation += 25; sensibility += 15; }
        else if (nextAnswers[3] === 2) { autonomy += 30; }
        else if (nextAnswers[3] === 3) { intelligence += 15; }

        // Q5 (다친새와 꽃)
        if (nextAnswers[4] === 0) { sensibility += 35; cooperation += 10; }
        else if (nextAnswers[4] === 1) { sensibility += 25; autonomy += 15; }
        else if (nextAnswers[4] === 2) { intelligence += 25; willpower += 15; }
        else if (nextAnswers[4] === 3) { willpower += 10; }

        // Q6 (마을규칙)
        if (nextAnswers[5] === 0) { willpower += 30; cooperation += 10; }
        else if (nextAnswers[5] === 1) { cooperation += 25; sensibility += 15; }
        else if (nextAnswers[5] === 2) { autonomy += 25; }
        else if (nextAnswers[5] === 3) { autonomy += 35; willpower -= 10; }

        // 최소 10 ~ 최대 100 범위 보정
        const clamp = (val: number) => Math.max(10, Math.min(100, val));

        onComplete({
          childClass: bestClass,
          title: titles[bestClass],
          stats: {
            intelligence: clamp(intelligence),
            willpower: clamp(willpower),
            autonomy: clamp(autonomy),
            cooperation: clamp(cooperation),
            sensibility: clamp(sensibility)
          }
        });
      }
    } else {
      setStep(step + 1);
    }
  };

  const progress = Math.round((step / currentQuestions.length) * 100);

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-lg">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {role === 'parent' ? '🧙‍♀️ 길드 마스터 성향 분석 챗봇' : '🧚‍♀️ 모험가 클래스 판타지 성향 진단'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'parent' ? '바움린드 양육 이론 기반 진단' : '왕실 교육 과정 연계 · 모험가 역량 진단'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
        >
          건너뛰기
        </button>
      </div>

      {/* 진척률 바 */}
      <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 대화 챗봇 영역 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-lg select-none shadow-md">
            {role === 'parent' ? '🧙‍♀️' : '🧚‍♀️'}
          </div>
          <div className="flex-1 bg-slate-800/80 rounded-2xl rounded-tl-none p-4 text-slate-100 text-sm leading-relaxed border border-slate-700/30 shadow-inner">
            <span className="font-bold text-indigo-400 block mb-1">
              {role === 'parent' ? 'AI 길드마스터' : 'AI 요정 세라'}
            </span>
            {currentQuestions[step].q}
          </div>
        </div>
      </div>

      {/* 4지선다 카드형 선택 버튼 */}
      <div className="grid grid-cols-1 gap-3">
        {currentQuestions[step].options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className="w-full text-left p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-850 hover:border-indigo-500/50 text-slate-200 hover:text-white transition duration-200 flex items-center gap-3 shadow-md group"
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-indigo-600/30 group-hover:text-indigo-400 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700 transition">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1 text-sm font-medium leading-relaxed">{opt.text}</span>
          </button>
        ))}
      </div>

      <div className="text-center mt-6 text-xs text-slate-500">
        문항 {step + 1} / {currentQuestions.length}
      </div>
    </div>
  );
};
