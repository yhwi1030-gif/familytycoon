import { api } from '@/lib/api';

export async function addMockNotification(
  type: 'quest_request' | 'quest_approved' | 'quest_rejected' | 'gold_request' | 'gold_approved' | 'gold_rejected' | 'self_quest_proposal' | 'item_request' | 'general',
  message: string,
  targetId?: string,
  meta?: any
) {
  return await api.addNotification({
    message,
    type,
    targetId,
    meta
  });
}

// 1. 자녀 -> 부모: 독서 퀘스트 완료 후 사진 인증 전송 요청
export async function childRequestQuestApproval(questId: string, title: string, imageUrl: string, childId?: string, childName?: string) {
  const quests = await api.getQuests();
  const idx = quests.findIndex(q => q.id === questId);
  if (idx !== -1) {
    quests[idx].status = 'request_approval';
    quests[idx].imageUrl = imageUrl;
    quests[idx].childId = childId;
    quests[idx].childName = childName;
    await api.saveQuests(quests);

    await addMockNotification(
      'quest_request',
      `🛡️ [${childName || '자녀'}] 모험가가 [${title}] 완료 승인을 요청했습니다.`,
      questId,
      { imageUrl, title, childId, childName }
    );
  }
}

// 2. 부모 -> 자녀: 퀘스트 승인 완료 (경험치/골드 배정)
export async function parentApproveQuest(questId: string, approveStatus: 'approve' | 'retry', activeChildId?: string) {
  const quests = await api.getQuests();
  const questIdx = quests.findIndex(q => q.id === questId);
  if (questIdx === -1) return;

  const quest = quests[questIdx];
  const profiles = await api.getProfiles();
  let childIdx = -1;
  if (activeChildId) {
    childIdx = profiles.findIndex(p => p.id === activeChildId);
  }
  if (childIdx === -1 && quest.childId) {
    childIdx = profiles.findIndex(p => p.id === quest.childId);
  }
  if (childIdx === -1) {
    childIdx = profiles.findIndex(p => p.role === 'child');
  }
  
  if (childIdx === -1) return;
  let child = profiles[childIdx];

  // 자녀 프로필에 stats 객체가 없거나 null일 경우 초기화하여 스탯 가산 시 런타임 크래시(TypeError) 방지
  if (!child.stats) {
    child.stats = { intelligence: 10, willpower: 10, autonomy: 10, cooperation: 10, sensibility: 10 };
  }

  // 즉시 원본 이미지 파기 트리거 작동 (Auto-Delete Trigger)
  if (quest.imageUrl) {
    const parts = quest.imageUrl.split('##');
    quest.imageUrl = `deleted##${parts[1] || ''}`;
  }

  if (approveStatus === 'approve') {
    // 퀘스트 완료 처리
    quest.status = 'completed';
    
    // 퀘스트에 지정된 경험치와 골드를 누락 없이 100% 직접 누적 가산
    if (quest.rewardExp && quest.rewardExp > 0) {
      child.exp += quest.rewardExp;
    }
    if (quest.rewardGold && quest.rewardGold > 0) {
      child.gold += quest.rewardGold;
    }

    // 스트레스(피로도) 조정: 모든 퀘스트는 노동/집중이 필요하므로 수행 완료 시 피로도가 증가합니다.
    if (quest.category === '학습') {
      child.stress = Math.min(100, child.stress + 15); // 학습은 피로도 +15
    } else if (quest.category === '독서') {
      child.stress = Math.min(100, child.stress + 5);  // 독서는 피로도 +5
    } else {
      child.stress = Math.min(100, child.stress + 10); // 심부름, 청소, 셀프 미션 등 일반/돌발 미션은 피로도 +10
    }

    // 게임 엔진 연동 스탯 보정
    if (quest.rewardStats && Object.keys(quest.rewardStats).length > 0) {
      Object.entries(quest.rewardStats).forEach(([statKey, val]) => {
        if (child.stats && statKey in child.stats) {
          (child.stats as any)[statKey] += val;
        }
      });
    } else {
      // 카테고리별 기본 보너스 스탯 설정
      if (quest.category === '독서') {
        child.stats!.intelligence += 15;
        child.stats!.willpower += 20;
      } else if (quest.category === '학습') {
        child.stats!.intelligence += 20;
        child.stats!.willpower += 15;
      } else {
        child.stats!.autonomy += 15;
        child.stats!.cooperation += 15;
      }
    }

    // 경험치 누적 레벨업 판단
    let requiredExp = child.level * 100;
    while (child.exp >= requiredExp) {
      child.exp -= requiredExp;
      child.level += 1;
      await addMockNotification('general', `🎉 ${child.name}이가 레벨 ${child.level}에 도달했습니다! 새로운 상점 물건이 해금됩니다.`, child.id, { childId: child.id });
    }

    await api.updateProfile(child);
    await addMockNotification(
      'quest_approved',
      `💚 길드마스터가 [${quest.title}] 승인을 수락하였습니다. 보상이 정상 지급되었습니다!`,
      questId,
      { childId: child.id, childName: child.name }
    );
  } else {
    // 반려 처리
    quest.status = 'active';
    child.stats!.willpower = Math.max(0, child.stats!.willpower - 5);
    child.stress = Math.min(100, child.stress + 10); // 반려 스트레스
    
    await api.updateProfile(child);
    await addMockNotification(
      'quest_rejected',
      `❌ [${quest.title}] 건이 반려되었습니다. '다시 읽기' 퀘스트가 제안되었습니다.`,
      questId,
      { childId: child.id, childName: child.name }
    );
  }

  await api.saveQuests(quests);
}

// 3. 자녀 -> 부모: 골드 실제 현금화 요청
export async function childRequestGoldPayout(amount: number, childId?: string) {
  const profiles = await api.getProfiles();
  const child = childId ? profiles.find(p => p.id === childId) : profiles.find(p => p.role === 'child');
  if (!child || child.gold < amount) return false;

  child.gold -= amount;
  await api.updateProfile(child);

  await addMockNotification(
    'gold_request',
    `💰 자녀가 실제 용돈 계좌이체 ${amount}원 전환(1G=1원)을 요청했습니다.`,
    child.id,
    { amount, childId: child.id, childName: child.name }
  );
  return true;
}

// 4. 자녀 -> 부모: 돌발 퀘스트 보상 골드 역제안 (밀당)
export async function childCounterProposeQuest(questId: string, proposedGold: number, childId?: string) {
  const quests = await api.getQuests();
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  await addMockNotification(
    'self_quest_proposal',
    `🤝 자녀가 돌발 미션 [${quest.title}]에 대한 보상 골드를 ${proposedGold}G로 역제안(밀당)해왔습니다.`,
    questId,
    { proposedGold, childId: childId || quest.childId, childName: quest.childName || (childId ? '자녀' : '') }
  );
}
