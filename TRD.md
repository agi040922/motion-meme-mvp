# Motion Meme MVP TRD

## 1. 문서 개요

- 문서 목적: 1차 MVP 구현을 위한 기술 구조, 선택 스택, 핵심 리스크와 구현 원칙을 정의한다.
- 작성일: 2026-03-09
- 대응 PRD: `PRD.md`

## 2. 기술 목표

- 웹 브라우저에서 카메라를 사용해 포즈/동작을 인식한다.
- 포즈 유사도 기반 정확도 점수를 계산한다.
- 밈 오버레이가 합성된 15초 결과 영상을 생성하고 사용자가 선택적으로 업로드한다.
- 로그인, 피드, 댓글, 좋아요, 팔로우, 북마크, 1:1 DM을 포함한 SNS 구조를 단일 앱에서 제공한다.

## 3. 기술 결정 요약

### 최종 권장 스택

- 프론트엔드: Next.js + React + TypeScript
- 포즈 인식: MediaPipe Pose Landmarker
- 렌더링/연출: Canvas 2D 우선, 필요 시 PixiJS 확장
- 애니메이션: Framer Motion 또는 CSS Animation
- 오디오: Web Audio API 또는 HTMLAudioElement
- 비디오 처리: MediaRecorder API
- 백엔드: Supabase
- 인증: Supabase Auth 기반 Google 로그인
- 저장소: Supabase Postgres + Storage
- 배포: Vercel

### Supabase를 선택한 이유

- 인증, 데이터 저장, 파일 저장을 한 서비스로 묶을 수 있다.
- Google 로그인, 프로필, 피드, 영상 메타데이터를 한 데이터 모델로 관리하기 좋다.
- MVP 이후 랭킹, 플레이 기록, 짤 메타데이터, 모드 확장에 유리하다.
- 1:1 DM은 persisted message + unread state가 필요하므로 `meme.messages`에 대한 Realtime Postgres Changes 구독을 우선 사용한다.
- DM 방 생성은 `direct_key` 기반 중복 방지 + `get_or_create_direct_conversation()` RPC로 정리하고, 읽음 상태는 `conversation_members.last_read_*`에 저장한다.
- 영상 파일 자체는 Storage에 저장하고, 메타데이터와 SNS 관계형 데이터는 Postgres로 관리하기 좋다.

## 4. 아키텍처 개요

### 프론트엔드 책임

- 카메라 권한 요청 및 비디오 스트림 확보
- 포즈 랜드마크 추출
- 챌린지별 판정 로직 실행
- 포즈 유사도 점수 계산
- 성공/실패 UI 및 연출 렌더링
- 결과 영상 생성 및 업로드 전 미리보기
- 랜딩, 피드, 프로필, 기록 화면 제공
- 카메라 권한 안내 / 튜토리얼 / DM inbox / DM room 화면 제공
- 업로드된 `play_video` 게시물을 reference video로 재생하는 duet mode 지원

### 백엔드 책임

- Google OAuth 로그인 처리
- 사용자 프로필, 소개글, 대표 밈 정보 저장
- 플레이 결과, 최고 기록, 해금 상태 저장
- 피드, 댓글, 좋아요, 팔로우 데이터 저장
- DM 대화방, 읽음 상태, 북마크, 신고/차단/숨김 데이터 저장
- 밈/짤 메타데이터 저장
- 결과 영상 파일 저장

## 5. 핵심 구현 원칙

### 5.1 원본 카메라 스트림은 서버 업로드를 기본값으로 하지 않는다

- 프라이버시 부담을 줄이기 위해 실시간 카메라 원본 프레임 스트리밍은 서버 업로드하지 않는다.
- 브라우저에서 포즈를 계산하고, 결과 영상은 사용자가 업로드 버튼을 눌렀을 때만 저장한다.
- 서버에는 점수, 성공 이벤트, 메타데이터, 게시물 정보가 전송된다.

### 5.2 판정은 룰 기반 + 포즈 유사도 방식으로 시작한다

