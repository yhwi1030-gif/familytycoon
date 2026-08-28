import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { childRequestQuestApproval, childRequestGoldPayout, childCounterProposeQuest } from '@/lib/questController';
import { Profile, Quest, StoreItem, AppNotification } from '@/types';
import { getStressStatus, getPassiveBuffs } from '@/lib/gameEngine';
import { RadarChart } from '@/components/RadarChart';
import {
  Award, Zap, CheckCircle2, ShieldAlert, Coins, HelpCircle,
  Camera, ShoppingBag, Plus, RefreshCw, LogOut, Sliders, ChevronRight
} from 'lucide-react';

interface PlayerDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ user, onLogout }) => {
  // 탭 상태 ('home' | 'quest' | 'store')
  const [activeTab, setActiveTab] = useState<'home' | 'quest' | 'store'>('home');
  const [child, setChild] = useState<Profile>(user);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // 신규 퀘스트 실시간 유입 팝업 모사 제어용 상태
  const [newArrivalQuests, setNewArrivalQuests] = useState<Quest[]>([]);
  const isFirstLoad = useRef(true);
  const questsRef = useRef<Quest[]>([]);
  
  // 길드마스터 독려 메시지 실시간 팝업 제어용 상태
  const [newCheerNoti, setNewCheerNoti] = useState<AppNotification | null>(null);
  const isFirstLoadCheer = useRef(true);
  
  // 퀘스트 접기/펼치기 제어 상태 (자녀 모드용)
  const [isMainQuestsCollapsed, setIsMainQuestsCollapsed] = useState(false);
  const [isFlashQuestsCollapsed, setIsFlashQuestsCollapsed] = useState(false);
  const [isSelfQuestsCollapsed, setIsSelfQuestsCollapsed] = useState(false);
  const [dungeonOpenHour, setDungeonOpenHour] = useState<number>(8);

