import { Profile, Quest, StoreItem, AppNotification } from '@/types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// 기본 초기화 mock 데이터 (Supabase 연결 안 되거나 데이터 리셋 시 사용)
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'parent1',
    role: 'parent',
    name: '엄마 (길드마스터)',
    avatar: '🧙‍♀️',
    pin: '1234',
    title: '현명한 등대형',
    level: 1,
    exp: 0,
    gold: 1000,
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
    level: 1,
    exp: 0,
    gold: 1000,
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
  { id: 'q1', type: 'main', title: '매일 학습지 풀기', category: '학습', rewardType: 'exp', rewardExp: 20, rewardGold: 0, status: 'active', streakCount: 3, childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q2', type: 'main', title: '하루 30분 독서하기', category: '독서', rewardType: 'exp', rewardExp: 15, rewardGold: 0, status: 'active', streakCount: 5, childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q3', type: 'main', title: '학원 숙제 끝내기', category: '학습', rewardType: 'exp', rewardExp: 20, rewardGold: 0, status: 'active', streakCount: 2, childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q4', type: 'main', title: '기상하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'completed', childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q5', type: 'main', title: '이불 정리하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'completed', childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q6', type: 'main', title: '양치질하기', category: '생활', rewardType: 'exp', rewardExp: 10, rewardGold: 0, status: 'active', childId: 'child1', childName: '민우 (꼬마 전사)' },
  { id: 'q7', type: 'flash', title: '우유 사오기', category: '심부름', rewardType: 'gold', rewardExp: 0, rewardGold: 500, status: 'active', dueTime: '18:30', childId: 'child1', childName: '민우 (꼬마 전사)' }
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  { id: 's1', name: '[아바타] 기본 티셔츠', price: 300, requiredLevel: 1, type: 'ingame', status: 'available', description: '초반 성취감 부여를 위한 아바타 기본 꾸미기 의상', imageUrl: '/tshirt.jfif' },
  { id: 's2', name: '[식품] 편의점 최애 간식 교환권', price: 400, requiredLevel: 2, type: 'coupon', status: 'available', description: '가게 부담 없는 소액 체득 단계 쿠폰', imageUrl: '/snack.jfif' },
  { id: 's3', name: '[쿠폰] 오늘 하루 30분 늦게 자기', price: 200, requiredLevel: 1, type: 'coupon', status: 'available', description: '비재화성 생활 밀착형 보상권', imageUrl: '/sleep.jfif' },
  { id: 's4', name: '[용돈] 실제 현금 5,000원 계좌이체', price: 1200, requiredLevel: 4, type: 'real', status: 'locked', description: '본격적인 루틴 형성을 위한 금융 보상', imageUrl: '/money5k.jfif' },
  { id: 's5', name: '[패스] 주말 PC방 자유 이용 1시간', price: 600, requiredLevel: 3, type: 'coupon', status: 'locked', description: '부모 협의형 최고 인기 비재화 보상', imageUrl: '/pcpass.jfif' },
  { id: 's6', name: '[패스] 오늘 하루 메인 퀘스트 면제권', price: 1500, requiredLevel: 5, type: 'coupon', status: 'locked', description: '셀프 모험 보너스를 모아야 살 수 있는 꿀맛 쿠폰', imageUrl: '/shield.jfif' },
  { id: 's7', name: '[용돈] 실제 현금 10,000원 전환권', price: 3000, requiredLevel: 7, type: 'real', status: 'locked', description: '장기 루틴 형성을 위한 대형 보상', imageUrl: '/money10k.jfif' },
  { id: 's8', name: '[외식] 불금 가족 소원 치킨/피자 쏘기', price: 3000, requiredLevel: 6, type: 'real', status: 'locked', description: '자녀에게 가족 주도권을 부여하는 성취 단계 상품', imageUrl: '/chicken.jfif' }
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

// DB 맵핑 헬퍼 함수들
const mapQuestToDB = (q: any) => ({
  id: q.id,
  type: q.type,
  title: q.title,
  category: q.category,
  reward_type: q.rewardType,
  reward_exp: q.rewardExp,
  reward_gold: q.rewardGold,
  status: q.status,
  streak_count: q.streakCount,
  child_id: q.childId,
  child_name: q.childName,
  due_time: q.dueTime,
  image_url: q.imageUrl
});

const mapQuestFromDB = (q: any): Quest => ({
  id: q.id,
  type: q.type,
  title: q.title,
  category: q.category,
  rewardType: q.reward_type || q.rewardType,
  rewardExp: q.reward_exp !== undefined ? q.reward_exp : q.rewardExp,
  rewardGold: q.reward_gold !== undefined ? q.reward_gold : q.rewardGold,
  status: q.status,
  streakCount: q.streak_count !== undefined ? q.streak_count : q.streakCount,
  childId: q.child_id || q.childId,
  childName: q.child_name || q.childName,
  dueTime: q.due_time || q.dueTime,
  imageUrl: q.image_url || q.imageUrl
});

const mapNotiToDB = (n: any) => ({
  id: n.id,
  type: n.type,
  content: n.message,
  resolved: n.resolved,
  created_at: n.createdAt,
  target_id: n.targetId,
  meta: n.meta
});

const mapNotiFromDB = (n: any): AppNotification => ({
  id: n.id,
  type: n.type,
  message: n.content || n.message || '',
  resolved: n.resolved,
  createdAt: n.created_at || n.createdAt || new Date().toISOString(),
  targetId: n.target_id || n.targetId,
  meta: n.meta
});

export const api = {
  // --- 프로필 관련 API ---
  getProfiles: async (): Promise<Profile[]> => {
    if (!isSupabaseConfigured) {
      const list = getStored(KEYS.PROFILES, DEFAULT_PROFILES);
      if (typeof window !== 'undefined') {
        const todayStr = new Date().toDateString();
        const lastResetDate = localStorage.getItem('ff_last_stress_reset_date');
        if (lastResetDate !== todayStr) {
          let updated = false;
          const updatedList = list.map(p => {
            if (p.role === 'child' && p.stress !== 0) {
              updated = true;
              return { ...p, stress: 0 };
            }
            return p;
          });
          if (updated) {
            localStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedList));
            localStorage.setItem('ff_last_stress_reset_date', todayStr);
            return updatedList;
          }
          localStorage.setItem('ff_last_stress_reset_date', todayStr);
        }
      }
      return list;
    }

    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error("Supabase getProfiles error:", error);
      return [];
    }

    const profilesList = (data || []).map((p: any) => ({
      id: p.id,
      role: p.role,
      name: p.name,
      avatar: p.avatar,
      pin: p.pin,
      title: p.title,
      level: p.level,
      exp: p.exp,
      gold: p.gold,
      stress: p.stress,
      style: p.style,
      childClass: p.child_class || p.childClass || '',
      stats: p.stats,
      buffs: p.buffs,
      inventory: p.inventory,
      password: p.password
    })) as Profile[];

    // 자녀 스트레스 매일 초기화 (Supabase 연동 시)
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toDateString();
      const lastResetDate = localStorage.getItem('ff_last_stress_reset_date');
      if (lastResetDate !== todayStr) {
        let updated = false;
        const updatedList = profilesList.map(p => {
          if (p.role === 'child' && p.stress !== 0) {
            updated = true;
            return { ...p, stress: 0 };
          }
          return p;
        });

        if (updated) {
          for (const p of updatedList) {
            await supabase.from('profiles').update({ stress: p.stress }).eq('id', p.id);
          }
        }
        localStorage.setItem('ff_last_stress_reset_date', todayStr);
        return updatedList;
      }
    }

    return profilesList;
  },
  
  updateProfile: async (profile: Profile): Promise<Profile[]> => {
    if (!isSupabaseConfigured) {
      const list = getStored(KEYS.PROFILES, DEFAULT_PROFILES);
      const idx = list.findIndex(p => p.id === profile.id);
      if (idx !== -1) {
        list[idx] = profile;
        setStored(KEYS.PROFILES, list);
      }
      return list;
    }

    const dbPayload = {
      id: profile.id,
      role: profile.role,
      name: profile.name,
      avatar: profile.avatar,
      pin: profile.pin,
      title: profile.title,
      level: profile.level,
      exp: profile.exp,
      gold: profile.gold,
      stress: profile.stress,
      style: profile.style,
      child_class: profile.childClass,
      stats: profile.stats,
      buffs: profile.buffs,
      inventory: profile.inventory,
      password: profile.password
    };

    const { error } = await supabase.from('profiles').upsert(dbPayload);
    if (error) {
      console.error("Supabase updateProfile error:", error);
    }
    return api.getProfiles();
  },

  deleteProfile: async (id: string): Promise<Profile[]> => {
    if (!isSupabaseConfigured) {
      const list = api.getProfiles(); // wait, api.getProfiles() returns a Promise now!
      // Let's resolve it using wait or getStored directly for localstorage
      const localList = getStored<Profile[]>(KEYS.PROFILES, DEFAULT_PROFILES);
      const filtered = localList.filter(p => p.id !== id);
      setStored(KEYS.PROFILES, filtered);
      return filtered;
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      console.error("Supabase deleteProfile error:", error);
    }
    return api.getProfiles();
  },

  getCurrentUserId: (): string => {
    return getStored(KEYS.CURRENT_USER_ID, 'parent1');
  },

  setCurrentUserId: (id: string): void => {
    setStored(KEYS.CURRENT_USER_ID, id);
  },

  getCurrentUser: async (): Promise<Profile> => {
    const list = await api.getProfiles();
    const id = api.getCurrentUserId();
    return list.find(p => p.id === id) || list[0];
  },

  // --- 퀘스트 관련 API ---
  getQuests: async (): Promise<Quest[]> => {
    if (!isSupabaseConfigured) {
      return getStored(KEYS.QUESTS, DEFAULT_QUESTS);
    }

    const { data, error } = await supabase.from('quests').select('*');
    if (error) {
      console.error("Supabase getQuests error:", error);
      return [];
    }
    return (data || []).map(mapQuestFromDB);
  },

  saveQuests: async (quests: Quest[]): Promise<void> => {
    if (!isSupabaseConfigured) {
      setStored(KEYS.QUESTS, quests);
      return;
    }

    // Supabase 퀘스트 대량 동기화
    for (const q of quests) {
      await supabase.from('quests').upsert(mapQuestToDB(q));
    }
  },

  addQuest: async (quest: Omit<Quest, 'id' | 'status'>): Promise<Quest> => {
    const newQuest: Quest = {
      ...quest,
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      status: 'active'
    };

    if (!isSupabaseConfigured) {
      const quests = getStored<Quest[]>(KEYS.QUESTS, DEFAULT_QUESTS);
      quests.push(newQuest);
      setStored(KEYS.QUESTS, quests);
      return newQuest;
    }

    const { error } = await supabase.from('quests').insert(mapQuestToDB(newQuest));
    if (error) {
      console.error("Supabase addQuest error:", error);
    }
    return newQuest;
  },

  // --- 상점 관련 API ---
  getStoreItems: async (): Promise<StoreItem[]> => {
    if (!isSupabaseConfigured) {
      return getStored(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS);
    }

    const { data, error } = await supabase.from('store_items').select('*');
    if (error) {
      console.error("Supabase getStoreItems error:", error);
      return [];
    }
    return (data || []) as StoreItem[];
  },

  saveStoreItems: async (items: StoreItem[]): Promise<void> => {
    if (!isSupabaseConfigured) {
      setStored(KEYS.STORE_ITEMS, items);
      return;
    }

    for (const item of items) {
      await supabase.from('store_items').upsert(item);
    }
  },

  updateStoreItem: async (item: StoreItem): Promise<StoreItem[]> => {
    if (!isSupabaseConfigured) {
      const items = getStored<StoreItem[]>(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS);
      const idx = items.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        items[idx] = item;
        setStored(KEYS.STORE_ITEMS, items);
      }
      return items;
    }

    const { error } = await supabase.from('store_items').upsert(item);
    if (error) {
      console.error("Supabase updateStoreItem error:", error);
    }
    return api.getStoreItems();
  },

  addStoreItem: async (item: Omit<StoreItem, 'id' | 'status'>): Promise<StoreItem> => {
    const newItem: StoreItem = {
      ...item,
      id: 's_' + Math.random().toString(36).substr(2, 9),
      status: 'available'
    };

    if (!isSupabaseConfigured) {
      const items = getStored<StoreItem[]>(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS);
      items.push(newItem);
      setStored(KEYS.STORE_ITEMS, items);
      return newItem;
    }

    const { error } = await supabase.from('store_items').insert(newItem);
    if (error) {
      console.error("Supabase addStoreItem error:", error);
    }
    return newItem;
  },

  // --- 알림 관련 API ---
  getNotifications: async (): Promise<AppNotification[]> => {
    if (!isSupabaseConfigured) {
      return getStored(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }

    const { data, error } = await supabase.from('notifications').select('*');
    if (error) {
      console.error("Supabase getNotifications error:", error);
      return [];
    }
    return (data || []).map(mapNotiFromDB);
  },

  addNotification: async (noti: Omit<AppNotification, 'id' | 'createdAt' | 'resolved'>): Promise<AppNotification> => {
    const newNoti: AppNotification = {
      ...noti,
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      resolved: false
    };

    if (!isSupabaseConfigured) {
      const list = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      list.unshift(newNoti);
      setStored(KEYS.NOTIFICATIONS, list);
      return newNoti;
    }

    const { error } = await supabase.from('notifications').insert(mapNotiToDB(newNoti));
    if (error) {
      console.error("Supabase addNotification error:", error);
    }
    return newNoti;
  },

  resolveNotification: async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      const list = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      const idx = list.findIndex(n => n.id === id);
      if (idx !== -1) {
        list[idx].resolved = true;
        setStored(KEYS.NOTIFICATIONS, list);
      }
      return;
    }

    const { error } = await supabase.from('notifications').update({ resolved: true }).eq('id', id);
    if (error) {
      console.error("Supabase resolveNotification error:", error);
    }
  },

  // 시스템 리셋 데모 기능
  resetToDefault: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(KEYS.PROFILES);
      localStorage.removeItem(KEYS.QUESTS);
      localStorage.removeItem(KEYS.STORE_ITEMS);
      localStorage.removeItem(KEYS.NOTIFICATIONS);
      localStorage.removeItem(KEYS.CURRENT_USER_ID);

      if (isSupabaseConfigured) {
        // Supabase 초기화 데이터 엎어치기
        try {
          await supabase.from('profiles').delete().neq('id', 'keep_all');
          await supabase.from('quests').delete().neq('id', 'keep_all');
          await supabase.from('store_items').delete().neq('id', 'keep_all');
          await supabase.from('notifications').delete().neq('id', 'keep_all');

          for (const p of DEFAULT_PROFILES) {
            await supabase.from('profiles').insert({
              id: p.id,
              role: p.role,
              name: p.name,
              avatar: p.avatar,
              pin: p.pin,
              title: p.title,
              level: p.level,
              exp: p.exp,
              gold: p.gold,
              stress: p.stress,
              style: p.style,
              child_class: p.childClass,
              stats: p.stats
            });
          }

          for (const q of DEFAULT_QUESTS) {
            await supabase.from('quests').insert(mapQuestToDB(q));
          }

          for (const s of DEFAULT_STORE_ITEMS) {
            await supabase.from('store_items').insert(s);
          }
        } catch (err) {
          console.error("Supabase reset error:", err);
        }
      }
      window.location.reload();
    }
  }
};