- 1차 MVP는 AI 분류 모델을 새로 학습하지 않는다.
- 포즈 랜드마크의 각도, 상대 위치, 유지 시간 기반 룰 엔진으로 판정한다.
- 목표 포즈와 현재 포즈의 유사도를 계산해 0~100 점수로 환산한다.
- 예:
  - 양손이 어깨보다 위에 있는가
  - 양 무릎 각도가 특정 범위 안에 있는가
  - 몸 중심이 좌우 기준선 안에 있는가
  - 목표 자세를 0.5초 이상 유지했는가

### 5.3 연출은 제품 차별점으로 본다

- 성공 시 정지 프레임, 플래시, 확대, O 마크, 밈 카드, 사운드, 콤보 이펙트를 우선한다.
- 단순 정확도보다 “성공했을 때 얼마나 재밌는가”를 주요 설계 기준으로 삼는다.
- 업로드 가능한 결과물은 밈 오버레이까지 포함된 최종 영상이어야 한다.

## 6. 프론트엔드 상세 설계

### 6.1 주요 화면

- 랜딩 페이지
- 로그인 유도 섹션
- 피드 페이지
- 카메라 권한 안내 페이지
- 튜토리얼 페이지
- 플레이 페이지
- 결과 요약 페이지
- 기록 페이지
- 업로드 미리보기 페이지
- 프로필 페이지

### 6.2 플레이 화면 레이어 구조

1. 배경 레이어
2. 카메라 비디오 레이어
3. 어두운 마스킹 및 스포트라이트 레이어
4. 스틱맨/목표 포즈 가이드 레이어
5. 판정 상태 텍스트 및 진행 UI
6. 성공/실패 이펙트 레이어
7. 밈 오버레이 레이어
8. 녹화/업로드 UI 레이어

### 6.3 상태 관리

- 로컬 UI 상태는 React state 또는 Zustand 중 하나로 관리
- 세션/사용자/플레이 결과는 Supabase와 동기화
- 포즈 프레임 단위 데이터는 서버 저장 없이 메모리에서만 처리
- 피드, 댓글, 좋아요, 팔로우 상태는 서버와 동기화한다
- DM inbox/room은 browser Supabase client 단일 인스턴스에서 room 단위 Realtime 구독 후 cleanup 한다

### 6.4 렌더링 전략

- 1차는 `canvas` 기반 오버레이로 시작
- 이미지/텍스트/스틱/플래시 정도까지는 Canvas 2D로 충분
- 파티클, 글로우, 글리치, 왜곡 효과가 많아지면 PixiJS로 확장
- 비디오 결과물 생성은 `camera stream + overlay canvas` 합성 전략을 검토한다
- duet mode는 `reference <video> + local camera + overlay canvas`를 하나의 split-screen canvas로 합성해 업로드 결과에 그대로 반영한다

## 7. 포즈 인식 및 판정 설계

### 7.1 카메라 입력

- `navigator.mediaDevices.getUserMedia()` 사용
- 기본 해상도는 720p 이하로 제한해 성능 우선
- 모바일에서는 전면 카메라를 기본값으로 검토 가능
- 결과 업로드 영상 길이는 최대 15초로 제한한다
- duet mode에서는 reference video는 재생 전용이며, 판정은 항상 로컬 카메라 기준으로만 수행한다

### 7.2 포즈 인식

- MediaPipe Pose Landmarker로 주요 관절 좌표 획득
- 프레임마다 랜드마크를 받아 smoothing 적용
- 필요 시 추론 프레임은 15~24fps로 제한해 안정성 확보

### 7.3 포즈 유사도 점수화

- 목표 포즈의 기준 랜드마크 또는 파생 각도 세트를 정의한다.
- 현재 프레임의 랜드마크를 정규화한 뒤 목표값과 비교한다.
- 항목별 점수를 가중 합산해 최종 정확도 점수를 계산한다.
- 권장 표시 방식:
  - `90~100`: Perfect
  - `75~89`: Success
  - `60~74`: Close
  - `0~59`: Fail
- 점수 구성 예시:
  - 팔/상체 자세 35
  - 다리 자세 25
  - 좌우 중심/균형 15
  - 위치 정합성 10
  - 유지 시간 15

### 7.4 판정 엔진

- 챌린지별 JSON 설정 기반 룰 테이블 방식
- 예시 스키마:
  - `id`
  - `name`
  - `unlockOrder`
  - `targetPose`
  - `angleRules`
  - `positionRules`
  - `holdMs`
  - `successMemeId`
  - `minScoreToClear`
