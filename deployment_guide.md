# 🚀 패밀리 던전 타이쿤 - Vercel 클라우드 배포 매뉴얼

본 프로젝트는 Next.js로 개발되어 **Vercel** 플랫폼을 사용해 클릭 몇 번으로 평생 무료(Hobby Plan) 배포가 가능합니다. 본 매뉴얼을 천천히 읽고 따라 해보세요.

---

## Step 1. 코드를 GitHub 저장소에 업로드하기
Vercel은 GitHub 코드 변경을 감지하여 실시간 배포하므로, 본 소스 코드가 GitHub Repository에 보관되어 있어야 합니다.

1. **GitHub 계정 생성 및 로그인**: [GitHub(https://github.com)](https://github.com)에 로그인합니다.
2. **새 저장소 만들기**: 우측 상단 `+` 버튼 -> `New repository`를 선택합니다.
   * **Repository name**: `familytycoon` 입력
   * **Public/Private**: 코드를 보호하고 싶으시면 **`Private`** 선택
   * `Create repository` 클릭
3. **로컬 코드를 업로드하기**: 작업 중이신 에디터(VS Code 등)의 터미널에 아래 명령어를 차례로 입력하여 코드를 Push합니다:
   ```bash
   # (프로젝트 폴더 경로에서 실행)
   git remote add origin https://github.com/본인의깃허브ID/familytycoon.git
   git branch -M master
   git push -u origin master
   ```

---

## Step 2. Vercel 가입 및 프로젝트 가져오기
1. [Vercel 홈페이지(https://vercel.com)](https://vercel.com)에 접속하여 **`Sign Up`**을 진행합니다. (가입 시 **GitHub** 계정 연동 로그인을 추천합니다.)
2. 대시보드 화면 우측 상단의 **`Add New...`** -> **`Project`** 버튼을 클릭합니다.
3. **`Import Git Repository`** 목록에서 방금 생성하여 업로드한 **`familytycoon`** 저장소를 찾은 후 **`Import`**를 클릭합니다.

---

## Step 3. Supabase 환경 변수 설정 및 최종 배포 (중요)
Vercel에서 프로젝트 빌드 설정 화면이 나타나면, 배포 전에 반드시 Supabase 정보를 입력해 주어야 합니다.

1. **`Environment Variables`** (환경 변수) 아코디언 메뉴를 클릭하여 엽니다.
2. 아래 두 개의 변수를 동일하게 추가합니다:
   * **Key**: `NEXT_PUBLIC_SUPABASE_URL`
     * **Value**: `.env.local` 파일에 있는 `https://xylrkffhblgylrvczpid.supabase.co` 입력 후 **`Add`** 클릭
   * **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     * **Value**: `.env.local` 파일에 채워 넣으신 본인의 **anon key 값** 입력 후 **`Add`** 클릭
3. 모든 세팅을 완료했다면, 맨 아래 파란색 **`Deploy`** 버튼을 누릅니다.
4. 약 1~2분 후 배포(빌드)가 완료되면, 불꽃놀이 축하 애니메이션과 함께 고유의 무료 도메인 주소(예: `https://familytycoon.vercel.app`)가 생성됩니다.

---

## Step 4. 배포 후 즐기기 🎮
* 이제 이 발급된 URL 주소로 부모님의 스마트폰 및 자녀의 스마트폰 등 어떤 브라우저로든 동시 접속하여 실시간 패밀리 타이쿤 모험을 함께 즐기실 수 있습니다!
* 추후 로컬에서 소스 코드를 추가 수정하여 GitHub에 `git push`로 올리시면, Vercel이 이를 실시간 감지하여 자동으로 업데이트 재배포를 완료해 줍니다.
