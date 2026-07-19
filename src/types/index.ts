export type Role = 'parent' | 'child';

export interface Stats {
  intelligence: number; // 지력 (INT)
  willpower: number;    // 성실성 (WIL)
  autonomy: number;     // 주도성 (AUT)
  cooperation: number;  // 협동심 (COP)
  sensibility: number;  // 감성 (SEN)
}

export type ParentingStyle = 'lighthouse' | 'monarch' | 'guardian' | 'hunter' | ''; 
// 등대형(민주), 군주형(독재), 수호자형(허용), 사냥꾼형(방임)

export type ChildClass = 'scholar' | 'pioneer' | 'guardian' | 'bard' | '';
// 학자형, 개척자형, 가디언형, 바드형

export interface Profile {
  id: string;
  role: Role;
  name: string;
  avatar: string; // 이미지/이모지
  pin: string;    // PIN 4자리
  title?: string; // 칭호
  level: number;
  exp: number;
  gold: number;
  stress: number; // 0 ~ 100
  style?: ParentingStyle; // 학부모용
  childClass?: ChildClass; // 자녀용
  stats?: Stats; // 자녀용 능력치
  buffs?: string[]; // 적용 중인 패시브 버프 목록
}

export type QuestType = 'main' | 'flash' | 'self';
export type QuestStatus = 'pending' | 'active' | 'request_approval' | 'completed' | 'rejected';

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  category: string; // 생활, 학습, 독서, 심부름, 반려동물, 청소, 기타
  rewardType: 'exp' | 'gold' | 'both';
  rewardExp: number;
  rewardGold: number;
  status: QuestStatus;
  imageUrl?: string; // 자녀 인증용 이미지 모사 URL
  dueTime?: string; // 마감 시간 (예: "16:30")
  streakCount?: number; // 연속 성공 횟수 (메인/셀프 퀘스트용)
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  requiredLevel: number;
  type: 'ingame' | 'coupon' | 'real';
  status: 'available' | 'locked' | 'purchased' | 'requested';
  description?: string;
  proposedCondition?: string; // Lv.10 제안 상점의 충족 조건 (예: '특정 성적 도달')
}

export interface AppNotification {
  id: string;
  createdAt: string;
  message: string;
  type: 'quest_request' | 'quest_approved' | 'quest_rejected' | 'gold_request' | 'gold_approved' | 'gold_rejected' | 'self_quest_proposal' | 'item_request' | 'general';
  targetId?: string; // 관련 퀘스트 ID 혹은 상점 아이템 ID
  resolved: boolean;
  meta?: any; // 추가 정보 (예: 제안 가격 등)
}
