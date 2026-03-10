# Motion Meme MVP DB Schema

## 1. 설계 기준

이 스키마는 Supabase + Postgres 기준의 1차 MVP용 설계다.

핵심 원칙:
- 앱 도메인 테이블은 `meme` 스키마에만 둔다.
- 인증 원본은 `auth.users`를 그대로 사용한다.
- 실시간 카메라 원본 스트림은 저장하지 않는다.
- 플레이 결과는 `play_sessions`에 남기고, 사용자가 업로드 버튼을 누른 경우에만 공개 포스트를 생성한다.
- 10단계 순차 해금, 포즈 유사도 점수, 영상 SNS 기능을 모두 커버한다.

해석 기준:
- `최근 영상`은 기본적으로 **업로드 완료된 플레이 기록 기준**으로 본다.
- 업로드하지 않은 플레이는 점수/기록은 남길 수 있지만, 공개 피드에는 노출되지 않는다.
- 이후 정말 필요하면 `private_draft_recordings` 같은 비공개 저장 모델을 별도 추가할 수 있다.

## 2. 스키마 개요

### 인증/사용자

- `auth.users`
- `meme.profiles`

### 플레이/스테이지

- `meme.meme_assets`
- `meme.stages`
- `meme.stage_progress`
- `meme.play_sessions`

### SNS

- `meme.posts`
- `meme.post_media`
- `meme.post_comments`
- `meme.comment_media`
- `meme.post_likes`
- `meme.post_bookmarks`
- `meme.post_reports`
- `meme.follows`
- `meme.hidden_posts`
- `meme.user_blocks`

### DM / Realtime

- `meme.conversations`
- `meme.conversation_members`
- `meme.messages`

### 조회 최적화용 뷰

- `meme.profile_stats`
- `meme.feed_posts`

## 3. 테이블 설계

### `meme.profiles`

사용자 공개 프로필.

주요 컬럼:
- `user_id uuid primary key` -> `auth.users.id`
- `handle text null`
- `display_name text not null`
- `bio text`
- `avatar_url text`
- `featured_post_id uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- `handle`은 nullable로 시작하고, 나중에 사용자가 설정하게 둔다.
- 고유성은 `lower(handle)` partial unique index로 보장한다.
- `featured_post_id`는 사용자가 대표 밈/대표 게시물을 하나 고를 수 있게 한다.
- 초기 가입/백필 시점에는 프로필 라우팅을 위해 고유 handle을 자동 생성해 둔다.

### `meme.meme_assets`

서비스 제공 기본 밈 자산.

주요 컬럼:
- `id uuid primary key`
- `slug text unique`
- `title text`
- `asset_type text`
- `storage_path text`
- `overlay_preset jsonb`
- `sort_order integer`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- MVP에서는 사용자 커스텀 밈 업로드를 받지 않으므로 이 테이블은 서비스 운영용이다.
- `overlay_preset`에는 얼굴/상체/전신 기준의 배치 프리셋 값을 담는다.

### `meme.stages`

10단계 이상 순차 해금되는 스테이지 정의.

주요 컬럼:
- `id uuid primary key`
- `stage_number integer unique`
- `slug text unique`
- `title text`
- `description text`
- `instruction_text text`
- `time_limit_seconds smallint`
- `min_score_to_clear smallint`
- `rule_config jsonb`
- `success_meme_asset_id uuid`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- `rule_config`에 포즈 유사도 계산용 기준값, 각도 범위, 가중치, 유지 시간 등을 넣는다.
- 전체 테마를 나누지 않기로 했으므로 별도 theme 테이블은 두지 않는다.

### `meme.stage_progress`

사용자별 스테이지 해금/클리어 상태.

주요 컬럼:
- `id uuid primary key`
- `user_id uuid`
- `stage_id uuid`
- `best_score smallint`
- `attempt_count integer`
- `unlocked_at timestamptz`
- `cleared_at timestamptz null`
- `last_attempted_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

제약:
- `unique(user_id, stage_id)`

비고:
- 1단계는 가입 직후 자동 unlock row를 넣는 방식으로 시작한다.
- N단계를 clear하면 N+1 stage row를 생성/갱신한다.

### `meme.play_sessions`

각 플레이 시도 기록.

주요 컬럼:
- `id uuid primary key`
- `user_id uuid`
- `stage_id uuid`
- `score smallint`
- `result_tier text`
- `success boolean`
- `attempt_started_at timestamptz`
- `attempt_finished_at timestamptz`
- `duration_seconds smallint`
- `similarity_breakdown jsonb`
- `uploaded_video_path text null`
- `uploaded_thumbnail_path text null`
- `uploaded_at timestamptz null`
- `created_post_id uuid null`
- `created_at timestamptz`

