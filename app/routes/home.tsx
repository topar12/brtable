import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { useAuth } from "../hooks/useAuth";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁" },
    { name: "description", content: "반려동물을 위한 실용 도구 모음" },
  ];
}

const tools = [
  {
    id: "food-calculator",
    title: "맞춤 사료 계산기",
    subtitle: "체중과 활동량으로 최적 급여량 계산",
    icon: "🧮",
    to: "/calculator",
    color: "orange",
  },
  {
    id: "explorer",
    title: "사료 정보 탐색기",
    subtitle: "영양 성분과 가격 비교",
    icon: "🔎",
    to: "/products",
    color: "blue",
  },
  {
    id: "walk-timer",
    title: "산책 타이머",
    subtitle: "산책 시간과 거리 기록",
    icon: "⏱️",
    to: "/tools/walk-timer",
    color: "emerald",
  },
  {
    id: "pet-age",
    title: "반려동물 나이계산기",
    subtitle: "사람 나이로 변환",
    icon: "🎂",
    to: "/tools/pet-age",
    color: "purple",
  },
];

const colorClasses: Record<string, { bg: string; text: string }> = {
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
};

export default function Home() {
  const { profile } = useStoredProfile();
  const { isAuthenticated, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* Header Section */}
        <header className="px-6 py-8 flex justify-between items-start">
          <div>
            <h1 className="text-[26px] font-bold text-[#191F28] leading-snug">
              반가워요,<br />
              <span className="text-[#3182F6]">{isAuthenticated ? profile.name : "예비"}</span> 보호자님 👋
            </h1>
            <p className="text-[17px] text-[#8B95A1] mt-2">
              {isAuthenticated ? "오늘도 건강한 하루 볼내세요!" : "반려동물을 위한 실용 도구를 확인핼보세요."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/pets"
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[#3182F6] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span>{profile.species === "CAT" ? "🐈" : "🐕"}</span>
                  <span className="hidden sm:inline">프로필</span>
                </Link>
                <button
                  onClick={signOut}
                  className="text-[13px] font-medium text-[#8B95A1] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="text-[13px] font-bold text-[#3182F6] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  로그인
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="text-[13px] font-medium text-[#8B95A1] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Tools Grid Section */}
        <section className="px-6 mb-8">
          <h2 className="text-[20px] font-bold text-[#191F28] mb-2 px-1">도구 모음</h2>
          <p className="text-[15px] text-[#8B95A1] mb-6 px-1">원하는 도구를 선택해주세요</p>
          
          <div className="grid grid-cols-2 gap-4">
            {tools.map((tool) => {
              const colors = colorClasses[tool.color];
              return (
                <Link
                  key={tool.id}
                  to={tool.to}
                  className="group bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3182F6]/30 focus-visible:ring-offset-2 transition-all duration-200 flex flex-col min-h-[140px]"
                >
                  <div className={`w-11 h-11 rounded-2xl ${colors.bg} flex items-center justify-center text-[22px]`}>
                    {tool.icon}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-[15px] font-bold text-[#191F28] leading-snug break-keep">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-[#8B95A1] leading-snug">
                      {tool.subtitle}
                    </p>
                  </div>
                  <span className="mt-auto self-end text-slate-300 group-hover:text-slate-400 transition-colors text-lg">
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section className="px-6 mb-12">
          <h3 className="text-[18px] font-bold text-[#191F28] mb-4 px-1">바로가기</h3>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <Link to="/calculator" className="flex items-center justify-between p-5 border-b border-slate-50 active:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl">🧮</div>
                <div>
                  <div className="text-[16px] font-bold text-[#191F28]">급여량 계산기</div>
                  <div className="text-[13px] text-[#8B95A1]">정확한 양을 계산핼보세요</div>
                </div>
              </div>
              <span className="text-slate-300">›</span>
            </Link>
            <Link to="/onboarding" className="flex items-center justify-between p-5 active:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-xl">✏️</div>
                <div>
                  <div className="text-[16px] font-bold text-[#191F28]">프로필 수정</div>
                  <div className="text-[13px] text-[#8B95A1]">아이의 정보가 바뀌었나요?</div>
                </div>
              </div>
              <span className="text-slate-300">›</span>
            </Link>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="px-6 text-center pb-8 mt-auto">
          <p className="text-[12px] text-[#8B95A1]">
            반려식탁은 수의학적 기준(WSAVA)을 준수합니다.
          </p>
        </footer>

      </div>
    </div>
  );
}
