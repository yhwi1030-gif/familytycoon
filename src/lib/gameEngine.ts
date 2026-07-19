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
