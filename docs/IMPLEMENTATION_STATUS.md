# Motion Meme MVP Implementation Status

## 목적

이 문서는 현재 저장소에 실제로 반영된 구현 상태, 변경 기록, 검증 결과, 남은 이슈를 추적하기 위한 운영 문서다.

기준 시점:
- 마지막 업데이트: 2026-03-10
- 기준 브랜치/작업 위치: `/Users/jeong-gyeonghun/Downloads/motion-meme-mvp`

## 현재 진행상황 요약

### 완료 또는 반영됨

- Supabase 기반 런타임 연결
  - `@supabase/ssr`, `@supabase/supabase-js` 추가
  - App Router callback, browser/server client, middleware refresh, logout action 구현
- `meme` 스키마 실제 반영
  - 테이블 19종 + 뷰 2종 + 트리거 + 인덱스 + RLS + storage bucket/policy
  - `meme` schema를 PostgREST exposed schema에 포함
- seed 반영
  - `meme_assets` 10개
  - `stages` 10개
  - 기존/신규 유저 profile bootstrap + stage 1 unlock bootstrap
- 소셜 데이터 연결
  - feed/search/profile이 mock 직접 참조가 아니라 실데이터 어댑터 경유로 동작
  - compose / like / comment / follow / bookmark / report / hide / block 브라우저 액션 연결
- DM / Realtime
  - `meme.conversations`, `meme.conversation_members`, `meme.messages` 추가
  - participant 기반 RLS + `supabase_realtime` publication 반영
  - `/messages` inbox / `/messages/[conversationId]` room 추가
  - 피드 / 프로필 / 좌측 네비게이션에서 DM 진입 가능
  - room presence / typing indicator 2차 보강
  - DM image attachment / screenshot paste / private storage signed URL 지원
  - inbox를 unread/caught-up 섹션으로 분리
  - room composer에서 모바일 / Safari 기준 fallback 안내 문구 분기
- duet reference mode
  - 피드의 `play_video` 카드에서 `Try with this clip`으로 `/play?reference=<postId>` 진입 가능
  - `/play`에서 reference clip과 내 카메라를 split-screen으로 합성
  - duet 업로드는 split-screen 결과 클립으로 공유
  - duet 결과 캡션에 `with @handle` 태그 자동 주입
  - 결과 패널에서 `DM 보내보실래요?` CTA 제공
- 플레이 화면 초안 구현
  - `/play` 라우트 추가
  - MediaPipe Pose Landmarker 기반 포즈 점수화 초안
  - 로컬 녹화 preview + 업로드 버튼 기반 publish 흐름 초안
- 플레이 보조 흐름
  - `/camera` 카메라 권한 가이드 / 재시도 흐름 추가
  - `/tutorial` 튜토리얼 / 준비 안내 추가
  - `/history` stage별 최고 점수 / 최근 영상 / 이전 기록 화면 추가
  - 기존 소셜 카드 시스템과 맞는 중앙 modal-like 레이아웃으로 정리
- 프로필 / 피드 고도화
  - 프로필 recent uploaded run spotlight 추가
  - featured post 의미를 `featured_post_id` 우선 + 최근 업로드 fallback으로 정리
  - feed `popular` 정렬을 반응 수 + 최근성 가중치로 보강
- 랜딩 보강
  - 로그인 CTA와 공개 feed preview 섹션 추가
 - 이메일 계획 정리
   - `docs/EMAIL_NOTIFICATION_PLAN.md` 추가

### 진행 중

- `/play` 화면 polish
  - idle 상태 visibility 개선
  - stage sidebar contrast 개선
  - 상태 loop 안정화
- 업로드/게시 정합성 보강
  - client cleanup 보강 완료
  - server-side 원자화는 후속 필요

### 미완료 / 후속 필요

- 모바일 Safari / 저사양 브라우저 fallback 검증
- MediaRecorder codec / 파일 크기 / thumbnail 정책 확정
- 플레이 성공 시 밈 오버레이 시각 완성도 강화
- `/play` E2E 브라우저 검증 자동화
- 댓글 이미지 첨부 / 저장 경로 안정화
- 추천성 feed 확장 포인트 설계 고도화
- Resend 이메일 알림 구현

## 프런트 기능 매트릭스

### 현재 동작하는 것

- 로그인
  - Google 로그인 버튼
  - logout
- 피드
  - 공개 feed 렌더
  - latest / popular 정렬
  - like
  - save / unsave
  - comment 작성
  - comment 이미지 첨부
  - comment 수정
  - 자기 글 삭제
  - 자기 댓글 삭제
  - 자기 글 수정
  - share / copy link
  - 타인 글 more 메뉴: report / hide / block
  - `Try with this clip` duet 진입
