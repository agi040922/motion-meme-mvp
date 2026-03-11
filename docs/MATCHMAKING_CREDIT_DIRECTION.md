# Matchmaking / Credit / Admin Direction

## 목적

이 문서는 Motion Meme를 단순 카메라 SNS에서 `의도(intent)`와 `크레딧`, `운영자 관리`가 포함된 소셜 제품으로 확장할 때의 진행 방향을 정리한다.

핵심 아이디어:
- DM 시작 전에 의도를 선택한다
- 일반 DM은 무료로 유지한다
- `소개팅` / `광고 제안`은 크레딧을 차감하는 특별 DM으로 처리한다
- 특별 DM은 같은 채팅방을 쓰되, intent와 테마가 붙는다
- 운영자는 회원/가상 회원/노출 상태/요청 상태를 대시보드에서 관리한다

## 제품 방향

### 기본 원칙

- 기존 DM 시스템은 유지한다
- 새 기능은 `DM의 intent layer`로 붙인다
- 사용자는 DM 버튼을 누르면 먼저 아래를 고른다
  - `Just chat`
  - `Dating intro`
  - `Brand / collab`
- `Just chat`는 무료
- `Dating intro`, `Brand / collab`은 크레딧 차감 후 같은 DM room으로 진입

### 왜 이 구조가 좋은가

- 기존 conversation/messages 구조를 재사용할 수 있다
- 소개팅과 광고 제안을 같은 프레임에서 처리할 수 있다
- 크레딧 모델을 붙이기 쉽다
- room UI를 intent별로 다르게 표현할 수 있다
- 운영/통계/환불/로그 관리가 분리된다

## UX 제안

### DM 진입 흐름

1. 사용자가 프로필/게시물에서 `Message` 클릭
2. intent 선택 modal 표시
3. 옵션:
   - `Just chat`
   - `Dating intro`
   - `Brand / collab`
4. 특별 DM이면:
   - 차감 크레딧 표시
   - 짧은 opening message 입력
   - 확인 버튼 예시:
     - `Send with 20 credits`
     - `Send with 50 credits`
5. conversation 생성 또는 기존 room 재사용
6. special request metadata 기록
7. DM room 상단에 special card 표시

### 특별 DM UI

- `Dating intro`
  - 꽃/블러/크림/핑크 톤의 배경
  - 상단 badge: `Dating intro`
  - 표시 문구: `20 credits spent`
- `Brand / collab`
  - 더 차분한 네이비/차콜 계열
  - 상단 badge: `Brand collab`
  - 표시 문구: `50 credits spent`
- `Just chat`
  - 현재 기본 DM UI 유지

### 듀엣과의 연결

- duet 성공 후 `Send a DM` CTA 유지
- 이 CTA를 누르면 일반 DM으로 바로 들어가는 대신 intent selector로 연결 가능
- 소개팅 톤을 강화하려면 duet 결과에서:
  - `Just chat`
  - `Dating intro`
  - `Brand / collab`
  선택하도록 확장 가능

## 데이터 모델 제안

### 1. credit_wallets

- 목적: 유저별 현재 크레딧 잔액
- 추천 필드:
  - `user_id`
  - `balance`
  - `created_at`
  - `updated_at`

### 2. credit_ledger

- 목적: 모든 적립/차감 이력
- 추천 필드:
  - `id`
  - `user_id`
  - `delta`
  - `balance_after`
  - `reason`
  - `reference_type`
  - `reference_id`
  - `created_at`

예시 reason:
- `admin_grant`
- `dating_intro_send`
- `brand_collab_send`
- `refund`

### 3. conversation_requests

- 목적: 특별 DM의 intent와 크레딧 사용 내역 기록
- 추천 필드:
  - `id`
  - `conversation_id`
  - `requester_user_id`
  - `target_user_id`
  - `intent`
  - `theme`
  - `credits_spent`
  - `opening_message`
  - `status`
  - `created_at`
  - `updated_at`

추천 enum:
- `intent`
  - `dating_intro`
  - `brand_collab`
- `theme`
  - `default`
  - `blossom`
  - `brand_dark`
- `status`
  - `sent`
  - `accepted`
  - `rejected`
  - `expired`
  - `refunded`

### 4. managed_members

- 목적: 운영자가 관리하는 회원/가상 회원/노출 상태
- 추천 필드:
  - `profile_user_id` nullable
  - `display_name`
  - `handle`
  - `member_type`
  - `is_visible`
  - `is_intro_open`
  - `priority_score`
  - `intro_price`
  - `brand_price`
  - `managed_notes`
  - `created_at`
  - `updated_at`

추천 member_type:
- `real`
- `virtual`
- `curated`

## 어드민 대시보드 방향

### 목적

- 운영자가 회원/가상 회원/요청/크레딧을 한 곳에서 관리
- 초기엔 완전한 CMS보다 `dashboard-style backoffice`로 시작

### 권장 라우트

- `/admin`
- `/admin/members`
- `/admin/requests`
- `/admin/credits`
- `/admin/content`

### 대시보드 카드 예시

- 총 회원 수
- 소개팅 요청 수
- 광고 제안 요청 수
- 오늘 차감된 크레딧
- 승인 대기 요청 수
- 비노출 회원 수

### members 화면

- 회원 목록
- virtual / curated / real 필터
- 소개 가능 여부 토글
- intro / brand 크레딧 가격 수정
- 프로필 노출/비노출

### requests 화면

- 요청 목록
- intent별 필터
- 상태 변경
- 환불 처리
- 메모 추가

### credits 화면

- 지갑 잔액 조회
- 관리자 크레딧 지급
- ledger 조회

## 문서 반영 포인트

### PRD

- 제품 한줄 설명에 `의도 기반 DM`, `크레딧`, `소개 요청` 추가
- 포함 범위에 아래 추가
  - intent 선택형 DM
  - 크레딧 차감
  - 소개팅 / 광고제안 special DM
  - 운영자 회원 관리
- 성공 지표에 아래 추가
  - special DM 전환율
  - intro request 생성률
  - credit spend per active user

### TRD

- DM 도메인 확장:
  - `conversation_requests`
  - `credit_wallets`
  - `credit_ledger`
  - `managed_members`
- special theme rendering 규칙 추가
- admin dashboard 라우트/권한 모델 추가

### DB_SCHEMA

- 위 테이블과 관계 추가
- credit 차감/환불 정책 명시
- admin write scope 명시

### DELIVERY_PLAN

- 새 phase 추가:
  - `Matchmaking / Monetization / Admin`

## 추천 구현 순서

### Phase 1. 문서/도메인 정리

- PRD/TRD/DB_SCHEMA 갱신
- intent 정의
- 크레딧 가격 정책 정의

### Phase 2. 크레딧 기반

- `credit_wallets`
- `credit_ledger`
- admin grant/refund

### Phase 3. special DM

- intent selector modal
- `conversation_requests`
- special badge / theme

### Phase 4. admin dashboard

- members
- requests
- credits

## 추천 MVP 범위

처음에는 아래만 넣는 것이 좋다.

- intent 3종
  - `Just chat`
  - `Dating intro`
  - `Brand / collab`
- `Dating intro` / `Brand / collab`만 크레딧 차감
- `conversation_requests` 기록
- room 상단 special card
- 기본 admin dashboard
  - members
  - requests
  - credits

## 메모

- 이 방향은 제품을 `카메라 기반 SNS`에서 `의도 기반 소셜/매칭 레이어가 있는 서비스`로 확장한다
- 현재 DM 시스템을 버리지 않고 확장할 수 있다는 점이 가장 큰 장점이다