비고:
- 포즈 프레임 원본은 저장하지 않는다.
- `similarity_breakdown`에는 팔/다리/중심/유지시간 등 항목별 점수를 넣는다.
- 업로드 버튼을 누른 경우에만 `uploaded_video_path`, `uploaded_at`, `created_post_id`가 채워진다.

### `meme.posts`

공개 피드에 노출되는 게시물.

주요 컬럼:
- `id uuid primary key`
- `author_user_id uuid`
- `post_type text`
- `source_play_session_id uuid null`
- `caption text`
- `like_count integer`
- `comment_count integer`
- `published_at timestamptz`
- `deleted_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- `post_type`은 `text`, `image`, `play_video`를 사용한다.
- 플레이 영상 게시물은 `source_play_session_id`를 갖는다.
- MVP는 전체공개만이므로 visibility 컬럼은 두지 않는다.

### `meme.post_media`

게시물에 연결되는 이미지/영상 메타데이터.

주요 컬럼:
- `id uuid primary key`
- `post_id uuid`
- `media_type text`
- `storage_path text`
- `mime_type text`
- `width integer`
- `height integer`
- `duration_seconds integer null`
- `poster_path text null`
- `sort_order integer`
- `created_at timestamptz`

비고:
- 텍스트 게시물은 media row가 없을 수 있다.
- 이미지 게시물, 플레이 영상 게시물을 모두 하나의 구조로 관리한다.

### `meme.post_comments`

게시물 댓글.

주요 컬럼:
- `id uuid primary key`
- `post_id uuid`
- `author_user_id uuid`
- `content text`
- `deleted_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- MVP는 대댓글 없이 flat comment 구조로 시작한다.

### `meme.comment_media`

댓글에 연결되는 이미지 메타데이터.

주요 컬럼:
- `id uuid primary key`
- `comment_id uuid`
- `storage_path text`
- `mime_type text`
- `width integer`
- `height integer`
- `sort_order integer`
- `created_at timestamptz`

비고:
- 1차는 이미지 기반 comment attachment만 허용한다.
- 경로는 `post-media` bucket의 `{user_id}/comment-{comment_id}/{file}` 규칙을 사용한다.

### `meme.post_likes`

게시물 좋아요.

주요 컬럼:
- `post_id uuid`
- `user_id uuid`
- `created_at timestamptz`

제약:
- `primary key (post_id, user_id)`

### `meme.follows`

사용자 팔로우 관계.

주요 컬럼:
- `follower_user_id uuid`
- `following_user_id uuid`
- `created_at timestamptz`

제약:
- `primary key (follower_user_id, following_user_id)`
- `follower_user_id <> following_user_id`

### `meme.post_bookmarks`

사용자 저장 게시물.

주요 컬럼:
- `post_id uuid`
- `user_id uuid`
- `created_at timestamptz`

제약:
- `primary key (post_id, user_id)`

### `meme.post_reports`

MVP 최소 신고 데이터.

주요 컬럼:
- `id uuid primary key`
- `post_id uuid`
- `reporter_user_id uuid`
- `reason text`
- `details text`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- 운영용 관리자 UI는 아직 없지만, 최소 신고 적재와 후속 검토 상태값은 남긴다.

### `meme.hidden_posts`

사용자별 피드 숨김 처리.

주요 컬럼:
- `post_id uuid`
- `user_id uuid`
- `created_at timestamptz`

제약:
- `primary key (post_id, user_id)`

### `meme.user_blocks`

사용자 차단 관계.

주요 컬럼:
- `blocker_user_id uuid`
- `blocked_user_id uuid`
- `created_at timestamptz`

제약:
- `primary key (blocker_user_id, blocked_user_id)`
- `blocker_user_id <> blocked_user_id`

### `meme.conversations`

1:1 direct message 대화방 메타데이터.

주요 컬럼:
- `id uuid primary key`
- `conversation_type text`
- `direct_key text unique`
- `created_by uuid`
- `last_message_id uuid null`
- `last_message_preview text`
- `last_message_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

비고:
- MVP는 `direct`만 허용한다.
- `direct_key`는 두 사용자 id를 정렬해 만든 pair key로 중복 1:1 방 생성을 막는다.

### `meme.conversation_members`

대화 참여자와 읽음 상태.

주요 컬럼:
- `conversation_id uuid`
- `user_id uuid`
- `joined_at timestamptz`
- `last_read_message_id uuid null`
- `last_read_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

제약:
- `primary key (conversation_id, user_id)`

비고:
- unread 계산은 `last_read_at` 또는 `last_read_message_id` 기준으로 한다.

### `meme.messages`

persisted direct message 본문.

