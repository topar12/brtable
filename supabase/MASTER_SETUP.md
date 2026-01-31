# users_roles 마스터 계정 설정 가이드

## 자동 설정 (첫 번째 가입자)

`users_roles` 테이블이 비어있을 때, 첫 번째로 가입하는 사용자는 **자동으로 master** 역할을 부여받습니다.

## 수동 설정 (기존 사용자를 master로 승격)

### 방법 1: Supabase SQL Editor 사용

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. SQL Editor 열기
3. 다음 SQL 실행:

```sql
-- 특정 사용자를 master로 승격
UPDATE public.users_roles 
SET role = 'master' 
WHERE user_id = '사용자_UUID';
```

### 방법 2: Prisma CLI 사용

```bash
# 환경 변수 확인
echo $DATABASE_URL

# SQL 실행
npx prisma db execute --stdin <<EOF
UPDATE public.users_roles 
SET role = 'master' 
WHERE user_id = '사용자_UUID';
EOF
```

### 방법 3: psql 사용

```bash
psql "$DATABASE_URL" -c "UPDATE public.users_roles SET role = 'master' WHERE user_id = '사용자_UUID';"
```

## 역할 변경 (master → operator/member)

```sql
-- operator로 변경
UPDATE public.users_roles 
SET role = 'operator' 
WHERE user_id = '사용자_UUID';

-- member로 변경
UPDATE public.users_roles 
SET role = 'member' 
WHERE user_id = '사용자_UUID';
```

## 사용자 UUID 확인 방법

### Supabase Dashboard
1. Authentication → Users
2. 해당 사용자의 UUID 복사

### SQL로 확인
```sql
-- 이메일로 사용자 찾기
SELECT id, email 
FROM auth.users 
WHERE email = 'user@example.com';

-- 현재 users_roles 상태 확인
SELECT user_id, role 
FROM public.users_roles;
```
