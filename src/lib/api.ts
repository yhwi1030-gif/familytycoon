import { Profile, Quest, StoreItem, AppNotification } from '@/types';

// 기본 초기화 mock 데이터
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'parent1',
    role: 'parent',
    name: '엄마 (길드마스터)',
    avatar: '🧙‍♀️',
    pin: '1234',
    title: '현명한 등대형',
    level: 0,
    exp: 0,
    gold: 0,
    stress: 0,
    style: 'lighthouse'
  },
  {
    id: 'parent2',
    role: 'parent',
    name: '아빠 (부길드마스터)',
    avatar: '🧙‍♂️',
    pin: '5678',
    title: '자애로운 수호자형',
    level: 0,
    exp: 0,
    gold: 0,
    stress: 0,
    style: 'guardian'
  },
  {
    id: 'child1',
    role: 'child',
    name: '민우 (꼬마 전사)',
    avatar: '🛡️',
    pin: '0000',
    title: '지혜의 학자형',
    level: 1,
    exp: 20,
    gold: 1000,
    stress: 40,
    childClass: 'scholar',
    stats: {
      intelligence: 30,
      willpower: 25,
      autonomy: 20,
      cooperation: 35,
      sensibility: 15
    },
    buffs: ['회복 탄력성 (Resilience)']
  }
];

