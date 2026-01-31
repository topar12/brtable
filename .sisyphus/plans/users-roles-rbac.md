# users_roles 권한 시스템(RBAC) 완전 구현 계획

## TL;DR

> **Quick Summary**: 기존 클라이언트 Supabase 조회 방식(`.from("users_roles")`)을 유지하면서, `public.users_roles`에 RLS/정책을 추가해 “로그인 사용자는 자기 role만 조회” 가능하도록 안전하게 고도화합니다.
>
> **Deliverables**:
> - Prisma에 `users_roles` 모델 추가(타입 안정성 + Prisma Client 사용 가능)
> - `users_roles` RLS 활성화 + SELECT 정책 SQL
> - 마이그레이션(=DB에 SQL 적용) 실행 절차(로컬/원격)
> - 자동화된 검증 절차(정책 테스트 + 앱 권한 체크 확인)

**Estimated Effort**: Medium
**Parallel Execution**: YES (2 waves)
**Critical Path**: DB 정책 적용 → Prisma 모델 반영 → 검증

---

## Context

### Original Request
- 반려식탁 프로젝트에서 `users_roles` 기반 권한 시스템을 “완전히 구현”
- Prisma 스키마에 `users_roles` 모델이 없어서 추가 필요
- RLS/정책 포함(로그인 사용자는 자기 `user_id` 행만 SELECT)

### Existing Implementation (Evidence)
- 클라이언트에서 role 조회:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/utils/supabase.ts`
    - `getCurrentUserWithRole()`가 `users_roles`에서 `role`을 `.maybeSingle()`로 읽고 없으면 `member` fallback
    - `hasAdminAccess()` / `hasMasterAccess()` 정의
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/hooks/useAuth.tsx`
    - 세션 로드 후 `users_roles`에서 `role` 로드
- 기존 DB DDL/트리거 존재:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/supabase/users_roles.sql`
    - 테이블: `users_roles(user_id uuid PK, role text check('master','operator','member'), created_at, updated_at)`
    - 트리거: 첫 유저 `master`, 이후 `member`
    - 인덱스: `idx_users_roles_role`

---

## Work Objectives

### Core Objective
- `users_roles` 테이블을 Prisma 스키마에 반영하고, Supabase(PostgREST)에서 안전하게 조회되도록 RLS/정책을 추가한 뒤, 앱의 `isAdmin`/`isMaster` 체크가 기대대로 동작함을 자동 검증합니다.

### Concrete Deliverables
- Prisma:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/prisma/schema.prisma`에 `users_roles` 모델 추가
- Supabase SQL:
  - 신규 SQL 파일(권장): `supabase/users_roles_rls.sql` (RLS + 정책)
- 테스트/검증:
  - Vitest 유닛 테스트(권장): `app/utils/supabase.test.ts` 또는 동등 위치
  - DB 정책 검증용 명령(예: `psql` 또는 `npx prisma db execute`) 절차

### Definition of Done
- `users_roles`에 RLS가 켜져 있어도, 로그인 사용자는 자기 role을 정상 조회하고(앱/쿼리 기준), 다른 사용자의 row는 조회 불가
- `hasAdminAccess()` / `hasMasterAccess()`가 역할 정의대로 동작(테스트로 검증)

### Must NOT Have (Guardrails)
- 클라이언트가 `users_roles`를 임의로 INSERT/UPDATE/DELETE 할 수 있게 만들지 않기(기본은 읽기만)
- `guest`를 DB role로 추가하지 않기(앱에서만 사용)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest; `app/**/*.test.ts`)
- **User wants tests**: YES (Tests-after 권장: 권한 헬퍼는 유닛 테스트, RLS는 DB 레벨 검증)

### Automated Verification (Agent-executable)

DB 정책 검증은 “Supabase Postgres에 연결 가능한 커넥션 문자열”이 필요합니다.
- 옵션 A(권장): `psql "$DATABASE_URL"`로 직접 SQL 실행
- 옵션 B: `npx prisma db execute --file <sql>` 로 SQL 실행