- DM
  - inbox 목록
  - room 채팅
  - profile / post에서 DM 진입
  - online / offline 표시
  - typing 표시
  - 이미지 첨부
  - 스크린샷 paste 첨부
- 검색/프로필
  - 프로필 조회
  - follow / unfollow
  - edit profile
  - profile account menu
  - saved memes -> likes 탭 이동
  - display preferences
  - recent uploaded run spotlight
  - featured post / featured meme 강조
- 글쓰기
  - 텍스트 post 작성
  - 이미지 post 작성
  - 스크린샷 붙여넣기 기반 이미지 첨부
  - 첨부 preview / 제거
- 플레이
  - stage 선택
  - camera 시작
  - 점수 계산
  - local preview 생성
  - 업로드 버튼 기반 게시
  - reference clip side-by-side duet
  - duet 결과 DM CTA
  - 권한 안내 / 튜토리얼 / 히스토리 보조 라우트

### 부분만 동작하는 것

- `/play` 업로드 버튼
  - 실제 업로드는 동작함
  - 다만 브라우저별 완전한 E2E 회귀 검증은 더 필요
- feed 정렬
  - `latest` / `popular` UI는 반영됨
  - 다만 추천 feed 모델은 아직 없음
- recent attempts / profile snapshot
  - 로컬 state 반영은 있음
  - 브라우저 실제 전구간 검증은 더 필요

## 현재 안 되는 버튼 / 기능

아래 항목은 “버튼이 있지만 실제 기능이 없음” 또는 “작동 조건이 더 명확히 정리돼야 함” 상태다.

## 최근 반영 항목

- `Create Post`
  - 부자연스러운 focus/border 정리
  - 모달 활성 상태 기준 스크린샷 붙여넣기 이미지 첨부
  - 첨부 preview / 제거
  - 실제 동작 버튼과 비활성 버튼 상태 구분
- feed / comment
  - 자기 글 3점 메뉴 -> 수정 / 삭제
  - 자기 댓글 수정 / 삭제
  - 댓글 이미지 첨부 / 스크린샷 붙여넣기 저장
  - share/copy link
  - 상대시간 hydration mismatch 완화
- profile
  - `Edit profile` modal
  - `Account` -> profile edit
  - `Saved Memes` -> likes tab
- search
  - trending 카드 클릭 시 query 검색 연결
- DM / support polish
  - room presence / typing indicator
  - `/play/permissions`, `/play/guide`, `/play/history` modal-like card 정리

### 후속 기술부채 메모

- DM 로직 단일화
  - 현재 실제 `/messages` 화면은 `features/messages/*` 경로를 사용한다.
  - `features/meme/browser.ts`, `features/meme/server.ts` 안에는 DM 관련 중복 구현이 일부 남아 있다.
  - 현재 기능 우선순위상 제거는 defer 했고, 후속 정리 시 DM 로직을 단일 source로 합쳐야 한다.

### 이번 턴 의도적으로 defer한 항목
- `FeedPost`의 share/send 버튼
  - 상태: 2차 구현 완료
  - 현재 동작:
    - Web Share API 또는 clipboard copy
  - 후속 필요:
    - 공유 성공 토스트/analytics 정리
- `FeedPost`의 more 버튼
  - 위치: `components/feed/FeedPost.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작:
    - 자기 글: `Edit post`, `Delete post`
    - 타인 글: `Save post`, `Copy link`, `Report post`, `Hide post`, `Block user`
- compose의 video 아이콘
  - 위치: `components/feed/ComposeModal.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작:
    - local video file attach