const DEFAULT_QUESTS: Quest[] = [
  { id: 'q1', type: 'main', title: '매일 학습지 풀기', category: '학습', rewardType: 'exp', rewardExp: 20, rewardGold: 0, status: 'active', streakCount: 3 },
  { id: 'q2', type: 'main', title: '하루 30분 독서하기', category: '독서', rewardType: 'exp', rewardExp: 15, rewardGold: 0, status: 'active', streakCount: 5 },
  { id: 'q3', type: 'main', title: '학원 숙제 끝내기', category: '학습', rewardType: 'exp', rewardExp: 20, rewardGold: 0, status: 'active', streakCount: 2 },
  { id: 'q4', type: 'main', title: '기상하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'completed' },
  { id: 'q5', type: 'main', title: '이불 정리하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'completed' },
  { id: 'q6', type: 'main', title: '양치질하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'active' },
  { id: 'q7', type: 'flash', title: '우유 사오기', category: '심부름', rewardType: 'gold', rewardExp: 0, rewardGold: 500, status: 'active', dueTime: '18:30' }
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  { id: 's1', name: '[아바타] 기본 티셔츠', price: 300, requiredLevel: 1, type: 'ingame', status: 'available', description: '초반 성취감 부여를 위한 아바타 기본 꾸미기 의상' },
  { id: 's2', name: '[식품] 편의점 최애 간식 교환권', price: 400, requiredLevel: 2, type: 'coupon', status: 'available', description: '가게 부담 없는 소액 체득 단계 쿠폰' },
  { id: 's3', name: '[쿠폰] 오늘 하루 30분 늦게 자기', price: 200, requiredLevel: 1, type: 'coupon', status: 'available', description: '비재화성 생활 밀착형 보상권' },
  { id: 's4', name: '[용돈] 실제 현금 5,000원 계좌이체', price: 1200, requiredLevel: 4, type: 'real', status: 'locked', description: '본격적인 루틴 형성을 위한 금융 보상' },
  { id: 's5', name: '[패스] 주말 PC방 자유 이용 1시간', price: 600, requiredLevel: 3, type: 'coupon', status: 'locked', description: '부모 협의형 최고 인기 비재화 보상' },
  { id: 's6', name: '[패스] 오늘 하루 메인 퀘스트 면제권', price: 1500, requiredLevel: 5, type: 'coupon', status: 'locked', description: '셀프 모험 보너스를 모아야 살 수 있는 꿀맛 쿠폰' },
  { id: 's7', name: '[용돈] 실제 현금 10,000원 전환권', price: 3000, requiredLevel: 7, type: 'real', status: 'locked', description: '장기 루틴 형성을 위한 대형 보상' },
  { id: 's8', name: '[외식] 불금 가족 소원 치킨/피자 쏘기', price: 3000, requiredLevel: 6, type: 'real', status: 'locked', description: '자녀에게 가족 주도권을 부여하는 성취 단계 상품' }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

// LocalStorage key constants
const KEYS = {
  PROFILES: 'ff_profiles',
  QUESTS: 'ff_quests',
  STORE_ITEMS: 'ff_store_items',
  NOTIFICATIONS: 'ff_notifications',
  CURRENT_USER_ID: 'ff_current_user_id'
};

// 데이터 로컬 보관 초기화 도우미
const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const api = {
  // --- 프로필 관련 API ---
  getProfiles: (): Profile[] => {
    return getStored(KEYS.PROFILES, DEFAULT_PROFILES);
  },
  
  updateProfile: (profile: Profile): Profile[] => {
    const list = api.getProfiles();
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx !== -1) {
      list[idx] = profile;
      setStored(KEYS.PROFILES, list);
    }
    return list;
  },

  deleteProfile: (id: string): Profile[] => {
    const list = api.getProfiles();
    const filtered = list.filter(p => p.id !== id);
    setStored(KEYS.PROFILES, filtered);
    return filtered;
  },

  getCurrentUserId: (): string => {
    return getStored(KEYS.CURRENT_USER_ID, 'parent1');
  },

  setCurrentUserId: (id: string): void => {
    setStored(KEYS.CURRENT_USER_ID, id);
  },

  getCurrentUser: (): Profile => {
    const list = api.getProfiles();
    const id = api.getCurrentUserId();
    return list.find(p => p.id === id) || list[0];
  },

  // --- 퀘스트 관련 API ---
  getQuests: (): Quest[] => {
    return getStored(KEYS.QUESTS, DEFAULT_QUESTS);
  },

  saveQuests: (quests: Quest[]): void => {
    setStored(KEYS.QUESTS, quests);
  },

  addQuest: (quest: Omit<Quest, 'id' | 'status'>): Quest => {
    const quests = api.getQuests();
    const newQuest: Quest = {
      ...quest,
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      status: 'active'
    };
    quests.push(newQuest);
    api.saveQuests(quests);
    return newQuest;
  },

  // --- 상점 관련 API ---
  getStoreItems: (): StoreItem[] => {
    return getStored(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS);
  },

  saveStoreItems: (items: StoreItem[]): void => {
    setStored(KEYS.STORE_ITEMS, items);
  },

  updateStoreItem: (item: StoreItem): StoreItem[] => {
    const items = api.getStoreItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items[idx] = item;
      api.saveStoreItems(items);
    }
    return items;
  },

  addStoreItem: (item: Omit<StoreItem, 'id' | 'status'>): StoreItem => {
    const items = api.getStoreItems();
    const newItem: StoreItem = {
      ...item,
      id: 's_' + Math.random().toString(36).substr(2, 9),
      status: 'available'
    };
    items.push(newItem);
    api.saveStoreItems(items);
    return newItem;
  },

  // --- 알림 관련 API ---
  getNotifications: (): AppNotification[] => {
    return getStored(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  },

  addNotification: (noti: Omit<AppNotification, 'id' | 'createdAt' | 'resolved'>): AppNotification => {
    const list = api.getNotifications();
    const newNoti: AppNotification = {
      ...noti,
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      resolved: false
    };
    list.unshift(newNoti);
    setStored(KEYS.NOTIFICATIONS, list);
    return newNoti;
  },

  resolveNotification: (id: string): void => {
    const list = api.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].resolved = true;
      setStored(KEYS.NOTIFICATIONS, list);
    }
  },

  // 시스템 리셋 데모 기능
  resetToDefault: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(KEYS.PROFILES);
      localStorage.removeItem(KEYS.QUESTS);
      localStorage.removeItem(KEYS.STORE_ITEMS);
      localStorage.removeItem(KEYS.NOTIFICATIONS);
      localStorage.removeItem(KEYS.CURRENT_USER_ID);
      window.location.reload();
    }
  }
};
