import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { signInWithGoogle, signInWithKakao } from "../utils/supabase";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 로그인" },
    { name: "description", content: "소셜 로그인으로 시작하세요." },
  ];
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result.error) {
      alert("로그인에 실패했습니다: " + result.error);
    }
  };

  const handleKakaoLogin = async () => {
    const result = await signInWithKakao();
    if (result.error) {
      alert("로그인에 실패했습니다: " + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
          >
            <span className="mr-1">←</span>
            <span className="text-sm">돌아가기</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col px-6 py-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-[20px] mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#191F28] mb-2">
              반려식탁
            </h1>
            <p className="text-[15px] text-[#8B95A1]">
              로그인하고 더 많은 기능을 이용하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-[20px]">
              <p className="text-[14px] text-red-600 text-center">
                {error === "supabase_not_configured"
                  ? "서비스 설정 오류가 발생했습니다. 관리자에게 문의해주세요."
                  : "로그인 중 오류가 발생했습니다. 다시 시도해주세요."}
              </p>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
            <h2 className="text-[18px] font-bold text-[#191F28] text-center mb-6">
              간편 로그인
            </h2>

            {/* Kakao Login Button */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FEE500] rounded-[16px] hover:bg-[#FDD800] active:scale-[0.98] transition-all duration-200 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 4C7.029 4 3 7.13 3 10.988c0 2.453 1.633 4.607 4.087 5.824-.18.67-.653 2.428-.748 2.805-.117.467.171.46.36.335.149-.098 2.37-1.61 3.326-2.263.316.043.64.066.975.066 4.971 0 9-3.13 9-6.988C20 7.13 16.971 4 12 4z"
                  fill="#000000"
                />
              </svg>
              <span className="text-[15px] font-bold text-[#000000]">
                카카오로 시작하기
              </span>
            </button>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-[#E5E8EB] rounded-[16px] hover:border-[#3182F6] hover:bg-blue-50/30 active:scale-[0.98] transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-[15px] font-bold text-[#4E5968] group-hover:text-[#3182F6] transition-colors">
                Google로 계속하기
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#E5E8EB]"></div>
              <span className="text-[13px] text-[#8B95A1]">또는</span>
              <div className="flex-1 h-px bg-[#E5E8EB]"></div>
            </div>

            {/* Guest Browsing */}
            <p className="text-[14px] text-[#8B95A1] text-center mb-4">
              로그인 없이 둘러보기
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/calculator"
                className="py-3 px-4 bg-[#F2F4F6] hover:bg-[#E5E8EB] rounded-[16px] text-center text-[14px] font-bold text-[#4E5968] active:scale-[0.98] transition-all"
              >
                <span className="mr-1">🧮</span>계산기
              </Link>
              <Link
                to="/products"
                className="py-3 px-4 bg-[#F2F4F6] hover:bg-[#E5E8EB] rounded-[16px] text-center text-[14px] font-bold text-[#4E5968] active:scale-[0.98] transition-all"
              >
                <span className="mr-1">📦</span>사료 목록
              </Link>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-[16px] font-bold text-[#191F28] mb-4 text-center">
              로그인하면 이런 기능을 이용할 수 있어요
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                  🐕
                </div>
                <span className="text-[14px] text-[#4E5968]">
                  반려동물 프로필 저장 및 관리
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-lg">
                  🎯
                </div>
                <span className="text-[14px] text-[#4E5968]">
                  맞춤 사료 추천 받기
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-lg">
                  📊
                </div>
                <span className="text-[14px] text-[#4E5968]">
                  급여 기록 및 통계 확인
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-[12px] text-[#8B95A1]">
            © 2024 반려식탁. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
