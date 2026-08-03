-- Family Dungeon Tycoon - Supabase Database Schema
-- 복사하여 Supabase SQL Editor에 붙여넣고 실행해 주세요.

-- 1. 프로필 테이블 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    title TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 1000,
    stress INTEGER NOT NULL DEFAULT 0,
    style TEXT, -- lighthouse, monarch, guardian, hunter
    child_class TEXT, -- scholar, pioneer, guardian, bard
    stats JSONB, -- intelligence, willpower, autonomy, cooperation, sensibility
    buffs JSONB DEFAULT '[]'::jsonb,
    inventory JSONB DEFAULT '[]'::jsonb,
    password TEXT, -- 회원가입 비밀번호
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.profiles FOR ALL USING (true) WITH CHECK (true);


-- 2. 퀘스트 테이블 (Quests)
CREATE TABLE IF NOT EXISTS public.quests (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('main', 'flash', 'self')),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    reward_exp INTEGER NOT NULL DEFAULT 0,
    reward_gold INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'request_approval', 'completed', 'rejected')),
    streak_count INTEGER DEFAULT 0,
    child_id TEXT,
    child_name TEXT,
    due_time TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.quests FOR ALL USING (true) WITH CHECK (true);


-- 3. 상점 상품 테이블 (Store Items)
CREATE TABLE IF NOT EXISTS public.store_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    required_level INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.store_items FOR ALL USING (true) WITH CHECK (true);


-- 4. 알림 테이블 (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    target_id TEXT,
    meta JSONB
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON public.notifications FOR ALL USING (true) WITH CHECK (true);


-- 초기 데이터 삽입 (기본 데모용 모의 데이터)
-- ※ 회원가입으로 시작할 경우 이 데이터는 비워지거나 무시될 수 있습니다.
INSERT INTO public.profiles (id, role, name, avatar, pin, title, level, exp, gold, stress, style)
VALUES 
('parent1', 'parent', '엄마 (길드마스터)', '🧙‍♀️', '1234', '현명한 등대형', 1, 0, 1000, 0, 'lighthouse')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, role, name, avatar, pin, title, level, exp, gold, stress, style)
VALUES 
('parent2', 'parent', '아빠 (부길드마스터)', '🧙‍♂️', '5678', '자애로운 수호자형', 1, 0, 1000, 0, 'guardian')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, role, name, avatar, pin, title, level, exp, gold, stress, child_class, stats)
VALUES 
('child1', 'child', '민우 (꼬마 전사)', '🛡️', '0000', '지혜의 학자형', 1, 20, 1000, 40, 'scholar', '{"intelligence": 30, "willpower": 25, "autonomy": 20, "cooperation": 35, "sensibility": 15}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quests (id, type, title, category, reward_type, reward_exp, reward_gold, status, streak_count, child_id, child_name)
VALUES
('q1', 'main', '매일 학습지 풀기', '학습', 'exp', 20, 0, 'active', 3, 'child1', '민우 (꼬마 전사)'),
('q2', 'main', '하루 30분 독서하기', '독서', 'exp', 15, 0, 'active', 5, 'child1', '민우 (꼬마 전사)'),
('q3', 'main', '학원 숙제 끝내기', '학습', 'exp', 20, 0, 'active', 2, 'child1', '민우 (꼬마 전사)'),
('q4', 'main', '기상하기', '생활', 'exp', 10, 0, 'completed', 0, 'child1', '민우 (꼬마 전사)'),
('q5', 'main', '이불 정리하기', '생활', 'exp', 10, 0, 'completed', 0, 'child1', '민우 (꼬마 전사)'),
('q6', 'main', '양치질하기', '생활', 'exp', 10, 0, 'active', 0, 'child1', '민우 (꼬마 전사)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quests (id, type, title, category, reward_type, reward_exp, reward_gold, status, due_time, child_id, child_name)
VALUES
('q7', 'flash', '우유 사오기', '심부름', 'gold', 0, 500, 'active', '18:30', 'child1', '민우 (꼬마 전사)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_items (id, name, price, required_level, type, status, description, image_url)
VALUES
('s1', '[아바타] 기본 티셔츠', 300, 1, 'ingame', 'available', '초반 성취감 부여를 위한 아바타 기본 꾸미기 의상', '/tshirt.jfif'),
('s2', '[식품] 편의점 최애 간식 교환권', 400, 2, 'coupon', 'available', '가게 부담 없는 소액 체득 단계 쿠폰', '/snack.jfif'),
('s3', '[쿠폰] 오늘 하루 30분 늦게 자기', 200, 1, 'coupon', 'available', '비재화성 생활 밀착형 보상권', '/sleep.jfif'),
('s4', '[용돈] 실제 현금 5,000원 계좌이체', 1200, 4, 'real', 'locked', '본격적인 루틴 형성을 위한 금융 보상', '/money5k.jfif'),
('s5', '[패스] 주말 PC방 자유 이용 1시간', 600, 3, 'coupon', 'locked', '부모 협의형 최고 인기 비재화 보상', '/pcpass.jfif'),
('s6', '[패스] 오늘 하루 메인 퀘스트 면제권', 1500, 5, 'coupon', 'locked', '셀프 모험 보너스를 모아야 살 수 있는 꿀맛 쿠폰', '/shield.jfif'),
('s7', '[용돈] 실제 현금 10,000원 전환권', 3000, 7, 'real', 'locked', '장기 루틴 형성을 위한 대형 보상', '/money10k.jfif'),
('s8', '[외식] 불금 가족 소원 치킨/피자 쏘기', 3000, 6, 'real', 'locked', '자녀에게 가족 주도권을 부여하는 성취 단계 상품', '/chicken.jfif')
ON CONFLICT (id) DO NOTHING;
