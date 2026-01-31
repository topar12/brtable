-- users_roles RLS 및 보안 정책
-- 이 파일은 users_roles 테이블에 RLS를 활성화하고, 인증된 사용자만 자신의 역할을 조회할 수 있도록 합니다.

-- RLS 활성화
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;

-- 강제 RLS 활성화 (테이블 소유자도 정책 적용)
ALTER TABLE public.users_roles FORCE ROW LEVEL SECURITY;

-- 권한 명시적 설정
GRANT SELECT ON public.users_roles TO authenticated;
REVOKE ALL ON public.users_roles FROM anon;

-- SELECT 정책: 인증된 사용자는 자신의 user_id에 해당하는 행만 조회 가능
CREATE POLICY "users_roles_select_own" 
ON public.users_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 기존 정책이 있다면 삭제 후 재생성 (멱등성)
DROP POLICY IF EXISTS "users_roles_select_own" ON public.users_roles;

-- 다시 생성
CREATE POLICY "users_roles_select_own" 
ON public.users_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
