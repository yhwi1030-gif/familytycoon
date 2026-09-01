import { Profile, AppNotification } from '@/types';

// 민주적(lighthouse), 독재적(monarch), 허용적(guardian), 방임적(hunter)
export function getPassiveBuffs(style?: string): string[] {
  if (!style) return [];
  switch (style) {
    case 'lighthouse':
      return ['회복 탄력성 (Resilience) - Streak 1회 보호, INT/WIL +15%'];
    case 'monarch':
      return ['강철의 복종 (Iron Obedience) - 메인완료 EXP +30%, 셀프 EXP 절반 감소'];
    case 'guardian':
      return ['자유로운 도파민 (Free Dopamine) - 돌발/럭키박스 Gold +25%, 상점요구레벨 +1'];
    case 'hunter':
      return ['고독한 생존자 (Lone Survivor) - 셀프슬롯 4개 확장, 상점 Gold가격 20% 상승'];
    default:
      return [];
  }
}

// 스트레스 수치별 상태 및 이펙트 정보
export function getStressStatus(stress: number): { title: string; color: string; desc: string; efficiency: number } {
  if (stress >= 90) {
    return { title: '아바타 일탈 상태 (폭발)', color: 'text-red-500 bg-red-500/10 border-red-500/30', desc: '⚠️ 스트레스 포화! 퀘스트 골드/경험치 효율 50%로 대폭 감소!', efficiency: 0.5 };
  } else if (stress >= 70) {
    return { title: '경고 상태 (스트레스 고조)', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', desc: '🚨 피로 누적. 스트레스 완화를 위해 휴식 및 칭찬 필요!', efficiency: 0.8 };
  } else if (stress >= 40) {
    return { title: '보통 상태 (일반)', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', desc: '⚖️ 안정적인 활동량. 양육태도 실시간 버프 온전함.', efficiency: 1.0 };
  } else {
    return { title: '쾌조 상태 (컨디션 최상)', color: 'text-green-400 bg-green-400/10 border-green-400/30', desc: '✨ 스트레스 관리 최상. 주도적 모험 및 역제안 성공률 상승!', efficiency: 1.1 };
  }
}

// 퀘스트 검수 시 즉각적인 자녀 스탯/스트레스 연동 로직
export function applyQuestSuccessEffects(child: Profile, category: string): { updatedChild: Profile; logs: string[] } {
  const updatedChild = { ...child };
  if (!updatedChild.stats) {
    updatedChild.stats = { intelligence: 10, willpower: 10, autonomy: 10, cooperation: 10, sensibility: 10 };
  }
  const stats = { ...updatedChild.stats };
  const logs: string[] = [];

  // 기본 스탯 변동
  if (category === '독서') {
    stats.intelligence += 15;
    stats.willpower += 20;
    updatedChild.stress = Math.max(0, updatedChild.stress - 10);
    logs.push('지력(INT) +15, 성실성(WIL) +20, 스트레스 -10');
  } else if (category === '학습') {
    stats.intelligence += 20;
    stats.willpower += 15;
    updatedChild.stress = Math.min(100, updatedChild.stress + 10); // 학습 피로
    logs.push('지력(INT) +20, 성실성(WIL) +15, 스트레스 +10');
  } else if (category === '심부름' || category === '청소' || category === '반려동물') {
    stats.autonomy += 15;
    stats.cooperation += 15;
    updatedChild.stress = Math.max(0, updatedChild.stress - 15);
    logs.push('주도성(AUT) +15, 협동심(COP) +15, 스트레스 -15');
  } else {
    stats.sensibility += 10;
    logs.push('감성(SEN) +10');
  }

  // 레벨업 계산
  let requiredExp = updatedChild.level * 100;
  while (updatedChild.exp >= requiredExp) {
    updatedChild.exp -= requiredExp;
    updatedChild.level += 1;
    logs.push(`🎉 LEVEL UP! 레벨 ${updatedChild.level} 달성!`);
    requiredExp = updatedChild.level * 100;
  }

  updatedChild.stats = stats;
  return { updatedChild, logs };
}

export interface QuestBalancingAnalysis {
  isExcessive: boolean;
  standardGold: number;
  difficultyGrade: '루틴/가벼움' | '보통/집중' | '고난이도/도전';
  feedback: string;
  suggestedGold: number;
  suggestedDetailedTitle: string;
  suggestedSubTask: string;
  parentTemplates: Array<{
    type: '보상 조율형' | '미션 보강형' | '성장 격려형';
    title: string;
    adjustedGold: number;
    adjustedTitle: string;
    message: string;
  }>;
}

/**
 * AI 퀘스트 밸런싱 가이드라인 엔진
 * 난이도 대비 보상이 과도할 경우 AI가 보상 조율이나 세부 미션 추가를 먼저 제안하고,
 * 부모에게 감정적 거절 대신 합리적인 '추천 수정 제안 문구' 템플릿을 제공합니다.
 */
export function analyzeQuestBalancing(title: string, proposedGold: number, category?: string): QuestBalancingAnalysis {
  const t = (title || '').toLowerCase();
  
  // 1. 난이도 및 표준 권장 보상 산정
  let difficultyGrade: '루틴/가벼움' | '보통/집중' | '고난이도/도전' = '보통/집중';
  let standardGold = 200;
  let suggestedSubTask = '';
  
  if (t.includes('기상') || t.includes('양치') || t.includes('물 마시기') || t.includes('인사') || t.includes('신발') || t.includes('비타민') || t.includes('손 씻기') || t.includes('식사')) {
    difficultyGrade = '루틴/가벼움';
    standardGold = 100;
    suggestedSubTask = '3일 연속 규칙 지키기 및 부모 확인 받기';
  } else if (t.includes('수학') || t.includes('영어') || t.includes('오답') || t.includes('단어') || t.includes('독서') || t.includes('시험') || t.includes('코딩') || t.includes('1시간') || t.includes('문제집') || t.includes('학습지')) {
    difficultyGrade = '고난이도/도전';
    standardGold = 350;
    suggestedSubTask = '핵심 풀이과정 2문제 자필 정리 및 인증샷 첨부';
  } else if (t.includes('줄넘기') || t.includes('운동') || t.includes('달리기') || t.includes('스트레칭')) {
    difficultyGrade = '보통/집중';
    standardGold = 250;
    suggestedSubTask = '100회 2세트 완수 후 땀방울/기록 인증샷 남기기';
  } else if (t.includes('청소') || t.includes('정리') || t.includes('이불') || t.includes('심부름') || t.includes('설거지') || t.includes('분리수거') || t.includes('방청소')) {
    difficultyGrade = '보통/집중';
    standardGold = 200;
    suggestedSubTask = '전/후 비교 사진 촬영 및 분리수거함 비우기 포함';
  } else {
    difficultyGrade = '보통/집중';
    standardGold = 200;
    suggestedSubTask = '시작 전/후 30분 집중 루틴 및 최종 결과물 인증';
  }

  // 2. 보상 과도 여부 판정 (표준 가이드의 1.35배 초과 시 또는 400G 이상인 경우)
  const isExcessive = proposedGold > standardGold * 1.35 || (proposedGold >= 400 && difficultyGrade !== '고난이도/도전');
  
  const suggestedDetailedTitle = title.includes('(') 
    ? title 
    : `${title} (${suggestedSubTask.split(' ')[0]} ${suggestedSubTask.split(' ')[1] || ''} 추가)`;

  const midpointGold = Math.max(100, Math.round((proposedGold + standardGold) / 2 / 50) * 50);

  // 3. 부모를 위한 '추천 수정 제안 문구' 템플릿 (합리적 협상 리터러시)
  const parentTemplates = [
    {
      type: '보상 조율형' as const,
      title: '🎯 적정 보상 조율',
      adjustedGold: standardGold,
      adjustedTitle: title,
      message: `도전 의지는 정말 칭찬해! 다만 난이도를 고려해 이번엔 ${standardGold}G로 도전하고, 완벽히 성공하면 다음엔 보상을 더 올려볼까?`
    },
    {
      type: '미션 보강형' as const,
      title: '📋 세부 조건 보강',
      adjustedGold: proposedGold,
      adjustedTitle: suggestedDetailedTitle,
      message: `${proposedGold}G 보상을 받으려면 조금 더 구체적인 기준("${suggestedSubTask}")이 추가되면 좋을 것 같아! 수정해서 도전해볼까?`
    },
    {
      type: '성장 격려형' as const,
      title: '🌱 성장/협상 타협',
      adjustedGold: midpointGold,
      adjustedTitle: title,
      message: `스스로 모험을 계획한 점이 정말 멋져! 약속 시간을 정확히 지키는 조건으로 ${midpointGold}G에 멋지게 협상하자!`
    }
  ];

  return {
    isExcessive,
    standardGold,
    difficultyGrade,
    feedback: isExcessive 
      ? `⚠️ [AI 밸런싱 권고] ${difficultyGrade} 난이도 대비 제안된 보상(${proposedGold}G)이 다소 높습니다. (적정 가이드: ${standardGold}G)`
      : `✨ [AI 밸런싱 적합] ${difficultyGrade} 난이도에 알맞은 균형 잡힌 보상(${proposedGold}G)입니다.`,
    suggestedGold: standardGold,
    suggestedDetailedTitle,
    suggestedSubTask,
    parentTemplates
  };
}