주요 컬럼:
- `id uuid primary key`
- `conversation_id uuid`
- `sender_user_id uuid`
- `message_type text`
- `body text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `deleted_at timestamptz null`

비고:
- MVP는 `text`만 저장한다.
- Realtime Postgres Changes 구독 대상 테이블로 사용한다.

## 4. 관계 요약

- `profiles.user_id` -> `auth.users.id`
- `profiles.featured_post_id` -> `posts.id`
- `stages.success_meme_asset_id` -> `meme_assets.id`
- `stage_progress.user_id` -> `auth.users.id`
- `stage_progress.stage_id` -> `stages.id`
- `play_sessions.user_id` -> `auth.users.id`
- `play_sessions.stage_id` -> `stages.id`
- `play_sessions.created_post_id` -> `posts.id`
- `posts.author_user_id` -> `auth.users.id`
- `posts.source_play_session_id` -> `play_sessions.id`
- `post_media.post_id` -> `posts.id`
- `post_comments.post_id` -> `posts.id`
- `post_comments.author_user_id` -> `auth.users.id`
- `comment_media.comment_id` -> `post_comments.id`
- `post_likes.post_id` -> `posts.id`
- `post_likes.user_id` -> `auth.users.id`
- `post_bookmarks.post_id` -> `posts.id`
- `post_bookmarks.user_id` -> `auth.users.id`
- `post_reports.post_id` -> `posts.id`
- `post_reports.reporter_user_id` -> `auth.users.id`
- `follows.follower_user_id` -> `auth.users.id`
- `follows.following_user_id` -> `auth.users.id`
- `hidden_posts.post_id` -> `posts.id`
- `hidden_posts.user_id` -> `auth.users.id`
- `user_blocks.blocker_user_id` -> `auth.users.id`
- `user_blocks.blocked_user_id` -> `auth.users.id`
- `conversations.created_by` -> `auth.users.id`
- `conversations.last_message_id` -> `messages.id`
- `conversation_members.conversation_id` -> `conversations.id`
- `conversation_members.user_id` -> `auth.users.id`
- `conversation_members.last_read_message_id` -> `messages.id`
- `messages.conversation_id` -> `conversations.id`
- `messages.sender_user_id` -> `auth.users.id`

## 5. RLS 방향

### 공개 읽기

- `meme.profiles`: 공개 select 허용
- `meme.meme_assets`: 공개 select 허용
- `meme.stages`: 공개 select 허용
- `meme.posts`: `deleted_at is null` 조건으로 공개 select 허용
- `meme.post_media`: 게시물 공개 select에 맞춰 공개 select 허용
- `meme.post_comments`: 삭제되지 않은 댓글 공개 select 허용
- `meme.comment_media`: 삭제되지 않은 댓글에 한해 공개 select 허용
- `meme.post_likes`: 공개 select 허용 가능
- `meme.follows`: 공개 select 허용 가능
- `meme.conversations`: conversation participant만 select 허용
- `meme.conversation_members`: 같은 conversation participant만 select 허용
- `meme.messages`: conversation participant만 select 허용

### 본인만 쓰기/수정

- `meme.profiles`: 본인 update만 허용
- `meme.stage_progress`: 본인 select/insert/update만 허용
- `meme.play_sessions`: 본인 select/insert/update만 허용
- `meme.posts`: 본인 insert/update/delete만 허용
- `meme.post_media`: 본인 게시물에만 insert/delete 허용
- `meme.post_comments`: 본인 insert/update/delete만 허용
- `meme.comment_media`: 본인 댓글에만 insert/update/delete 허용
- `meme.post_likes`: 본인 insert/delete만 허용
- `meme.follows`: 본인 insert/delete만 허용
- `meme.post_bookmarks`: 본인 select/insert/delete만 허용
- `meme.post_reports`: 본인 select/insert만 허용
- `meme.hidden_posts`: 본인 select/insert/delete만 허용
- `meme.user_blocks`: 본인 select/insert/delete만 허용
- `meme.conversation_members`: 본인 read-state update만 허용
- `meme.messages`: participant + sender 본인 기준 insert/update만 허용

## 5.5 API 노출 설정

- Supabase REST/PostgREST에서 `meme` 스키마를 읽고 쓰려면 exposed schema에 `meme`가 포함되어야 한다.
- 실제 반영 시 `pgrst.db_schemas`에 `public,graphql_public,meme`를 설정하고 schema/config reload를 호출한다.
- 프런트에서는 `supabase.schema('meme')` 기준으로 쿼리한다.

## 5.6 Realtime 반영

- 1:1 DM은 persisted row + unread state가 필요하므로 `meme.messages`에 대해 Realtime Postgres Changes를 사용한다.
- `meme.conversations`, `meme.conversation_members`, `meme.messages`는 `supabase_realtime` publication에 포함한다.
- 실제 수신은 room 단위로 `conversation_id=eq.<id>` filter를 걸어 구독한다.
- Postgres Changes는 RLS를 존중하므로 participant 정책이 곧 DM 접근 제어가 된다.

## 6. Storage 버킷 제안

### `avatars`

- 프로필 아바타
- 공개 읽기
- path: `{user_id}/avatar.{ext}`

### `meme-assets`

- 서비스 기본 밈 자산
- 공개 읽기
- path: `{slug}/{version}/{file}`

### `post-media`

- 이미지 게시물, 플레이 영상 게시물
- 공개 읽기
- path: `{user_id}/{post_id}/{file}`

비고:
- MVP에서는 업로드한 게시물만 public이므로 `post-media`를 public bucket으로 둬도 구조상 맞다.
- 비공개 드래프트 녹화 저장을 나중에 지원하면 별도 private bucket을 추가한다.

## 7. 조회용 뷰 제안

### `meme.profile_stats`

목적:
- 프로필 화면에서 바로 필요한 집계값 제공

포함 값:
- `user_id`
- `post_count`
- `follower_count`
- `following_count`
- `best_score`
- `total_play_count`
- `uploaded_play_count`
- `last_played_at`

### `meme.feed_posts`

목적:
- 피드용 조인 결과 단순화

포함 값:
- 게시물 기본 정보
- 작성자 handle/display_name/avatar
- 대표 media path
- 게시물 타입
- like/comment count
- source play session의 score/stage 정보

## 8. 인덱스 우선순위

필수 인덱스:
- `profiles(lower(handle)) unique where handle is not null`
- `stages(stage_number)`
- `stage_progress(user_id, stage_id) unique`
- `stage_progress(user_id, unlocked_at desc)`
- `play_sessions(user_id, created_at desc)`
- `play_sessions(stage_id, score desc)`
- `posts(author_user_id, published_at desc)`
- `posts(published_at desc)`
- `posts(like_count desc, comment_count desc, published_at desc)`
- `post_media(post_id, sort_order)`
- `post_comments(post_id, created_at desc)`
- `comment_media(comment_id, sort_order)`
- `follows(following_user_id, follower_user_id)`

## 9. 트리거/자동화 제안

- `auth.users` insert 시 `meme.profiles` row 자동 생성
- `auth.users` insert 시 stage 1 unlock row 자동 생성
- `post_likes` insert/delete 시 `posts.like_count` 갱신
- `post_comments` insert/delete 시 `posts.comment_count` 갱신
- `play_sessions` insert/update 시 `stage_progress.best_score`, `attempt_count`, `last_attempted_at` 갱신
- stage clear 시 다음 stage unlock 처리

## 10. 지금 설계에서 의도적으로 뺀 것

- 실시간 대전용 room/session 테이블
- DM/채팅
- 신고/모더레이션 전용 테이블
- 추천 피드 모델
- 사용자 커스텀 밈 업로드
- 비공개 저장소 기반 드래프트 영상

이 항목들은 1차 MVP 범위를 넘기므로 의도적으로 제외했다.

## 11. 추천 구현 순서

1. `profiles`, `meme_assets`, `stages`
2. `stage_progress`, `play_sessions`
3. `posts`, `post_media`
4. `post_comments`, `post_likes`, `follows`
5. `profile_stats`, `feed_posts`
6. RLS와 Storage 정책

## 12. 핵심 결론

이 설계는 지금 PRD/TRD 기준에서 가장 덜 위험한 구조다.

- 플레이 도메인과 SNS 도메인을 분리했다.
- `auth.users`를 기준으로 모든 사용자 관계를 정리했다.
- 업로드 여부와 공개 피드를 분리해 비용과 공개 범위를 통제한다.
- 앱 테이블은 모두 `meme` 스키마 아래에만 둔다.

## 13. 2026-03-10 확장 반영

실제 반영된 추가 구조:
- DM: `conversations`, `conversation_members`, `messages`
- SNS 제품화: `post_bookmarks`, `post_reports`, `hidden_posts`, `user_blocks`
- 조회 뷰: `direct_inbox`
- 피드 정렬 보강: `feed_posts.popularity_score`

RLS 방향 추가:
- DM 테이블은 conversation participant만 읽고 쓸 수 있게 제한한다.
- bookmark / hidden / block / report는 모두 본인 row만 읽고 쓸 수 있게 제한한다.
- `meme` 스키마 테이블은 Realtime publication에 포함해 room 단위 subscription을 받는다.

의도적 보류:
- 댓글 이미지/스크린샷 저장 모델은 이번 턴에서 미반영
- 추천성 피드는 popularity score 기반 확장 포인트만 남기고 본격 추천 모델은 후속으로 둔다