정책 검증 시나리오(예시):
- (1) 특정 유저 A의 `user_id`가 있을 때, “A로서” 자신의 row select는 성공
- (2) “A로서” 다른 유저 B의 row select는 0건 또는 권한 오류

주의: RLS는 보통 PostgREST 요청 JWT 컨텍스트를 사용하므로, SQL 레벨에서 정책을 테스트할 때는 `request.jwt.claim.*`를 세팅하는 방식(또는 Supabase 권장 테스트 방식)을 사용합니다.

권장 검증(예: 서비스 롤로 DB 접속해 “JWT 컨텍스트 흉내”):
```sql
-- psql 세션에서
set local role authenticated;
select set_config('request.jwt.claim.sub', '<USER_UUID_A>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- 자신의 row는 허용
select role from public.users_roles where user_id = auth.uid();

-- 타인의 row는 차단되어야 함(0 rows 또는 error)
select role from public.users_roles where user_id = '<USER_UUID_B>';
```

---

## Execution Strategy

Wave 1 (DB 안전장치 구축):
- Task 1: `users_roles` RLS/정책 SQL 작성 및 적용
- Task 2: 첫 master 부트스트랩/수정 절차 확정 및 적용(환경에 맞게)

Wave 2 (앱/Prisma 타입 안정성 + 검증):
- Task 3: Prisma 모델 추가 + generate
- Task 4: Vitest 유닛 테스트 + DB 정책 검증 절차 실행

---

## TODOs

- [ ] 1. `users_roles` RLS 및 SELECT 정책 SQL 작성/적용

  **What to do**:
  - `supabase/users_roles.sql`의 테이블이 이미 존재/적용되어 있는지 확인
  - 신규 파일 `supabase/users_roles_rls.sql`에 아래를 포함:
    - `ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;`
    - (권장) `ALTER TABLE public.users_roles FORCE ROW LEVEL SECURITY;` 적용 여부 검토
    - (권장) 테이블 권한 명시(환경별 기본 GRANT가 다를 수 있으므로 안전장치):
      - `GRANT SELECT ON public.users_roles TO authenticated;`
      - `REVOKE ALL ON public.users_roles FROM anon;`
    - `CREATE POLICY "users_roles_select_own" ON public.users_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);`
  - 운영/개발에서의 적용 방법 2개를 문서화:
    - Supabase SQL Editor에 붙여넣어 실행
    - 로컬에서 `psql` 또는 `npx prisma db execute`로 실행

  **Must NOT do**:
  - `FOR ALL` 정책으로 광범위 권한 부여 금지
  - `anon`에 대한 SELECT 허용 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: (none)

  **References**:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/supabase/users_roles.sql` - 테이블/트리거/컬럼 정의의 기준
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/utils/supabase.ts` - 실제로 필요한 최소 SELECT 컬럼은 `role` 하나
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/hooks/useAuth.tsx` - 클라이언트에서 `eq("user_id", userId).maybeSingle()` 수행

  **Acceptance Criteria**:
  - [ ] `users_roles`에 RLS가 활성화되어도, 로그인 사용자가 자기 role을 조회할 수 있음(아래 검증 중 1개 이상으로 증명)
  - [ ] 다른 user_id에 대한 조회는 거부됨(0 rows 또는 permission error)
  - [ ] SQL 적용이 단일 실행으로 가능(중간에 “정책 없음” 상태로 앱이 깨지는 구간 최소화)

  **Automated Verification** (예시; executor가 환경에 맞게 선택):
  ```bash
  # Option B: Prisma로 SQL 적용
  npx prisma db execute --file supabase/users_roles_rls.sql
  ```

- [ ] 2. 첫 master 계정 부트스트랩/운영 절차 확정

  **What to do**:
  - 기본 동작(이미 존재): `users_roles`가 비어있으면 첫 유저가 `master`.
  - 이미 유저가 존재하는 환경을 대비해 2가지 런북을 준비:
    1) “새 프로젝트/테이블 비어있음” 런북: 가장 먼저 가입할 계정을 master로 만들기
    2) “기존 데이터 있음” 런북: 특정 `auth.users.id`(UUID)에 대해 `users_roles.role='master'`로 승격
  - 승격 SQL 예시를 제공(서비스 롤/SQL editor 전제):
    - `UPDATE public.users_roles SET role = 'master' WHERE user_id = '<uuid>';`
    - 필요 시 다른 master를 `operator`/`member`로 내리는 절차도 옵션으로 포함

  **References**:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/supabase/users_roles.sql` - 첫 유저 master 트리거 로직

  **Acceptance Criteria**:
  - [ ] “첫 유저 master” 케이스와 “특정 유저 승격” 케이스가 모두 실행 가능한 단계로 문서화됨