- compose의 type 아이콘
  - 위치: `components/feed/ComposeModal.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작:
    - textarea focus / text-first mode shortcut
- `Edit profile`
  - 위치: `components/profile/ProfileHeader.tsx`, `components/profile/EditProfileModal.tsx`
  - 상태: 1차 구현 완료
  - 현재 동작:
    - display name / handle / bio 수정 modal
- profile menu의 `Account`
  - 위치: `components/profile/ProfileMenuLayer.tsx`
  - 상태: 1차 구현 완료
  - 현재 동작:
    - Edit profile modal 열기
- profile menu의 `Saved Memes`
  - 위치: `components/profile/ProfileMenuLayer.tsx`
  - 상태: 1차 구현 완료
  - 현재 동작:
    - profile likes 탭으로 전환
- profile menu의 `Display`
  - 위치: `components/profile/ProfileMenuLayer.tsx`
  - 상태: 1차 구현 완료
  - 현재 동작:
    - compact feed
    - autoplay videos
  - 저장 방식:
    - localStorage
- 검색의 trending meme 카드들
  - 상태: 2차 구현 완료
  - 현재 동작:
    - 실제 데이터 기반 trending 계산
    - 클릭 시 해당 키워드로 `/search?q=...` 이동
  - 후속 필요:
    - 추천 피드와의 결합
- 플레이의 locked stage 버튼들
  - 위치: `features/play/PlayExperience.tsx`
  - 상태: 계속 의도적 비활성
  - 이유:
    - 순차 해금 규칙 자체가 현재 제품 동작이다.
- 플레이의 upload 버튼 전구간 재검증
  - 위치: `features/play/PlayExperience.tsx`
  - 상태: defer
  - 이유:
    - 최근 보강은 있었지만 브라우저 E2E 성격의 검증이 필요하다.
    - 이번 턴 우선순위는 소셜 compose/comment/delete UX다.

### 피드

- `FeedPost`의 more 버튼
  - 위치: `components/feed/FeedPost.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작:
    - 자기 글: `Edit post`, `Delete post`
    - 타인 글: `Save post`, `Copy link`, `Report post`, `Hide post`, `Block user`

### 글쓰기 모달

- compose의 video 아이콘
  - 위치: `components/feed/ComposeModal.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작: local video file attach
- compose의 type 아이콘
  - 위치: `components/feed/ComposeModal.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작: textarea focus / text-first mode shortcut
- compose의 camera 아이콘
  - 위치: `components/feed/ComposeModal.tsx`
  - 상태: 제거
  - 현재 동작: 없음

### 프로필

- profile menu의 `Display`
  - 위치: `components/profile/ProfileMenuLayer.tsx`
  - 상태: 1차 구현 완료
  - 현재 동작:
    - compact feed
    - autoplay videos

### 검색

- trending meme 카드들
  - 위치: `app/search/page.tsx`
  - 상태: 2차 구현 완료
  - 현재 동작:
    - 실제 데이터 기반 trending 계산
    - 클릭 시 검색 query 이동

### 플레이

- locked stage 버튼들
  - 위치: `features/play/PlayExperience.tsx`
  - 상태: 의도적 비활성
  - 현재 동작: 순차 해금 전까지 클릭 불가
- upload 버튼
  - 위치: `features/play/PlayExperience.tsx`
  - 상태: 조건부 동작
  - 현재 동작 조건:
    - result 상태여야 함
    - preview / session / local blob이 준비돼야 함
  - 비고: 최근까지 여기서 canvas ref / MIME 문제를 수정했고, 재검증이 필요함

## 변경 기록

### 2026-03-10

#### 1. 인증/세션 기반 추가