  // 실시간 타이머 및 던전 문 제어 상태
  const [timeState, setTimeState] = useState({
    currentTimeStr: '00:00:00',
    timeLeftStr: '00시간 00분 00초',
    gateProgress: 0
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      
      const currentTimeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      // 자정(24:00)까지의 카운트다운
      const totalSecsInDay = 24 * 3600;
      const currentTotalSecs = hrs * 3600 + mins * 60 + secs;
      const diffSecs = totalSecsInDay - currentTotalSecs;
      
      const diffHrs = Math.floor(diffSecs / 3600);
      const diffMins = Math.floor((diffSecs % 3600) / 60);
      const diffSecsLeft = diffSecs % 60;
      const timeLeftStr = `${String(diffHrs).padStart(2, '0')}시간 ${String(diffMins).padStart(2, '0')}분 ${String(diffSecsLeft).padStart(2, '0')}초`;
      
      // 문 계산: 설정된 아침 오픈 시간 ~ 밤 12시(100%)
      const openHour = typeof window !== 'undefined' ? (Number(localStorage.getItem('ff_dungeon_open_hour') || '8')) : 8;
      setDungeonOpenHour(openHour);
      const startSecs = openHour * 3600;
      let gateProgress = 0;
      if (currentTotalSecs >= startSecs) {
        gateProgress = ((currentTotalSecs - startSecs) / (totalSecsInDay - startSecs)) * 100;
        if (gateProgress > 100) gateProgress = 100;
      } else {
        gateProgress = 100; // 자정 ~ 오픈 시간 사이에는 완전 닫힘
      }
      
      setTimeState({ currentTimeStr, timeLeftStr, gateProgress });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 카메라 촬영 완료 인증 팝업 모사 상태
  const [activeCameraQuest, setActiveCameraQuest] = useState<Quest | null>(null);
  
  // 카메라 모드 상태 ('idle' | 'capture' | 'upload')
  const [cameraMode, setCameraMode] = useState<'idle' | 'capture' | 'upload'>('idle');
  // 스캔한 가짜 파일 전송용 파일명 모사
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  // Upstage Layout Parser AI 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  // Upstage Solar Pro 3.0 아이템 생성기 모사 상태
  const [isGeneratingItemIcon, setIsGeneratingItemIcon] = useState(false);
  const [generatingItemName, setGeneratingItemName] = useState('');
  const [itemGenerationStep, setItemGenerationStep] = useState(0);

  // 역제안(밀당) 모달 상태
  const [activeNegotiateQuest, setActiveNegotiateQuest] = useState<Quest | null>(null);
  const [negotiateGold, setNegotiateGold] = useState(500);

  // 셀프 퀘스트 빌더
  const [isSelfQuestOpen, setIsSelfQuestOpen] = useState(false);
  const [selfQuestTitle, setSelfQuestTitle] = useState('');
  const [selfQuestGold, setSelfQuestGold] = useState(300);

  // 실제 돈 환원 요청 모달
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(1000);

  const loadData = async () => {
    const list = await api.getProfiles();
    const current = list.find(p => p.id === user.id);
    if (current) setChild(current);
    const qList = await api.getQuests();
    const todayStr = new Date().toDateString();
    
    // 예약 발송 퀘스트 및 로그인 자녀 필터링 적용 (오늘 날짜 발송분 및 본인 소유/공용 퀘스트만 노출)
    const filteredQuests = qList.filter(q => {
      if (q.childId && q.childId !== user.id) {
        return false;
      }
      const qDate = new Date(q.createdAt || new Date()).toDateString();
      if (q.scheduledDate) {
        return new Date(q.scheduledDate).toDateString() === todayStr;
      }
      return qDate === todayStr;
    });

    // 신규 수신 퀘스트 실시간 감지 (LocalStorage 기반 영구 중복 차단)
    const notifiedIdsStr = typeof window !== 'undefined' ? (localStorage.getItem('ff_notified_quest_ids') || '[]') : '[]';
    let notifiedIds: string[] = [];
    try {
      notifiedIds = JSON.parse(notifiedIdsStr);
    } catch (e) {
      notifiedIds = [];
    }

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      // 첫 진입 시점에 이미 활성화되어 있는 기존 퀘스트들은 알림 대상에서 자동 제외 처리
      const initialActiveIds = filteredQuests.filter(q => q.status === 'active').map(q => q.id);
      const mergedIds = Array.from(new Set([...notifiedIds, ...initialActiveIds]));
      if (typeof window !== 'undefined') {
        localStorage.setItem('ff_notified_quest_ids', JSON.stringify(mergedIds));
      }
    } else {
      const newArrivals = filteredQuests.filter(q => q.status === 'active' && !notifiedIds.includes(q.id));
      if (newArrivals.length > 0) {
        setNewArrivalQuests(prev => {
          const merged = [...prev];
          newArrivals.forEach(na => {
            if (!merged.some(m => m.id === na.id)) {
              merged.push(na);
            }
          });
          return merged;
        });

        const updatedNotifiedIds = Array.from(new Set([...notifiedIds, ...newArrivals.map(q => q.id)]));
        if (typeof window !== 'undefined') {
          localStorage.setItem('ff_notified_quest_ids', JSON.stringify(updatedNotifiedIds));
        }
      }
    }

    questsRef.current = filteredQuests;
    setQuests(filteredQuests);
    const sList = await api.getStoreItems();
    setStoreItems(sList);
    const nList = await api.getNotifications();
    setNotifications(nList);

    // 신규 독려 알림 실시간 감지 (LocalStorage 기반 영구 중복 차단)
    const notifiedCheerIdsStr = typeof window !== 'undefined' ? (localStorage.getItem('ff_notified_cheer_ids') || '[]') : '[]';
    let notifiedCheerIds: string[] = [];
    try {
      notifiedCheerIds = JSON.parse(notifiedCheerIdsStr);
    } catch (e) {
      notifiedCheerIds = [];
    }

    if (isFirstLoadCheer.current) {
      isFirstLoadCheer.current = false;
      const initialCheerIds = nList.filter(n => n.type === 'cheer').map(n => n.id);
      const mergedCheerIds = Array.from(new Set([...notifiedCheerIds, ...initialCheerIds]));
      if (typeof window !== 'undefined') {
        localStorage.setItem('ff_notified_cheer_ids', JSON.stringify(mergedCheerIds));
      }
    } else {
      const newCheers = nList.filter(n => n.type === 'cheer' && !notifiedCheerIds.includes(n.id));
      if (newCheers.length > 0) {
        setNewCheerNoti(newCheers[0]);
        const updatedNotifiedCheerIds = Array.from(new Set([...notifiedCheerIds, ...newCheers.map(n => n.id)]));
        if (typeof window !== 'undefined') {
          localStorage.setItem('ff_notified_cheer_ids', JSON.stringify(updatedNotifiedCheerIds));
        }
      }
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // 퀘스트 완료 여부 묻기 YES/NO 모달 팝업 상태
  const [confirmQuest, setConfirmQuest] = useState<Quest | null>(null);

  const getAutoMatchedPhotoUrl = (q: Quest): string => {
    const titleLower = q.title.toLowerCase();
    const cat = q.category;
    
    if (cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')) {
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'; // 책 읽기
    }
    if (titleLower.includes('수학') || titleLower.includes('산수') || titleLower.includes('연산') || titleLower.includes('수력') || titleLower.includes('원리셈')) {
      return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80'; // 수학 수식
    }
    if (titleLower.includes('영어') || titleLower.includes('영단어') || titleLower.includes('english') || titleLower.includes('단어')) {
      return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80'; // 영어 필기
    }
    if (cat === '학습' || titleLower.includes('공부') || titleLower.includes('학습') || titleLower.includes('과제') || titleLower.includes('숙제')) {
      return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'; // 공부 필기노트
    }
    if (cat === '청소' || cat === '생활' || titleLower.includes('청소') || titleLower.includes('정리') || titleLower.includes('정돈') || titleLower.includes('이불')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'; // 정돈/청소 세제
    }
    if (cat === '반려동물' || titleLower.includes('강아지') || titleLower.includes('고양이') || titleLower.includes('산책') || titleLower.includes('동물')) {
      return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'; // 강아지/반려견
    }
    return 'https://images.unsplash.com/photo-1484480974693-2ca0a72f384c?auto=format&fit=crop&w=400&q=80'; // 다이어리/체크리스트
  };

  const requiresPhoto = (q: Quest) => {
    const t = q.title.toLowerCase();
    return q.category === '학습' || q.category === '독서' || t.includes('학습지') || t.includes('독서') || t.includes('책 읽기') || t.includes('책읽기') || t.includes('기록장');
  };

  const handleQuestCompleteClick = (q: Quest) => {
    setConfirmQuest(q);
  };

  const handleCameraCaptureConfirm = async () => {
    if (!activeCameraQuest) return;

    // Upstage OCR & Layout Parser 분석 모드 작동
    setIsAnalyzing(true);
    setAnalysisStep(1);

    // 단계별 가상 텍스트 분석 시뮬레이션
    const timer1 = setTimeout(() => setAnalysisStep(2), 1200);
    const timer2 = setTimeout(() => setAnalysisStep(3), 2450);

    setTimeout(async () => {
      const titleLower = activeCameraQuest.title.toLowerCase();
      const cat = activeCameraQuest.category;
      
      let parsedText = '';
      if (cat === '독서' || titleLower.includes('독서') || titleLower.includes('책') || titleLower.includes('읽기')) {
        parsedText = `[이원화 검증 파이프라인 기동 (Upstage DocumentParse + Gemini 2.0)]
■ 1단계: Upstage DocumentParse 레이아웃 정형화
  - 촬영 이미지 그림자 자동 제거 및 연필 명암 회색조 보정 완료
  - 영역 분석: [본문 인쇄 영역] vs [자필 독서록 기입 영역] 분할 성공
  - 필기 본문 영역 검출 좌표: [x: 42, y: 152, w: 320, h: 180]

■ 2단계: Gemini 2.0 맥락 기반 필적 & 완료율 종합 판정
  - 필적 대조군 검증: 이전 필적 패턴과 98.4% 일치 (정상 학습자 본인 판정)
  - 미완성 영역 스캔: 빈칸 없음 (독서록 작성 완성도 100%)
  - OCR 문맥 보정: 그림자로 오독된 문자 "가존 중연한 것" ➔ 맥락 상 "가장 중요한 것"으로 자동 보정 완료.
  
[종합 판정]: 자녀가 직접 손글씨로 독서록을 완성했음을 100% 검증 완료함.`;
      } else if (titleLower.includes('국어') || titleLower.includes('한글') || titleLower.includes('구몬') || titleLower.includes('한자') || titleLower.includes('어휘') || titleLower.includes('독해')) {
        parsedText = `[이원화 검증 파이프라인 기동 (Upstage DocumentParse + Gemini 2.0)]
■ 1단계: Upstage DocumentParse 레이아웃 정형화
  - 비뚤게 촬영된 학습지 외곽선 기준 정밀 보정 (Perspective Wrap 12도 변환)
  - 영역 분석: [문제 문항 영역 5개] vs [자필 정답 빈칸 영역 5개] 매핑 완료
  
■ 2단계: Gemini 2.0 맥락 기반 필적 & 완료율 종합 판정
  - 필적 대조군 검증: 이전 국어 풀이 필적 패턴과 98.2% 일치
  - 문항 채점 완료율: 5개 문항 중 5개 답변 기입 완료 (수행률 100%)
  - OCR 문맥 보정: 번진 연필 자국 "사자재리 유성우" ➔ 어휘 맥락 상 "사자자리 유성우"로 정답 판정 자동 보정.
  
[종합 판정]: 국어 지문 독해 및 빈칸 채우기가 필적 검증을 통과하여 정상 완료됨.`;
      } else if (titleLower.includes('수학') || titleLower.includes('산수') || titleLower.includes('연산') || titleLower.includes('수력') || titleLower.includes('수') || titleLower.includes('원리셈')) {
        parsedText = `[이원화 검증 파이프라인 기동 (Upstage DocumentParse + Gemini 2.0)]
■ 1단계: Upstage DocumentParse 레이아웃 정형화
  - 어두운 저조도 그림자 음영 제거 및 연필 필기선 윤곽 강화 (Contrast Enhancement)
  - 영역 분석: [연산식 인쇄 영역 10개] vs [자필 풀이/답안 빈칸 10개] 좌표 추출
  
■ 2단계: Gemini 2.0 맥락 기반 필적 & 완료율 종합 판정
  - 수식 및 정답 검증: "2x + 5 = 11" ➔ "x = 3" 수식 관계 추론 매칭 성공
  - 완료율: 10개 연산 문제 전체 답변 흔적 감지 완료 (100% 완료)
  - OCR 문맥 보정: 낙서로 뭉개진 숫자 "3" ➔ 수식 풀이 맥락 상 정답 "3"으로 보정 판정 완료.
  
[종합 판정]: 수학 문제집 연산 풀이의 식과 정답이 필적 검사 통과 및 정상 완료됨.`;
      } else if (titleLower.includes('영어') || titleLower.includes('영단어') || titleLower.includes('english') || titleLower.includes('단어')) {
        parsedText = `[이원화 검증 파이프라인 기동 (Upstage DocumentParse + Gemini 2.0)]
■ 1단계: Upstage DocumentParse 레이아웃 정형화
  - Skew 자동 보정 및 페이지 접힘선 그림자 노이즈 제거
  - 영역 분석: [영단어 문제 리스트] vs [자필 영어 스펠링 쓰기 칸] 매핑 완료
  
■ 2단계: Gemini 2.0 맥락 기반 필적 & 완료율 종합 판정
  - 필적 대조군 검증: 자녀 본인 영어 필체 패턴 97.8% 일치
  - 완료율: 10개 영단어 단어장 쓰기 완수 (완료율 100%)
  - OCR 문맥 보정: 필기체 "apple" 끝자리 "e" 오인식 우려 ➔ 사전식 스펠링 문맥 비교로 정상 단어 보정 완료.
  
[종합 판정]: 영어 스펠링 단어장 작성이 필적 대조군 검증 및 정상 완료됨.`;
      } else {
        parsedText = `[이원화 검증 파이프라인 기동 (Upstage DocumentParse + Gemini 2.0)]
■ 1단계: Upstage DocumentParse 레이아웃 정형화
  - 학습지 왜곡 및 촬영 각도 보정 완료 (Perspective Warp)
  - 영역 분석: [${cat} 퀘스트 문항 영역] vs [자녀 자필 수행 영역]
  
■ 2단계: Gemini 2.0 맥락 기반 필적 & 완료율 종합 판정
  - 필적 대조군 검증: 자녀 기존 필적 데이터와 98.0% 일치
  - 수행 완료율: 요구 조건 100% 충족 판정
  - OCR 문맥 보정: 필기 텍스트 노이즈 ➔ 맥락 기반 OCR 텍스트 보정 완료
  
[종합 판정]: 제출된 이미지의 레이아웃 영역과 기입 텍스트가 정상 검증 완료됨.`;
      }

      const displayUrl = cameraMode === 'upload' && uploadedFileUrl 
        ? uploadedFileUrl 
        : getAutoMatchedPhotoUrl(activeCameraQuest);
      const payloadUrl = `${displayUrl}##${encodeURIComponent(parsedText)}`;

      await childRequestQuestApproval(
        activeCameraQuest.id,
        activeCameraQuest.title,
        payloadUrl,
        child.id,
        child.name
      );

      setIsAnalyzing(false);
      setAnalysisStep(0);
      setActiveCameraQuest(null);
      setCameraMode('idle');
      setUploadedFile(null);
      setUploadedFileUrl(null);
      await loadData();
    }, 3800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      setCameraMode('upload');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
              setUploadedFileUrl(compressedBase64);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFileUrl('https://images.unsplash.com/photo-1568667256549-094345857637?w=400&auto=format&fit=crop');
      }
    }
  };

  const handleNegotiationSubmit = async () => {
    if (activeNegotiateQuest) {
      await childCounterProposeQuest(activeNegotiateQuest.id, negotiateGold, child.id);
      setActiveNegotiateQuest(null);
      await loadData();
      alert(`🤝 길드마스터에게 보상 조정 (${negotiateGold}G) 협상 요청을 전달했습니다.`);
    }
  };

  const handleSelfQuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfQuestTitle.trim()) return;

    const todayStr = new Date().toDateString();
    const todaySelfQuests = quests.filter(q => 
      q.type === 'self' && 
      q.childId === child.id &&
      q.createdAt && new Date(q.createdAt).toDateString() === todayStr
    );

    if (todaySelfQuests.length >= 2) {
      alert("오늘 도전할 수 있는 횟수를 다 썼어요! 내일 다시 도전해 봐요.");
      return;
    }

    if (selfQuestGold > 500) {
      alert("⚠️ 셀프 모험으로 제안 가능한 최대 보상은 500G입니다!");
      return;
    }

    const newQ = await api.addQuest({
      title: selfQuestTitle,
      category: '기타',
      type: 'self',
      rewardType: 'both',
      rewardExp: 30,
      rewardGold: selfQuestGold,
      childId: child.id,
      childName: child.name
    });

    await api.addNotification({
      message: `🧚‍♀️ 자녀가 주도적으로 셀프 퀘스트 [${selfQuestTitle}]을 스스로 설계하여 도전 중입니다.`,
      type: 'self_quest_proposal',
      targetId: newQ.id,
      meta: {
        childName: child.name,
        childId: child.id,
        questTitle: selfQuestTitle,
        proposedGold: selfQuestGold
      }
    });

    setSelfQuestTitle('');
    setIsSelfQuestOpen(false);
    await loadData();
    alert(`⚡ 셀프 모험 [${selfQuestTitle}]을 스스로 등록하여 도전을 시작했습니다!`);
  };