- 판정 점수는 0~100 범위로 계산하고, 임계값 이상이면 성공 처리

### 7.5 스테이지 구조

- 스테이지는 최소 10단계 이상으로 구성한다.
- 스테이지는 순차 해금 방식이다.
- 전체 테마는 분리하지 않고 하나의 일관된 무대형 경험 안에서 난이도만 단계적으로 올린다.
- 각 스테이지는 별도의 목표 포즈/동작과 밈 보상 자산을 가진다.

## 8. 백엔드 상세 설계

### 8.1 인증

- Supabase Auth의 Google OAuth만 사용한다
- 비로그인 상태에서는 랜딩과 피드 미리보기까지만 허용한다
- 플레이, 업로드, 댓글, 좋아요, 팔로우는 로그인 이후만 허용한다

### 8.2 데이터 모델 초안

#### `profiles`

- `id`
- `username`
- `display_name`
- `bio`
- `avatar_url`
- `featured_meme_id`
- `best_score`
- `total_play_count`
- `created_at`

#### `stages`

- `id`
- `order_no`
- `title`
- `target_pose_key`
- `min_score_to_clear`
- `meme_asset_id`
- `is_active`

#### `stage_progress`

- `id`
- `profile_id`
- `stage_id`
- `best_score`
- `cleared`
- `last_played_at`

#### `play_sessions`

- `id`
- `profile_id`
- `stage_id`
- `score`
- `success`
- `video_url`
- `thumbnail_url`
- `duration_sec`
- `uploaded_to_feed`
- `played_at`

#### `posts`

- `id`
- `profile_id`
- `post_type`
- `caption`
- `image_url`
- `video_url`
- `play_session_id`
- `like_count`
- `comment_count`
- `created_at`

#### `post_comments`

- `id`
- `post_id`
- `profile_id`
- `content`
- `created_at`

#### `post_likes`

- `id`
- `post_id`
- `profile_id`
- `created_at`

#### `conversations`

- `id`
- `conversation_type`
- `direct_key`
- `created_by`
- `last_message_id`
- `last_message_preview`
- `last_message_at`
- `created_at`
- `updated_at`

#### `conversation_members`

- `conversation_id`
- `user_id`
- `joined_at`
- `last_read_message_id`
- `last_read_at`
- `created_at`
- `updated_at`

#### `messages`

- `id`
- `conversation_id`
- `sender_user_id`
- `message_type`
- `body`
- `created_at`
- `updated_at`
- `deleted_at`

#### `post_bookmarks`

- `post_id`
- `user_id`
- `created_at`

#### `post_reports`

- `id`
- `post_id`
- `reporter_user_id`
- `reason`
- `details`
- `status`
- `created_at`
- `updated_at`

#### `user_blocks`

- `blocker_user_id`
- `blocked_user_id`
- `created_at`

#### `hidden_posts`

- `post_id`
- `user_id`
- `created_at`

#### `follows`

- `id`
- `follower_id`
- `following_id`
- `created_at`

#### `meme_assets`

- `id`
- `title`
- `asset_url`
- `asset_type`
- `overlay_position_preset`
- `is_active`

### 8.3 저장 정책

- 기본 밈/오버레이 자산은 Storage에 저장
- 업로드된 이미지와 플레이 결과 영상은 Storage에 저장
- 프로필/피드/댓글/좋아요/팔로우/플레이 결과 메타데이터는 Postgres에 저장
- DM, 읽음 상태, 북마크, 신고/차단/숨김 메타데이터도 Postgres에 저장
- 프레임 단위 포즈 데이터는 저장하지 않음

### 8.4 피드 정책

- 피드는 `최신순`과 `인기순`을 지원한다
- `인기순`은 단순 최신 정렬이 아니라 반응 수와 최근성 가중치를 함께 사용한다
- 게시물은 업로드 버튼을 누른 경우에만 생성된다
- 업로드하지 않은 플레이 영상은 피드에 노출되지 않는다

## 9. 성능 전략

