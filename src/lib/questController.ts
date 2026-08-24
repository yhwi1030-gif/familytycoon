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
export async function parentApproveQuest(questId: string, approveStatus: 'approve' | 'retry') {
  const quests = await api.getQuests();
  const questIdx = quests.findIndex(q => q.id === questId);
  if (questIdx === -1) return;

  const quest = quests[questIdx];
  const profiles = await api.getProfiles();
  const childIdx = profiles.findIndex(p => p.role === 'child');
  
  if (childIdx === -1) return;
  let child = profiles[childIdx];

  if (approveStatus === 'approve') {
    // 퀘스트 완료 처리
    quest.status = 'completed';
    
    // 게임 엔진 연동 스탯 보정
    if (quest.rewardStats && Object.keys(quest.rewardStats).length > 0) {
      if (!child.stats) {
        child.stats = { intelligence: 10, willpower: 10, autonomy: 10, cooperation: 10, sensibility: 10 };
      }
      Object.entries(quest.rewardStats).forEach(([statKey, val]) => {
        if (child.stats && statKey in child.stats) {
          (child.stats as any)[statKey] += val;
        }
      });
      if (quest.type === 'main') {
        child.stress = Math.max(0, child.stress - 5);
        child.exp += quest.rewardExp;
      } else {
        child.stress = Math.max(0, child.stress - 10);
        child.gold += quest.rewardGold;
      }
    } else {
      if (quest.category === '독서') {
        child.stats!.intelligence += 15;
        child.stats!.willpower += 20;
        child.stress = Math.max(0, child.stress - 10);
        child.exp += quest.rewardExp;
      } else if (quest.category === '학습') {
        child.stats!.intelligence += 20;
        child.stats!.willpower += 15;
        child.stress = Math.min(100, child.stress + 10);
        child.exp += quest.rewardExp;
      } else {
        // 심부름/청소 등 돌발 미션
        child.stats!.autonomy += 15;
        child.stats!.cooperation += 15;
        child.stress = Math.max(0, child.stress - 15);
        child.gold += quest.rewardGold;
      }
    }

    // 경험치 누적 레벨업 판단
    let requiredExp = child.level * 100;
    while (child.exp >= requiredExp) {
      child.exp -= requiredExp;
      child.level += 1;
      await addMockNotification('general', `🎉 민우가 레벨 ${child.level}에 도달했습니다! 새로운 상점 물건이 해금됩니다.`, child.id);
    }

    await api.updateProfile(child);
    await addMockNotification(
      'quest_approved',
      `💚 길드마스터가 [${quest.title}] 승인을 수락하였습니다. 보상이 정상 지급되었습니다!`,
      questId
    );
  } else {
    // 반려 처리
    quest.status = 'active';
    child.stats!.willpower = Math.max(0, child.stats!.willpower - 5);
    child.stress = Math.min(100, child.stress + 15); // 반려 스트레스
    
    await api.updateProfile(child);
    await addMockNotification(
      'quest_rejected',
      `❌ [${quest.title}] 건이 반려되었습니다. '다시 읽기' 퀘스트가 제안되었습니다.`,
      questId
    );
  }

  await api.saveQuests(quests);
}

// 3. 자녀 -> 부모: 골드 실제 현금화 요청
export async function childRequestGoldPayout(amount: number) {
  const profiles = await api.getProfiles();
  const child = profiles.find(p => p.role === 'child');
  if (!child || child.gold < amount) return false;

  child.gold -= amount;
  await api.updateProfile(child);

  await addMockNotification(
    'gold_request',
    `💰 자녀가 실제 용돈 계좌이체 ${amount}원 전환(1G=1원)을 요청했습니다.`,
    child.id,
    { amount }
  );
  return true;
}

// 4. 자녀 -> 부모: 돌발 퀘스트 보상 골드 역제안 (밀당)
export async function childCounterProposeQuest(questId: string, proposedGold: number) {
  const quests = await api.getQuests();
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  await addMockNotification(
    'self_quest_proposal',
    `🤝 자녀가 돌발 미션 [${quest.title}]에 대한 보상 골드를 ${proposedGold}G로 역제안(밀당)해왔습니다.`,
    questId,
    { proposedGold }
  );
}