- [ ] 3. Prisma 스키마에 `users_roles` 모델 추가(타입/쿼리 안정성)

  **What to do**:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/prisma/schema.prisma`에 모델 추가(권장 형태):
    - 테이블명은 `@@map("users_roles")`로 매핑
    - `user_id`는 Supabase auth UUID이므로 `@db.Uuid`
    - `role`은 기존 DDL이 TEXT+CHECK이므로 `String @db.Text` 유지(Prisma enum은 DB enum 생성이 수반될 수 있어 기본은 보류)
  - 권장 스키마 스니펫(예시):
    ```prisma
    model UsersRole {
      userId    String   @id @map("user_id") @db.Uuid
      role      String   @db.Text
      createdAt DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
      updatedAt DateTime? @default(now()) @map("updated_at") @db.Timestamptz(6)

      @@map("users_roles")
    }
    ```
  - 스키마 반영 후 `npx prisma generate`
  - (선택) `prisma db pull`을 사용하는 팀이라면, pull 전략과 충돌 여부 점검

  **References**:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/prisma/schema.prisma` - 현재 Prisma 모델 구성
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/supabase/users_roles.sql` - 컬럼/타입/제약 조건

  **Acceptance Criteria**:
  - [ ] Prisma Client가 `users_roles`를 모델로 인식하고 타입이 생성됨(`npx prisma generate` 성공)

- [ ] 4. 권한 체크 동작 검증(유닛 + DB 정책)

  **What to do**:
  - Vitest로 순수 함수 유닛 테스트 추가:
    - `hasAdminAccess('master'|'operator'|'member'|'guest')` 기대값
    - `hasMasterAccess(...)` 기대값
  - DB 정책 검증 절차 실행(선택한 방식으로):
    - 정책 적용 전/후로 `users_roles` 조회가 어떻게 달라지는지 확인
    - 최소 2명 유저(UUID 2개)를 기준으로 “자기 row는 조회 가능, 타인 row는 불가”를 증명

  **References**:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/utils/supabase.ts` - 헬퍼 함수의 진실 소스
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/hooks/useAuth.tsx` - 실제 UI 권한 게이트: `isAdmin`, `isMaster`
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/routes/admin.tsx` - `isAdmin`을 이용해 관리자 접근 제한

  **Acceptance Criteria**:
  - [ ] `npm run test` → PASS
  - [ ] RLS 정책 검증 2케이스(own select 허용 / other select 거부)를 커맨드 출력으로 남김

---

## Migration / Apply Guide (How to run)

이 프로젝트는 Supabase SQL 파일(`supabase/*.sql`)을 이미 보유하고 있으므로, “마이그레이션”은 아래 중 하나로 수행합니다.

1) Supabase Dashboard SQL Editor
- `supabase/users_roles.sql` 적용(미적용 환경에만)
- `supabase/users_roles_rls.sql` 적용

2) CLI 기반(자동화)
- `DATABASE_URL`이 Supabase Postgres로 설정되어 있다는 전제 하에:
  - `npx prisma db execute --file supabase/users_roles.sql`
  - `npx prisma db execute --file supabase/users_roles_rls.sql`

---

## Notes / Risks

- RLS를 켜고 정책을 누락하면, 현재 클라이언트 role 조회(`users_roles` select)가 즉시 실패할 수 있습니다. 반드시 “enable RLS + create policy”를 같은 적용 세션에서 처리합니다.
- `users_roles` 트리거 함수(`handle_new_user`)는 현재 `SECURITY DEFINER`입니다. RLS 적용 후에도 신규 유저 row 자동 생성이 되는지 반드시 확인합니다.