- 추가 파일
  - `middleware.ts`
  - `app/auth/callback/route.ts`
  - `app/auth/actions.ts`
  - `app/auth/login/page.tsx`
  - `app/auth/error/page.tsx`
  - `components/auth/GoogleSignInButton.tsx`
  - `components/auth/SignOutButton.tsx`
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/middleware.ts`
  - `lib/supabase/auth.ts`
  - `lib/supabase/shared.ts`
- 추가/수정 내용
  - Google OAuth 진입
  - callback code exchange
  - SSR session refresh
  - 보호 라우트 helper

#### 2. DB 스키마 실반영

- 수정 파일
  - `meme_schema.sql`
  - `DB_SCHEMA.md`
- 생성 파일
  - `supabase/migrations/20260310130000_meme_app_schema.sql`
  - `lib/database.types.ts`
- 실제 반영 내용
  - `meme.profiles`
  - `meme.meme_assets`
  - `meme.stages`
  - `meme.stage_progress`
  - `meme.play_sessions`
  - `meme.posts`
  - `meme.post_media`
  - `meme.post_comments`
  - `meme.post_likes`
  - `meme.follows`
  - `meme.profile_stats`
  - `meme.feed_posts`
  - storage buckets: `avatars`, `meme-assets`, `post-media`
  - RLS enabled table count: 10

#### 3. 데이터 레이어 및 소셜 연결

- 생성 파일
  - `features/meme/types.ts`
  - `features/meme/server.ts`
  - `features/meme/browser.ts`
  - `features/meme/storage.ts`
- 주요 수정 파일
  - `app/feed/page.tsx`
  - `app/search/page.tsx`
  - `app/profile/[handle]/page.tsx`
  - `components/layout/socialUi.ts`
  - `components/feed/ComposeModal.tsx`
  - `components/feed/FeedPost.tsx`
  - `components/profile/ProfileHeader.tsx`
  - `components/profile/ProfileMenuLayer.tsx`
  - `components/search/UserCard.tsx`
  - `components/layout/LeftRail.tsx`
  - `components/layout/MainLayout.tsx`

#### 4. 플레이 루프 초안 구현

- 생성 파일
  - `app/play/page.tsx`
  - `features/play/PlayExperience.tsx`
  - `features/play/scoring.ts`
  - `features/play/media.ts`
  - `features/play/poseTargets.ts`
- 주요 내용
  - stage 선택
  - camera/getUserMedia
  - pose similarity score
  - local preview recording
  - upload 버튼 기반 publish
  - idle placeholder / sidebar contrast 개선
  - 성공 판정 중복 저장 방지
  - 로컬 recent attempts / profile snapshot 즉시 반영

#### 5. 랜딩 보강

- 생성 파일
  - `features/landing/LandingFeedPreview.tsx`
- 수정 파일
  - `app/page.tsx`
  - `components/MouseScroll.tsx`

#### 6. 업로드 정합성 보강

- 수정 파일
  - `features/meme/browser.ts`
  - `meme_schema.sql`
  - `supabase/migrations/20260310143000_meme_atomic_post_workflows.sql`
- 주요 내용
  - 이미지 post 생성 시 실패 cleanup 추가
  - play video publish 시 실패 cleanup 추가

#### 7. 소셜 compose/comment/delete UX 보강

- 수정 파일
  - `components/feed/ComposeModal.tsx`
  - `components/feed/FeedPost.tsx`
  - `components/layout/socialUi.ts`
  - `features/meme/browser.ts`
  - `features/meme/server.ts`
  - `features/meme/types.ts`
  - `docs/IMPLEMENTATION_STATUS.md`
- 주요 내용
  - Create Post textarea focus 스타일 정리
  - 스크린샷 붙여넣기 기반 이미지 첨부, preview, 제거
  - 실제 동작 버튼과 UI-only 버튼 상태 명확화
  - 댓글 입력 UX 보강 및 실패 메시지 명확화
  - 자기 글/댓글 삭제 + 현재 보이는 목록 즉시 반영
  - 댓글 이미지 첨부 / comment_media 스키마 / UI 연결
  - DB 함수 `meme.create_post_with_media`, `meme.publish_play_session` 추가
  - partial failure에서 post/storage 찌꺼기 최소화

## 현재 검증 결과

### 통과

- `npm run lint`
- `lsp_diagnostics`
  - `components/feed/ComposeModal.tsx`
  - `components/feed/FeedPost.tsx`
  - `features/meme/browser.ts`
  - `features/meme/server.ts`
  - `components/layout/socialUi.ts`
  - `features/meme/types.ts`
- `lsp_diagnostics_directory`
- public route 응답 확인
  - `/` -> 200
  - `/feed` -> 200
  - `/search` -> 200
  - `/profile/[handle]` -> 200
- protected route redirect 확인
  - `/play` 비로그인 -> `/auth/login?next=/play`
- DB 반영 확인
  - `meme_assets` 10개
  - `stages` 10개
  - bucket 3개
  - `authenticator` role의 `pgrst.db_schemas=public,graphql_public,meme`

### 수동 확인 / 사용자 확인

- Google 로그인 성공 확인

### 아직 불충분한 검증

- compose / comment / comment media 실제 브라우저 상호작용 전 구간
- 로그인 후 `/play` 실제 브라우저 상호작용 전 구간
- stage clear -> upload -> feed reflect 완전한 수동 E2E
- 모바일 브라우저 호환성

## 현재 남은 리스크

- `/play`의 시각 완성도와 상태 전환은 계속 다듬어야 한다.
- 업로드 cleanup은 보강했지만, DB write와 storage를 완전히 원자적으로 묶지는 못했다.
- 플레이 루프는 MVP 룰 기반 점수화 수준이며, stage별 threshold/weight 튜닝이 더 필요하다.
- 댓글 이미지 첨부는 1차 연결됐지만, 복수 이미지/정렬/모바일 clipboard까지는 아직 보강이 필요하다.

## 다음 우선순위

1. 로그인 후 play -> upload -> feed E2E 재검증
2. `/play` UI/UX polish 마무리
3. upload/post/session server-side 원자화 검토
4. 댓글 media UX polish 및 모바일 clipboard 보강
5. 모바일/브라우저 fallback 정리