  const handlePurchaseItem = async (item: StoreItem) => {
    if (child.level < item.requiredLevel) {
      alert(`🔒 레벨 제한! 캐릭터 레벨 ${item.requiredLevel} 이상이 필요합니다.`);
      return;
    }
    if (child.gold < item.price) {
      alert(`🪙 골드가 부족합니다. 돌발 퀘스트를 클리어해 골드를 모으세요!`);
      return;
    }

    // Upstage Solar Pro 3.0 아이템 생성기 기동 시뮬레이션
    setIsGeneratingItemIcon(true);
    setGeneratingItemName(item.name);
    setItemGenerationStep(1);

    const timer1 = setTimeout(() => setItemGenerationStep(2), 1000);
    const timer2 = setTimeout(() => setItemGenerationStep(3), 2200);

    setTimeout(async () => {
      // 1. 골드 차감 및 자녀 인벤토리에 아이템 즉시 직행 추가
      const currentInventory = child.inventory || [];
      const updatedChild = { 
        ...child, 
        gold: child.gold - item.price,
        inventory: [...currentInventory, item.id]
      };
      await api.updateProfile(updatedChild);

      // 2. 상점 아이템 상태를 'purchased'로 갱신 (부모 결재 스킵)
      const updatedItem: StoreItem = { ...item, status: 'purchased' };
      await api.updateStoreItem(updatedItem);

      // 3. 마스터에게 상점 구매 완료 통지 알림 발송
      await api.addNotification({
        message: `🛍️ 자녀가 [${item.name}] 아이템을 구매 완료하여 인벤토리에 즉시 추가되었습니다.`,
        type: 'general',
        targetId: item.id
      });

      setIsGeneratingItemIcon(false);
      await loadData();
      alert(`🛍️ [Upstage Solar Pro 3.0] 고화질 아이템 리소스 렌더링이 완료되었습니다! 가방(🎒)을 열어 사용해 보세요.`);
    }, 3200);
  };

  const handlePayoutSubmit = async () => {
    if (child.level < 5) {
      alert('🔒 골드 실제 현금화는 캐릭터 레벨 5 이상부터 요청할 수 있습니다.');
      return;
    }
    if (child.gold < payoutAmount) {
      alert('🪙 보유 골드가 부족합니다.');
      return;
    }

    const success = await childRequestGoldPayout(payoutAmount, child.id);
    if (success) {
      setIsPayoutOpen(false);
      await loadData();
      alert(`💰 ${payoutAmount}원 현금 전환 요청을 완료했습니다!`);
    }
  };