- 포즈 추론 입력 해상도를 낮춘다
- 렌더링과 추론 루프를 분리한다
- 고비용 이펙트는 성공 순간에만 집중 사용한다
- 모바일에서는 파티클 수와 블러 효과를 자동 축소한다
- 밈 자산은 사전 로딩 또는 경량 포맷 우선
- 영상 업로드 전에는 로컬 미리보기만 제공하고 불필요한 업로드를 줄인다

## 10. 디자인/연출 전략

### MVP 연출 키워드

- black stage
- neon lime / red accent
- glitch
- spotlight
- flash frame
- combo meter
- meme burst
- login-first landing

### 구체 연출 예시

- 성공 직전: 심장박동처럼 UI가 미세하게 확대
- 성공 순간: 화면 플래시 + O 마크 + freeze frame + 밈 오버레이 정합
- 성공 후 1초: 밈이 얼굴/몸 위에 맞물린 상태로 강하게 튀어나옴
- 연속 성공 시: 콤보 텍스트와 사운드 강화
- 실패 시: 붉은 X보다 재도전 유도형 흔들림/잔상 피드백 우선

## 11. 보안 및 개인정보

- 카메라 영상은 브라우저 로컬 처리 원칙
- 최소한의 사용자 데이터만 저장
- Google 로그인 프로필 정보 외 사용자 작성 콘텐츠에 대한 모더레이션이 필요
- 공개 피드가 있으므로 신고, 차단, 스팸 대응이 빠르게 필요해질 수 있음

## 12. 브라우저/기기 대응

- 우선 지원: Chrome, Edge, Safari 최신 버전
- 모바일 Safari와 Android Chrome에서 기본 동작 확인 필요
- 저조도/협소한 화각 환경에서 정확도 저하 가능
- MediaRecorder 호환성과 인코딩 성능은 브라우저별 확인 필요

## 13. 개발 단계 제안

### Phase 1

- 카메라 연결
- 포즈 오버레이
- 포즈 유사도 점수 계산
- 1개 스테이지 판정
- 성공 시 기본 밈 오버레이 연출
- Google 로그인
- 랜딩 로그인 CTA

### Phase 2

- 10단계 이상 스테이지 확장
- 순차 해금
- 기록 저장
- 결과 영상 업로드
- 피드, 댓글, 좋아요, 팔로우

### Phase 3

- 연출 강화
- 프로필 고도화
- 인기순 피드 최적화
- 랭킹 또는 추천 기능 후보 검토

## 14. 오픈 이슈

- 밈 자산 포맷을 GIF, mp4, webp 중 무엇으로 통일할 것인가
- 모바일 세로 화면 기준 카메라 프레이밍을 어떻게 안내할 것인가
- 판정 허용 범위를 얼마나 넉넉하게 줄 것인가
- Storage 비용을 통제하기 위한 영상 압축 정책을 어떻게 잡을 것인가

## 15. 최종 기술 결론

- 1차 MVP는 실시간 대전 없이 싱글 플레이 + SNS 피드로 간다.
- 기술 난이도의 핵심은 포즈 유사도 점수, 영상 합성/업로드, 프론트 연출 UX다.
- 따라서 백엔드는 Supabase로 통합하고, 프론트엔드는 플레이와 피드 경험에 집중한다.
- Supabase는 Google 로그인, 공개 피드, 프로필, Storage 기반 영상 SNS 요구사항에 가장 잘 맞는다.

## 16. 2026-03-10 구현 메모

실제 구현 기준 추가 기술 결정:

- DM / Realtime
  - `meme.conversations`, `conversation_members`, `messages` 기반 1:1 direct thread
  - room 단위 `postgres_changes` subscription으로 message insert 반영
  - participant 범위 RLS로 conversation/member/message 접근 제한
- 플레이 보조 흐름
  - `/camera`, `/tutorial`, `/history`, `/messages`, `/messages/[conversationId]`
  - `/play` 본체는 최소 수정 원칙 유지
- SNS 제품화
  - `post_bookmarks`, `post_reports`, `hidden_posts`, `user_blocks`
  - `feed_posts.popularity_score` 기준 확장 포인트 추가
- 프로필 고도화
  - `featured_post_id` 기반 featured post 우선
  - 없으면 최근 업로드 play video fallback
