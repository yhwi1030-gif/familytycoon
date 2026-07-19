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

  // 2. 자녀 온보딩 질문 목록 (5문항)
  const childQuestions = [
    {
      q: "숲속에서 길을 잃었을 때, 눈앞에 낡은 표지판과 두 갈래 길이 나타났다. 당신의 선택은?",
      options: [
        { text: "가방에서 지도를 꺼내 꼼꼼하게 지형을 분석하고 계획적으로 이동한다.", class: "scholar" },
        { text: "새로운 모험이 기다리는 곳! 마음에 이끌리는 수풀 헤치고 모험의 길로 직진!", class: "pioneer" },
        { text: "부모님/친구들이 걱정할 테니 제자리에서 기다리며 구조 신호를 보낼 방안을 찾는다.", class: "guardian" },
        { text: "기분 좋게 콧노래를 부르며 주변 예쁜 나비나 꽃을 구경하면서 걷는다.", class: "bard" }
      ]
    },
    {
      q: "길드마스터(부모님)가 거실 청소라는 '돌발 돌발 퀘스트'를 줬다. 내 마음속 진짜 생각은?",
      options: [
        { text: "청소를 빠르게 수행하고, 보상 경험치를 획득해서 얼른 레벨을 올릴 생각을 한다.", class: "scholar" },
        { text: "심부름을 더 쉽고 스마트하게 끝낼 아이디어를 궁리하며 용돈 추가 제안을 준비한다.", class: "pioneer" },
        { text: "부모님의 집안일 피로를 조금이라도 덜어드리는 든든한 방패 역할을 했다고 뿌듯해한다.", class: "guardian" },
        { text: "청소하면서 신나는 노래를 틀고 춤을 추며 즐겁게 한 판 놀이처럼 해치운다.", class: "bard" }
      ]
    },
    {
      q: "길드 상점에 마음에 쏙 드는 '비재화 쿠폰'이나 '장비'가 나왔는데 가격이 조금 부족하다. 나는?",
      options: [
        { text: "필요한 메인 루틴 일과표를 빈틈없이 채워 오직 성실한 퀘스트 완료 경험치로 승부한다.", class: "scholar" },
        { text: "스스로 더 크고 과감한 '셀프 모험' 퀘스트를 계획하여 부모님께 폭풍 역제안을 던진다.", class: "pioneer" },
        { text: "차곡차곡 아끼고 심부름 퀘스트를 열심히 도우며 저축 효율을 최대한 늘린다.", class: "guardian" },
        { text: "부모님과 대화를 나누며 다정한 딜(역제안)을 통해 미션 골드 조정을 협상해본다.", class: "bard" }
      ]
    },
    {
      q: "어려운 학교/학원 문제집을 마주했을 때 나의 극복 방식은?",
      options: [
        { text: "끝까지 스스로 이해가 갈 때까지 해설지를 읽거나 책을 파헤치며 지력을 쌓는다.", class: "scholar" },
        { text: "공부하는 순서를 나에게 딱 맞게 스스로 커스텀해서 나만의 속도로 도달한다.", class: "pioneer" },
        { text: "부모님이나 선생님에게 정중하게 여쭤보고 피드백을 수용하며 기본기를 튼튼히 다진다.", class: "guardian" },
        { text: "친구들과 함께 모여서 토론하거나, 공부를 완료했을 때의 성취감을 일기/그림으로 표현한다.", class: "bard" }
      ]
    },
    {
      q: "오늘 퀘스트를 모두 클리어한 후, 마침내 내 방에 누워 밤하늘을 볼 때 가장 기분 좋은 순간은?",
      options: [
        { text: "오늘 나의 스탯과 캐릭터가 한층 더 단단하게 레벨업했다는 논리적 만족감", class: "scholar" },
        { text: "오늘 하루 나 스스로 계획한 도전을 내 힘으로 이뤄냈다는 주도적인 자유로움", class: "pioneer" },
        { text: "오늘 나로 인해 우리 가족 길드의 평화와 행복 스탯이 올라갔다는 따뜻함", class: "guardian" },
        { text: "스트레스 없이 편안하게 내 개성과 능력을 칭찬받았다는 감성 충만한 보람", class: "bard" }
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
        // 클래스 빈도 계산
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
          scholar: '지혜의 학자형 (지력/성실성 특화)',
          pioneer: '자율의 개척자형 (주도성/창의성 특화)',
          guardian: '든든한 가디언형 (협동/도덕성 특화)',
          bard: '만능 바드형 (감성/사교성 특화)'
        };

        // 초기 스탯 책정
        const initialStats: any = {
          scholar: { intelligence: 45, willpower: 35, autonomy: 20, cooperation: 20, sensibility: 10 },
          pioneer: { intelligence: 20, willpower: 20, autonomy: 45, cooperation: 20, sensibility: 25 },
          guardian: { intelligence: 25, willpower: 30, autonomy: 15, cooperation: 45, sensibility: 15 },
          bard: { intelligence: 15, willpower: 15, autonomy: 25, cooperation: 30, sensibility: 45 }
        };

        onComplete({
          childClass: bestClass,
          title: titles[bestClass],
          stats: initialStats[bestClass]
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
            {role === 'parent' ? '바움린드 양육 이론 기반 진단' : '대한민국 교육부 핵심 역량 연계형'}
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