  const stressInfo = getStressStatus(child.stress);
  const activeBuffs = getPassiveBuffs(child.style);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans pb-16">
      
      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EBE6DD] py-3 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl select-none">🛡️</div>
          <div>
            <h1 className="text-sm md:text-md font-black tracking-tight flex items-center gap-1.5 font-bw">
              <span className="bg-gradient-to-r from-[#AC52F2] to-[#E879F9] bg-clip-text text-transparent inline-block">패밀리 던전 타이쿤</span> <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-sans">플레이어 모드</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold">{child.name}</p>
          </div>
        </div>

        {/* 대시보드 메인 탭 전환 버튼 구역 (기획안 13페이지 준수) */}
        <nav className="flex items-center bg-slate-100 border border-slate-200 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'home'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            홈 (캐릭터)
          </button>
          <button
            onClick={() => setActiveTab('quest')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quest'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            퀘스트
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'store'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            상점
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSelfQuestOpen(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition shadow-md"
          >
            <Plus className="w-3 h-3" /> 내 마음대로 모험
          </button>
          <button
            onClick={onLogout}
            className="bg-slate-200 hover:bg-slate-350 text-slate-700 hover:text-slate-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-300"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* 1. 홈 탭 (캐릭터 상태 + 버프 + 전령) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 좌측 캐릭터 1/3 영역 분할 메인 박스 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* [1/3 영역] 캐릭터 창 카드 - 투명도 20% 설정 */}
              <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-52 h-52 rounded-3xl bg-[#FAF8F5] border border-[#EBE6DD] overflow-hidden flex items-center justify-center shadow-inner relative group p-[10px]">
                  <img 
                    src={
                      child.childClass === 'scholar' ? '/INT.svg' :
                      child.childClass === 'pioneer' ? '/STR.svg' :
                      child.childClass === 'guardian' ? '/CRT.svg' :
                      child.childClass === 'bard' ? '/CPN.svg' :
                      '/INT.svg' // fallback
                    } 
                    alt="Class Avatar" 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                  />
                  <span className="absolute bottom-[3px] right-[3px] bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-lg shadow-md border border-emerald-300 z-10">
                    Lv.{child.level}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">{child.name}</h3>
                  <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full inline-block">
                    {child.title || '성향 진단 완료'}
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-[#EBE6DD] space-y-3 text-left">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>성장 경험치</span>
                      <span className="text-emerald-600 font-extrabold">{child.exp} / {child.level * 100} EXP</span>
                    </div>
                    <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                        style={{ width: `${(child.exp / (child.level * 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-[#EBE6DD] flex items-center justify-between shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500">🪙 골드 주머니</span>
                      <span className="text-xs font-black text-amber-600">{child.gold.toLocaleString()} G</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-[#EBE6DD] flex items-center justify-between shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500">💥 피로도</span>
                      <span className={`text-xs font-black ${child.stress >= 70 ? 'text-red-650' : 'text-emerald-600'}`}>
                        {child.stress} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* [2/3 영역] 하단/우측 모험가 상세 지표 & 버프 장비 박스 */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* 아이템 가방 및 스탯 차트 가로 2분할 레이아웃 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* 아이템 가방 (인벤토리) - 투명도 20% 설정 */}
                  <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-bw">
                        🎒 아이템 가방
                      </h4>
                      <p className="text-[9px] text-slate-500 font-medium mb-4">
                        마스터에게 획득한 이용권/아이템 보관함 (클릭 시 사용 알림 전령 발송)
                      </p>
                    </div>

                    {/* 3x3 격자 인벤토리 슬롯 */}
                    <div className="grid grid-cols-3 gap-2.5 my-auto">
                      {Array.from({ length: 9 }).map((_, idx) => {
                        const itemId = (child.inventory || [])[idx];
                        const item = itemId ? storeItems.find(i => i.id === itemId) : null;
                        
                        return (
                          <button
                            key={idx}
                            disabled={!item}
                            onClick={async () => {
                              if (item) {
                                // 1. 마스터에게 알림 전령 전송
                                await api.addNotification({
                                  message: `🔔 [이용권 사용 요청] 자녀(${child.name.split(' ')[0]})가 획득 보관 중이던 [${item.name}] 이용권 실물 사용을 요청했습니다.`,
                                  type: 'item_use_request',
                                  targetId: item.id,
                                  meta: { itemId: item.id, itemName: item.name, childId: child.id }
                                });
                                // 2. 인벤토리에서 해당 아이템 1개 제거 소모 처리
                                const updatedInventory = [...(child.inventory || [])];
                                updatedInventory.splice(idx, 1);
                                const updatedChild = { ...child, inventory: updatedInventory };
                                await api.updateProfile(updatedChild);
                                await loadData();
                                alert(`🔔 [전령 발송] 마스터에게 [${item.name}] 사용 전령 메시지를 전달했습니다!`);
                              }
                            }}
                            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1.5 transition-all duration-300 relative group shadow-sm ${
                              item
                                ? 'bg-white border-indigo-200 hover:bg-[#FAF8F5] hover:border-indigo-400 hover:scale-105 active:scale-95'
                                : 'bg-[#FAF8F5]/30 border-[#EBE6DD] cursor-default'
                            }`}
                            title={item ? `${item.name} (클릭 시 사용)` : '빈 슬롯'}
                          >
                            {item ? (
                              <div className="w-full h-full relative flex flex-col items-center justify-between">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <span className="text-xl select-none mt-1">
                                    {item.type === 'coupon' ? '🎟️' : item.type === 'real' ? '💵' : '📦'}
                                  </span>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-white/90 py-0.5 rounded-b-xl border-t border-slate-100">
                                  <span className="text-[7px] text-slate-800 font-extrabold truncate w-full text-center block px-1">
                                    {item.name.replace('[쿠폰] ', '').replace('[패스] ', '').replace('[용돈] ', '').replace('[식품] ', '').replace('[아바타] ', '').replace('[외식] ', '')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5대 스탯 및 칭호 오각형 그래프 박스 - 투명도 20% 설정 */}
                  <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-5 shadow-sm flex flex-col justify-between items-center text-center">
                    <h4 className="text-xs font-bold text-slate-800 mb-2 self-start flex items-center gap-1.5 font-bw">
                      📊 모험가 스탯 차트
                    </h4>
                    <div className="flex-1 flex justify-center items-center">
                      {child.stats ? (
                        <RadarChart stats={child.stats} size={185} />
                      ) : (
                        <div className="text-xs text-slate-400">스탯 정보가 등록되지 않았습니다.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* 적용 버프 & 컨디션 박스 - 투명도 20% 설정 */}
                <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      👑 부모 양육스타일 연동 패시브 버프
                    </h4>
                    {activeBuffs.length > 0 ? (
                      activeBuffs.map((buff, i) => (
                        <div key={i} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl">
                          🛡️ {buff}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-400">현재 활성화된 패시브 버프가 없습니다.</div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${stressInfo.color}`}>
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{stressInfo.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{stressInfo.desc}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* 길드마스터 훈육/독려 전령 메시지 수신함 - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-[#EBE6DD] pb-3 font-bw">
                💬 길드마스터 전령 메시지 수신함
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(() => {
                  const childNotis = notifications.filter(n => 
                    (n.message.includes('"') || n.type === 'quest_approved' || n.type === 'quest_rejected' || n.type === 'gold_approved' || n.type === 'gold_rejected' || n.type === 'general') && 
                    (!n.meta?.childId || n.meta.childId === user.id)
                  );
                  return childNotis.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-bold italic">
                      아직 수신된 전령 메시지가 없습니다.
                    </div>
                  ) : (
                    childNotis.map(n => (
                      <div key={n.id} className="p-3 bg-white/80 border border-[#EBE6DD] rounded-2xl text-xs font-semibold leading-relaxed text-slate-800 shadow-sm">
                        <p className="text-[9px] text-indigo-600 mb-1 font-bold">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        {n.message}
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 2. 퀘스트 탭 (퀘스트 리스트 + 3클릭 인증 & 역제안) */}
        {activeTab === 'quest' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 메인 퀘스트 섹션 (던전 진입 테마) */}
            <div className="bg-white border border-[#EBE6DD] rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div 
                onClick={() => setIsMainQuestsCollapsed(!isMainQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-[#EBE6DD]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'main').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-bw">
                    🏰 메인 던전 게이트 (일일 루틴)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold">
                  <span>{isMainQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isMainQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isMainQuestsCollapsed && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                  
                  {/* 상단: 타이머 UI */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border border-slate-800 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⏱️</span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">현재 시간</p>
                        <p className="text-sm font-black text-white font-bw">{timeState.currentTimeStr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-rose-950/65 px-3.5 py-1.5 rounded-xl border border-rose-500/30 shadow-md shadow-rose-950/10">
                      <span className="text-xs text-rose-300 font-bold">던전 마감까지 남은 시간:</span>
                      <span className="text-xs font-black text-rose-200 font-bw">{timeState.timeLeftStr}</span>
                    </div>
                  </div>

                  {/* 중앙 & 우측: 던전 입구 및 징검다리 횡스크롤 */}
                  {new Date().getHours() < 6 ? (
                    <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[200px]">
                      <div className="text-4xl mb-3">🔒</div>
                      <div className="text-sm font-bold text-slate-300">오늘의 메인 퀘스트 잠금 상태</div>
                      <div className="text-xs text-slate-500 mt-1.5">매일 미션은 오전 6시에 개방됩니다! 조금만 기다려 주세요.</div>
                    </div>
                  ) : quests.filter(q => q.type === 'main').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold italic bg-slate-50 rounded-2xl border border-slate-200">
                      등록된 메인 던전 퀘스트가 없습니다.
                    </div>
                  ) : (
                    <div className="relative w-full min-h-[380px] rounded-2xl border border-slate-300 bg-slate-950 p-6 shadow-inner flex flex-col md:flex-row justify-between items-end gap-6 overflow-visible">
                      {/* 던전 배경 이미지 및 오버레이 */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-30 blur-[0.5px]" 
                          style={{ backgroundImage: "url('/family_tycoon_map.jpg')" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#111625]/90 via-[#1b2238]/92 to-[#0c0f1a]/95" />
                      </div>
                      
                      {/* 횃불 애니메이션 효과 */}
                      <div className="absolute top-4 left-6 flex flex-col items-center select-none z-10">
                        <span className="text-lg animate-bounce duration-1000">🔥</span>
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full border border-slate-700 mt-1" />
                      </div>
                      <div className="absolute top-4 right-6 flex flex-col items-center select-none z-10">
                        <span className="text-lg animate-bounce duration-1000 delay-300">🔥</span>
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full border border-slate-700 mt-1" />
                      </div>
                      
                      {/* 징검다리 영역 - 한 줄에 담기지 않으면 다음 줄로 자연스럽게 흐르도록 flex-wrap 탑재 */}
                      <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-14 z-10 pt-10 pb-4 overflow-visible">
                        {quests.filter(q => q.type === 'main').map((q, idx, arr) => {
                          const isCompleted = q.status === 'completed';
                          const prevCompleted = arr.slice(0, idx).every(item => item.status === 'completed');
                          const isActive = !isCompleted && prevCompleted;
                          const isLocked = false; // 순차 제한 잠금 제거
                          
                          let stateColor = 'bg-[#1e293b]/90 border-slate-600 text-slate-400 shadow-md';
                          if (isCompleted) {
                            stateColor = 'bg-[#0f2e22]/95 border-[#10b981] text-[#a7f3d0] shadow-lg shadow-[#10b981]/20 border-2';
                          } else if (isActive) {
                            stateColor = 'bg-[#2d1b10]/95 border-[#f59e0b] text-[#fde68a] shadow-lg shadow-[#f59e0b]/30 animate-pulse border-2';
                          }
                          
                          // 와이어프레임에 구현된 지그재그 높낮이 느낌을 연출 (짝수 인덱스는 약간 솟아오르게)
                          const zigZagStyle = idx % 2 === 0 ? 'translate-y-2' : '-translate-y-2';

                          return (
                            <div 
                              key={q.id} 
                              onClick={() => {
                                if (!isCompleted && !isLocked) {
                                  handleQuestCompleteClick(q);
                                }
                              }}
                              className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center p-2 text-center cursor-pointer transition transform hover:scale-105 select-none relative ${stateColor} ${zigZagStyle}`}
                            >
                              {isActive && (
                                <div className="absolute -top-12 z-20 flex flex-col items-center animate-bounce">
                                  <span className="text-3xl filter drop-shadow">{child.avatar || '🛡️'}</span>
                                  <span className="text-[7px] text-amber-300 bg-slate-950 px-1 rounded-full border border-amber-500 font-bold">진행중</span>
                                </div>
                              )}
                              
                              <div className="w-10 h-10 flex items-center justify-center mb-1.5 relative overflow-hidden rounded-xl bg-slate-900/40 p-1 border border-slate-750/30">
                                {q.iconUrl ? (
                                  <img 
                                    src={q.iconUrl} 
                                    alt="Quest Icon" 
                                    className={`w-full h-full object-cover rounded-lg ${isLocked ? 'opacity-25 grayscale' : ''}`} 
                                  />
                                ) : (
                                  <span className="text-xl">{isCompleted ? '👣' : isLocked ? '🔒' : '⚔️'}</span>
                                )}
                                {isLocked && q.iconUrl && (
                                  <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center text-[10px]">🔒</div>
                                )}
                              </div>
                              
                              <p className="text-[9px] font-black leading-tight max-w-[80px] truncate">{q.title}</p>
                              <p className="text-[7px] text-slate-400 mt-0.5">{q.rewardExp} EXP</p>
                              
                              {q.status === 'request_approval' && (
                                <span className="absolute -bottom-2 bg-indigo-600 text-[6px] font-black text-white px-1 py-0.5 rounded border border-indigo-400 animate-pulse">검수중</span>
                              )}
                            </div>
                          );
                        })}
                        
                        {quests.filter(q => q.type === 'main').every(q => q.status === 'completed') && (
                          <div className="flex-shrink-0 w-20 flex flex-col items-end justify-center animate-bounce pb-2 overflow-visible">
                            <div className="flex flex-col items-center">
                              <span className="text-4xl">{child.avatar || '🛡️'}</span>
                              <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold mt-1">도착!</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 성문: 와이어프레임 구조를 반영한 2D 로우 블록(벡터) 스타일로 수정 */}
                      <div className="w-36 h-40 flex-shrink-0 relative bg-transparent overflow-visible select-none flex items-end z-10 self-center md:self-end">
                        
                        {/* 왼쪽 타워 */}
                        <div className="absolute left-0 bottom-0 w-8 h-36 bg-[#2a344d] border-2 border-[#151a29] flex flex-col justify-between z-10 rounded-t-sm">
                          {/* 성벽 총안 (Battlements) */}
                          <div className="flex justify-between -mt-2 px-0.5">
                            <div className="w-2.5 h-2 bg-[#2a344d] border-t-2 border-x-2 border-[#151a29]" />
                            <div className="w-2.5 h-2 bg-[#2a344d] border-t-2 border-x-2 border-[#151a29]" />
                          </div>
                          {/* 감시창 */}
                          <div className="w-2.5 h-4 bg-slate-900 rounded-md border border-slate-700 mx-auto mt-4" />
                          {/* 로우 블록 돌 무늬 선 */}
                          <div className="border-t border-slate-600 w-full opacity-30 mt-10" />
                          <div className="border-t border-slate-600 w-full opacity-30 mb-6" />
                        </div>

                        {/* 오른쪽 타워 */}
                        <div className="absolute right-0 bottom-0 w-8 h-36 bg-[#2a344d] border-2 border-[#151a29] flex flex-col justify-between z-10 rounded-t-sm">
                          {/* 성벽 총안 (Battlements) */}
                          <div className="flex justify-between -mt-2 px-0.5">
                            <div className="w-2.5 h-2 bg-[#2a344d] border-t-2 border-x-2 border-[#151a29]" />
                            <div className="w-2.5 h-2 bg-[#2a344d] border-t-2 border-x-2 border-[#151a29]" />
                          </div>
                          {/* 감시창 */}
                          <div className="w-2.5 h-4 bg-slate-900 rounded-md border border-slate-700 mx-auto mt-4" />
                          {/* 로우 블록 돌 무늬 선 */}
                          <div className="border-t border-slate-600 w-full opacity-30 mt-10" />
                          <div className="border-t border-slate-600 w-full opacity-30 mb-6" />
                        </div>

                        {/* 중간 연결 성벽 및 게이트 아치 */}
                        <div className="absolute inset-x-8 bottom-0 h-28 bg-[#20273a] border-t-2 border-[#151a29] z-0 flex flex-col justify-end">
                          {/* 중간 성벽 총안 */}
                          <div className="flex justify-around -mt-2 absolute top-0 inset-x-0">
                            <div className="w-3 h-2 bg-[#20273a] border-t-2 border-x-2 border-[#151a29]" />
                            <div className="w-3 h-2 bg-[#20273a] border-t-2 border-x-2 border-[#151a29]" />
                          </div>
                          
                          {/* 성문 아치 입구 */}
                          <div className="w-16 h-20 bg-slate-950 border-t-2 border-x-2 border-[#151a29] rounded-t-full mx-auto relative overflow-hidden self-end">
                            {/* 실시간으로 하강하는 쇠창살 문 (Portcullis Gate) */}
                            <div 
                              className="absolute inset-0 bg-transparent flex justify-around p-1 h-full transition-transform duration-1000 z-20"
                              style={{ transform: `translateY(${-100 + timeState.gateProgress}%)` }}
                            >
                              <div className="w-1 h-full bg-slate-500 border-x border-slate-900" />
                              <div className="w-1 h-full bg-slate-500 border-x border-slate-900" />
                              <div className="w-1 h-full bg-slate-500 border-x border-slate-900" />
                              
                              {/* 가로 보강대 */}
                              <div className="absolute top-1/4 inset-x-0 h-1 bg-slate-700 border-y border-slate-900" />
                              <div className="absolute top-2/4 inset-x-0 h-1 bg-slate-700 border-y border-slate-900" />
                              <div className="absolute top-3/4 inset-x-0 h-1 bg-slate-700 border-y border-slate-900" />
                            </div>
                            
                            {/* 아치 문 안쪽 라벨 */}
                            <div className="absolute bottom-2 inset-x-0 text-center text-[7px] font-black text-purple-400 select-none z-10 leading-none">
                              던전 입구
                            </div>
                          </div>
                        </div>

                      </div>
                      
                      {/* 게이트 상태 표시 텍스트 */}
                      <div className="absolute bottom-2 left-6 right-6 z-10 flex justify-between items-center text-[10px] text-slate-400 font-bold bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
                        <span>🏰 던전 폐쇄 진행도: <span className="text-rose-400 font-black">{Math.floor(timeState.gateProgress)}%</span></span>
                        <span>⏰ 24:00 자동 완전 폐쇄 (오전 {String(dungeonOpenHour).padStart(2, '0')}:00 오픈)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 돌발 퀘스트 섹션 (심부름) - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div 
                onClick={() => setIsFlashQuestsCollapsed(!isFlashQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-[#EBE6DD]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'flash').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-bw">
                    ⚡ 돌발 퀘스트 섹션 (심부름 / 미션)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-755 text-xs font-bold">
                  <span>{isFlashQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isFlashQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isFlashQuestsCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                  {quests.filter(q => q.type === 'flash').length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-bold border-2 border-dashed border-[#EBE6DD] rounded-2xl bg-white/30">
                      현재 활성화된 돌발 퀘스트가 없습니다.
                    </div>
                  ) : (
                    quests.filter(q => q.type === 'flash').map(q => (
                      <div
                        key={q.id}
                        className={`p-4 bg-white border border-[#EBE6DD] rounded-2xl flex justify-between items-center shadow-sm ${
                          q.status === 'completed' ? 'opacity-65' : ''
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-[#EBE6DD]">
                            {q.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-1">{q.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold">
                              보상: 🪙 {q.rewardGold} G
                            </span>
                            <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-black flex items-center gap-1">
                              ⏱️ {q.dueTime || '18:00'} 마감
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.status === 'completed' ? (
                            <span className="text-xs text-emerald-600 font-bold">✓ 완료됨</span>
                          ) : q.status === 'request_approval' ? (
                            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 animate-pulse">
                              ⌛ 검수 대기중
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveNegotiateQuest(q);
                                  setNegotiateGold(q.rewardGold);
                                }}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl border border-[#EBE6DD] transition"
                              >
                                🤝 협상하기
                              </button>
                              <button
                                onClick={() => handleQuestCompleteClick(q)}
                                className="px-4 py-2 bg-[#644EB0] hover:bg-[#523e96] text-white text-xs font-bold rounded-xl transition shadow-md"
                              >
                                {requiresPhoto(q) ? '📸 사진 인증' : '완료 체크'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 내 마음대로 모험 섹션 (셀프 설계) - 투명도 20% 설정 */}
            <div className="bg-white/20 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div 
                onClick={() => setIsSelfQuestsCollapsed(!isSelfQuestsCollapsed)}
                className="flex justify-between items-center cursor-pointer pb-3 border-b border-[#EBE6DD]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-[#AC52F2] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-black">
                    {quests.filter(q => q.type === 'self').length}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-bw">
                    🧚‍♀️ 내 마음대로 모험 섹션 (셀프 설계)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-755 text-xs font-bold">
                  <span>{isSelfQuestsCollapsed ? '펼치기 🔓' : '접기 🔒'}</span>
                  <span className="text-md">{isSelfQuestsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>

              {!isSelfQuestsCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                  {quests.filter(q => q.type === 'self').length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-bold border-2 border-dashed border-[#EBE6DD] rounded-2xl bg-white/30">
                      현재 등록된 내 마음대로 모험이 없습니다.
                    </div>
                  ) : (
                    quests.filter(q => q.type === 'self').map(q => (
                      <div
                        key={q.id}
                        className={`p-4 bg-white border border-[#EBE6DD] rounded-2xl flex justify-between items-center shadow-sm ${
                          q.status === 'completed' ? 'opacity-65' : ''
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {q.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-1">{q.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold">
                              보상: 🪙 {q.rewardGold} G
                            </span>
                            <span className="text-[9px] text-[#AC52F2] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-black flex items-center gap-1">
                              스스로 설계한 모험
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.status === 'completed' ? (
                            <span className="text-xs text-emerald-600 font-bold">✓ 완료됨</span>
                          ) : q.status === 'request_approval' ? (
                            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 animate-pulse">
                              ⌛ 검수 대기중
                            </span>
                          ) : q.status === 'pending' ? (
                            <span className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-pulse">
                              ⌛ 제안 승인 대기중
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuestCompleteClick(q)}
                                className="px-4 py-2 bg-[#644EB0] hover:bg-[#523e96] text-white text-xs font-bold rounded-xl transition shadow-md"
                              >
                                {requiresPhoto(q) ? '📸 사진 인증' : '완료 체크'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 상점 탭 (상점 아이템 목록 + 현금화 정산 신청) */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* 상점 리스트 - 투명도 50% 설정 */}
            <div className="bg-white/50 border border-[#EBE6DD] backdrop-blur-md rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-[#EBE6DD] pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-bw">
                  🛍️ 레벨 제한 길드 상점
                </h3>
                <button
                  onClick={() => setIsPayoutOpen(true)}
                  className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition font-bold"
                >
                  🪙 현금화 정산 신청
                </button>
              </div>

              <div className="space-y-3">
                {storeItems.map(item => {
                  const isLocked = child.level < item.requiredLevel;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-sm ${
                        isLocked
                          ? 'bg-[#FAF8F5]/40 border-slate-200 opacity-60'
                          : 'bg-white border-[#EBE6DD]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 font-bw">
                            {item.name}
                            {isLocked && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-650 border border-red-200">
                                🔒 Lv.{item.requiredLevel} 잠금
                              </span>
                            )}
                            {item.status === 'requested' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white animate-pulse">
                                결재 대기
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">{item.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-amber-600 block">{item.price} G</span>
                          {!isLocked && item.status !== 'requested' && (
                            <button
                              onClick={() => handlePurchaseItem(item)}
                              className="mt-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition"
                            >
                              구매하기
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 카메라 찰칵 사진 촬영 모사 모달 */}
      {activeCameraQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
                📸 카메라 인증 촬영
              </span>
              <h3 className="text-lg font-bold text-white">[{activeCameraQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">공부 노트 또는 독서 흔적을 카메라로 찍어 전송하세요.</p>
            </div>

            {/* 카메라 뷰 모사 구역 */}
            <div className="aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden shadow-inner select-none">
              <img 
                src={getAutoMatchedPhotoUrl(activeCameraQuest)} 
                alt="Camera live mock preview" 
                className="w-full h-full object-cover brightness-90 contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 text-left">
                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 rounded-lg w-max mb-1">
                  ✨ 시연용 매칭 사진 자동 캡쳐 로드 완료
                </span>
                <span className="text-[9px] font-medium text-slate-300">
                  [{activeCameraQuest.category}] 퀘스트 성격에 완벽히 매치되는 고품질 검증 사진을 자동 매핑했습니다.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveCameraQuest(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                취소
              </button>
              <button
                onClick={handleCameraCaptureConfirm}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                📸 사진 촬영 및 전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 밀당 골드 협상하기 모달 */}
      {activeNegotiateQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🤝 퀘스트 보상 밀당(협상하기)
              </span>
              <h3 className="text-md font-bold text-white">[{activeNegotiateQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">길드마스터가 제안한 {activeNegotiateQuest.rewardGold}G 보상에 대해 협상을 진행해 보세요.</p>
            </div>

            <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center font-bold text-xs">
                <span className="text-slate-400">제안 금액</span>
                <span className="text-amber-400 text-md font-black">{negotiateGold} G</span>
              </div>
              <input
                type="range"
                min={activeNegotiateQuest.rewardGold}
                max={activeNegotiateQuest.rewardGold * 2}
                step={50}
                value={negotiateGold}
                onChange={(e) => setNegotiateGold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>최소 {activeNegotiateQuest.rewardGold}G</span>
                <span>최대 {activeNegotiateQuest.rewardGold * 2}G</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveNegotiateQuest(null)}
                className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handleNegotiationSubmit}
                className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                ⚡ 보상 협상 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upstage Solar Pro 3.0 아이템 아이콘 생성기 모달 */}
      {isGeneratingItemIcon && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6 relative overflow-hidden select-none">
            {/* 레이저 주사선 스캔 모션 */}
            <div className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-[bounce_1.8s_infinite] top-0" />

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse mx-auto">
                🤖 Upstage Solar Pro 3.0 Icon Generator
              </span>
              <h3 className="text-base font-extrabold text-white mt-2">[{generatingItemName}]</h3>
              <p className="text-[10px] text-slate-400">텍스트 분석 기반 맞춤형 로우폴리 리소스를 실시간 생성하고 있습니다.</p>
            </div>

            {/* 진행율 표시 바 */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-[9px] text-amber-350 font-bold">
                <span>{itemGenerationStep === 1 ? 'Prompting Solar Pro 3.0...' : itemGenerationStep === 2 ? 'De-noising & Style Matching...' : 'Finalizing Vector Texture...'}</span>
                <span>{itemGenerationStep === 1 ? '35%' : itemGenerationStep === 2 ? '70%' : '100%'}</span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: itemGenerationStep === 1 ? '35%' : itemGenerationStep === 2 ? '70%' : '100%' }}
                />
              </div>
            </div>

            {/* 실시간 빌드 로그 */}
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl text-[9px] font-mono text-left text-slate-400 space-y-1 h-24 overflow-y-auto">
              {itemGenerationStep >= 1 && <p className="text-amber-400">✓ [SOLAR] Solar Pro 3.0 LLM: "가방 아이콘/텍스처" 파싱 개시</p>}
              {itemGenerationStep >= 1 && <p className="text-slate-500">✓ [SOLAR] 매칭 키워드: "{generatingItemName.slice(0, 10)}" 스타일 매핑</p>}
              {itemGenerationStep >= 2 && <p className="text-indigo-400">✓ [DIFF] 2D 로우폴리 노이즈 제거 및 메쉬 드로잉 중...</p>}
              {itemGenerationStep >= 2 && <p className="text-slate-500">✓ [DIFF] 픽셀 그리드 보정 및 쉐이더 라이팅 연산 완료</p>}
              {itemGenerationStep >= 3 && <p className="text-emerald-400">✓ [SYS] 생성 이미지 병합 완료! 즉시 인벤토리에 지급 대기</p>}
            </div>
          </div>
        </div>
      )}

      {/* 셀프 퀘스트 빌더 모달 */}
      {isSelfQuestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white">🧚‍♀️ 셀프 모험 설계 (Self-Quest)</h3>
              <button onClick={() => setIsSelfQuestOpen(false)} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
            </div>

            <form onSubmit={handleSelfQuestSubmit} className="space-y-4">
              {/* 시연용 원클릭 퀵 템플릿 */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-amber-400">⚡ 시연 퀵 템플릿</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelfQuestTitle('30분 줄넘기 하기');
                    setSelfQuestGold(300);
                  }}
                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg transition"
                >
                  🏃‍♂️ [30분 줄넘기 하기] 세팅
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">스스로 만들 모험 이름</label>
                <input
                  type="text"
                  placeholder="예: 30분 동안 수학 오답 정리하기"
                  value={selfQuestTitle}
                  onChange={(e) => setSelfQuestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">목표 보상 설정 (골드, 최대 500G)</label>
                <input
                  type="number"
                  min="100"
                  max="500"
                  step="50"
                  value={selfQuestGold}
                  onChange={(e) => setSelfQuestGold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                💡 셀프 퀘스트는 하루 최대 2개만 전송할 수 있으며, 성공 시 경험치와 골드가 동시 지급됩니다. 무의미한 도배 방지를 위해 슬롯 제한이 적용됩니다.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelfQuestOpen(false)}
                  className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  ⚡ 스스로 모험 제안
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 현금 정산 인출 모달 */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🪙 골드 현금 전환 요청
              </span>
              <h3 className="text-md font-bold text-white">실제 현금 인출</h3>
              <p className="text-xs text-slate-400 mt-1">보유한 골드를 실제 화폐(1G=1원)로 전환하여 용돈 계좌이체를 요청합니다.</p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>내 보유 골드</span>
                <span className="text-amber-400 font-black">{child.gold.toLocaleString()} G</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-900">
                <span>신청할 인출량</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-24 text-right bg-slate-900 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 font-bold"
                  />
                  <span>G</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="py-3 bg-slate-800 text-slate-350 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handlePayoutSubmit}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl text-xs shadow-md"
              >
                🪙 전환 결재 올리기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 카메라 찰칵 사진 촬영 모사 모달 */}
      {activeCameraQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                📸 완료 증빙 전송
              </span>
              <h3 className="text-base font-extrabold text-white">[{activeCameraQuest.title}]</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">증빙 방식(카메라 직접 촬영 또는 스캔 파일 첨부)을 선택하세요.</p>
            </div>

            {isAnalyzing ? (
              <div className="py-6 px-4 bg-slate-950/90 rounded-2xl border border-slate-850 space-y-4 relative overflow-hidden select-none">
                {/* 레이저 스캐너 라인 애니메이션 */}
                <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-[bounce_2s_infinite] top-0" />
                
                {/* AI Upstage Scan Animation */}
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl mx-auto shadow-inner animate-pulse">
                  🤖
                </div>
                
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    {analysisStep === 1 ? 'Upstage Layout Parser 기동 중...' : analysisStep === 2 ? '문서 구조 분석 및 텍스트 디코딩...' : '분석 완료! 승인 요청 전송 준비'}
                  </h4>
                  <p className="text-[9px] text-indigo-400 mt-1 font-semibold">자필 독서 소감문 및 문제집 풀이 흔적 검출</p>
                </div>

                {/* 진행 상황 상태 바 */}
                <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: analysisStep === 1 ? '30%' : analysisStep === 2 ? '70%' : '100%' }}
                  />
                </div>

                {/* 실시간 텍스트 디코더 로그 피드 */}
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-[9px] font-mono text-left text-slate-400 space-y-1 h-24 overflow-y-auto">
                  {analysisStep >= 1 && <p className="text-indigo-400">✓ [SYS] Upstage Layout Parser API 연동 완료</p>}
                  {analysisStep >= 1 && <p className="text-slate-350">✓ [SYS] 문서 영역 검출 및 문단 블록 분할 중...</p>}
                  {analysisStep >= 2 && <p className="text-indigo-400">✓ [OCR] 손글씨 인식 텍스트 디코딩 개시</p>}
                  {analysisStep >= 2 && <p className="text-slate-350">✓ [OCR] 추출된 자필 서명 분석률 99.1% 매칭</p>}
                  {analysisStep >= 3 && <p className="text-emerald-400">✓ [AI] 분석 검수 보고서 작성 완료! 전송 대기</p>}
                </div>
              </div>
            ) : (
              <>

            {/* 초기 상태: 모드 선택 유도 */}
            {cameraMode === 'idle' && (
              <div className="py-8 px-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3">
                <button
                  type="button"
                  onClick={() => setCameraMode('capture')}
                  className="w-full py-3 bg-indigo-600/90 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white font-black rounded-xl text-xs transition duration-200 shadow-md flex items-center justify-center gap-1.5"
                >
                  📷 실시간 카메라로 사진 촬영
                </button>
                <label className="w-full py-3 bg-slate-800 hover:bg-slate-750 hover:scale-105 active:scale-95 text-slate-200 font-bold rounded-xl text-xs transition duration-200 border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer">
                  📁 스캔한 파일 불러오기 및 전송
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.gif"
                  />
                </label>
              </div>
            )}

            {/* 카메라 뷰 모사 구역 */}
            {cameraMode === 'capture' && (
              <div className="space-y-4">
                <div className="aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-600 relative overflow-hidden shadow-inner select-none">
                  <Camera className="w-12 h-12 text-slate-700 animate-pulse mb-2" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LIVE CAMERA VIEW MOCK</span>
                  
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-[10px] text-slate-400 font-bold border-t border-slate-900">
                    [화면을 터치하여 실시간 인증 샷 캡쳐]
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraMode('idle')}
                    className="w-1/3 py-2 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
                  >
                    이전으로
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraCaptureConfirm}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md"
                  >
                    📸 촬영 완료 및 승인 요청
                  </button>
                </div>
              </div>
            )}

            {/* 스캔 파일 업로드 구역 */}
            {cameraMode === 'upload' && (
              <div className="space-y-4">
                <div className="p-6 bg-slate-955 rounded-2xl border border-dashed border-indigo-500/30 flex flex-col items-center justify-center text-slate-400">
                  <span className="text-3xl mb-2 select-none">📄</span>
                  <span className="text-xs font-black text-slate-350">{uploadedFile}</span>
                  <span className="text-[9px] text-emerald-400 mt-1 font-bold">✓ 파일 스캔 완료 (준비됨)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraMode('idle');
                      setUploadedFile(null);
                    }}
                    className="w-1/3 py-2 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
                  >
                    다시 선택
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraCaptureConfirm}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md"
                  >
                    📁 스캔한 파일 최종 전송하기
                  </button>
                </div>
              </div>
            )}

            {cameraMode === 'idle' && (
              <button
                onClick={() => {
                  setActiveCameraQuest(null);
                  setCameraMode('idle');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition"
              >
                닫기
              </button>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 밀당 골드 협상하기 모달 */}
      {activeNegotiateQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🤝 퀘스트 보상 밀당(협상하기)
              </span>
              <h3 className="text-md font-bold text-white">[{activeNegotiateQuest.title}]</h3>
              <p className="text-xs text-slate-400 mt-1">길드마스터가 제안한 {activeNegotiateQuest.rewardGold}G 보상에 대해 협상을 진행해 보세요.</p>
            </div>

            {/* 슬라이더 제어 */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center font-bold text-xs">
                <span className="text-slate-400">제안 금액</span>
                <span className="text-amber-400 text-md font-black">{negotiateGold} G</span>
              </div>
              <input
                type="range"
                min={activeNegotiateQuest.rewardGold}
                max={activeNegotiateQuest.rewardGold * 2}
                step={50}
                value={negotiateGold}
                onChange={(e) => setNegotiateGold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>최소 {activeNegotiateQuest.rewardGold}G</span>
                <span>최대 {activeNegotiateQuest.rewardGold * 2}G</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveNegotiateQuest(null)}
                className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handleNegotiationSubmit}
                className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                ⚡ 보상 협상 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 셀프 퀘스트 빌더 모달 */}
      {isSelfQuestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-white">🧚‍♀️ 셀프 모험 설계 (Self-Quest)</h3>
              <button onClick={() => setIsSelfQuestOpen(false)} className="text-slate-400 hover:text-white transition text-lg">&times;</button>
            </div>

            <form onSubmit={handleSelfQuestSubmit} className="space-y-4">
              {/* 시연용 원클릭 퀵 템플릿 */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-amber-400">⚡ 시연 퀵 템플릿</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelfQuestTitle('30분 줄넘기 하기');
                    setSelfQuestGold(300);
                  }}
                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg transition"
                >
                  🏃‍♂️ [30분 줄넘기 하기] 세팅
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">스스로 만들 모험 이름</label>
                <input
                  type="text"
                  placeholder="예: 30분 동안 수학 오답 정리하기"
                  value={selfQuestTitle}
                  onChange={(e) => setSelfQuestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">목표 보상 설정 (골드, 최대 500G)</label>
                <input
                  type="number"
                  min="100"
                  max="500"
                  step="50"
                  value={selfQuestGold}
                  onChange={(e) => setSelfQuestGold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                💡 셀프 퀘스트는 하루 최대 2개만 전송할 수 있으며, 성공 시 경험치와 골드가 동시 지급됩니다. 무의미한 도배 방지를 위해 슬롯 제한이 적용됩니다.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelfQuestOpen(false)}
                  className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  ⚡ 스스로 모험 제안
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 현금 정산 인출 모달 */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2">
                🪙 골드 현금 전환 요청
              </span>
              <h3 className="text-md font-bold text-white">실제 현금 인출</h3>
              <p className="text-xs text-slate-400 mt-1">보유한 골드를 실제 화폐(1G=1원)로 전환하여 용돈 계좌이체를 요청합니다.</p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>내 보유 골드</span>
                <span className="text-amber-400 font-black">{child.gold.toLocaleString()} G</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-900">
                <span>신청할 인출량</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-24 text-right bg-slate-900 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 font-bold"
                  />
                  <span>G</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                취소
              </button>
              <button
                onClick={handlePayoutSubmit}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl text-xs shadow-md"
              >
                🪙 전환 결재 올리기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 퀘스트 완료 여부 확인 팝업 (YES/NO) */}
      {confirmQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white border border-[#EBE6DD] rounded-3xl p-6 shadow-xl text-center space-y-4">
            <div>
              <span className="text-3xl">🛡️</span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-2">[{confirmQuest.title}]</h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">해당 퀘스트를 완료했나요?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmQuest(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition border border-slate-200"
              >
                NO
              </button>
              <button
                onClick={async () => {
                  const q = confirmQuest;
                  setConfirmQuest(null);
                  if (requiresPhoto(q)) {
                    setActiveCameraQuest(q);
                    setCameraMode('idle');
                    setUploadedFile(null);
                  } else {
                    await childRequestQuestApproval(q.id, q.title, '', child.id, child.name);
                    await loadData();
                    alert(`🛡️ [인증 완료] [${q.title}] 인증 요청을 길드마스터에게 전송했습니다.`);
                  }
                }}
                className="w-full py-2 bg-[#644EB0] hover:bg-[#523e96] text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 신규 퀘스트 도착 알림 팝업 모달 */}
      {newArrivalQuests.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#1E1B4B] to-[#0F0E26] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in duration-200 border-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl mx-auto animate-bounce">
              ✉️
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-400 font-bw">📜 새로운 퀘스트 도착!</h3>
              <p className="text-xs text-slate-350 mt-1">길드마스터로부터 새로운 임무가 전달되었습니다.</p>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-left max-h-48 overflow-y-auto space-y-2.5">
              {newArrivalQuests.map((q, idx) => (
                <div key={idx} className="flex gap-2.5 items-start bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-xl shrink-0 p-1 bg-indigo-950/50 rounded-lg border border-indigo-900/30">
                    {q.category === '독서' ? '📖' : q.category === '학습' ? '📚' : q.category === '생활' ? '🏠' : q.category === '심부름' ? '🛒' : q.category === '청소' ? '🧹' : '🐶'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-black px-1 rounded-sm border ${
                        q.type === 'main' 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}>
                        {q.type === 'main' ? '메인' : '돌발'}
                      </span>
                      <span className="text-[9px] text-amber-500 font-bold">+{q.rewardExp || q.rewardGold}{q.type === 'main' ? 'EXP' : 'G'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100 mt-1 truncate">{q.title}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setNewArrivalQuests([])}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1"
            >
              🛡️ 임무 확인 완료
            </button>
          </div>
        </div>
      )}

      {/* 길드마스터(부모) 퀘스트 독려 알림 팝업 모달 */}
      {newCheerNoti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#1E1B4B] to-[#0F0E26] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in duration-200 border-2">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-4xl mx-auto animate-bounce">
              📣
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-400 font-bw">📣 길드마스터의 콕콕 찌르기 👉</h3>
              <p className="text-xs text-slate-300 mt-1 font-bold">길드마스터로부터 특별 지령이 도착했습니다.</p>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
              <p className="text-xs text-slate-100 leading-relaxed font-bold">
                {newCheerNoti.message}
              </p>
            </div>

            <button
              onClick={() => setNewCheerNoti(null)}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1"
            >
              🛡️ 임무 완수하러 가기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
