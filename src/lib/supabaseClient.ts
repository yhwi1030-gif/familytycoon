import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// URL 형식이 올바른지 (http/https로 시작하는지) 및 임시 placeholder 상태가 아닌지 검증
const isUrlValid = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');
const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase');

export const isSupabaseConfigured = !!(isUrlValid && supabaseAnonKey && !isPlaceholder);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    "⚠️ Supabase 환경 변수가 설정되지 않았거나 형식이 올바르지 않습니다. LocalStorage 백업 모드로 안전하게 작동합니다."
  );
}

// 초기화 시 URL 에러로 인한 전체 JS 런타임 붕괴(Crash)를 원천 차단하기 위한 예방 블록
let supabaseInstance;
try {
  supabaseInstance = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project-id.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
  );
} catch (e) {
  console.error("⚠️ Supabase Client 초기화 오류 (Fallback 클라이언트로 대체):", e);
  supabaseInstance = createClient('https://placeholder-project-id.supabase.co', 'placeholder-anon-key');
}

export const supabase = supabaseInstance;
