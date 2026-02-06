import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { useAuth } from "../hooks/useAuth";
import { fetchMyUserProfile } from "../utils/userProfiles";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁" },
    { name: "description", content: "반려동물을 위한 실용 도구 모음" },
  ];
}

const toolSections = [
  {
    id: "nutrition",
    title: "🍽️ 식단 & 영양",
    description: "올바른 먹거리 습관을 만들어요",
    items: [
      {
        id: "food-calculator",
        title: "맞춤 사료 계산기",
        subtitle: "체중/활동량별 급여량",
        icon: "🧮",
        to: "/calculator",
        color: "orange",
      },
      {
        id: "explorer",
        title: "사료 정보 탐색기",
        subtitle: "성분/가격 꼼꼼 비교",
        icon: "🔎",
        to: "/products",
        color: "blue",
      },
      {
        id: "food-check",
        title: "먹여도 되나요?",
        subtitle: "음식 정보 DB",
        icon: "🍎",
        to: "#",
        color: "green",
        isComingSoon: true,
      },
    ],
  },
  {
    id: "health",
    title: "💪 건강 & 활동",
    description: "매일매일 더 건강하게",
    items: [
      {
        id: "walk-timer",
        title: "산책 타이머",
        subtitle: "산책 시간/거리 기록",
        icon: "⏱️",
        to: "/tools/walk-timer",
        color: "emerald",
      },
      {
        id: "pet-age",
        title: "나이 계산기",
        subtitle: "사람 나이로 변환",
        icon: "🎂",
        to: "/tools/pet-age",
        color: "purple",
      },
    ],
  },
  {
    id: "community",
    title: "🗣️ 소통 & 정보",
    description: "함께 나누는 이야기",
    items: [
      {
        id: "community",
        title: "멍냥커뮤",
        subtitle: "집사들의 수다 공간",
        icon: "🗣️",
        to: "/community",
        color: "rose",
      },
      {
        id: "parenting-guide",
        title: "육아 가이드",
        subtitle: "초보 보호자 꿀팁",
        icon: "📖",
        to: "/guide",
        color: "yellow",
      },
    ],
  },
];

const colorClasses: Record<string, { bg: string; text: string }> = {
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
};

export default function Home() {
  const { profile } = useStoredProfile();
  const { user, isAuthenticated, signOut } = useAuth();
  const [userNickname, setUserNickname] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUserNickname("");
      return;
    }

    let isMounted = true;
    const loadNickname = async () => {
      const { data } = await fetchMyUserProfile(user.id);
      const nickname = data?.nickname ?? user.user_metadata?.name ?? "";
      if (isMounted) {
        setUserNickname(nickname);
      }
    };

    loadNickname();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, user?.user_metadata?.name]);

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* Header Section */}
        <header className="px-6 py-8 flex justify-between items-start">
          <div>
            <h1 className="text-[26px] font-bold text-[#191F28] leading-snug break-keep">
              반가워요,<br />
              <span className="text-[#3182F6]">
                {isAuthenticated ? userNickname || "보호자" : "예비"}
              </span>{" "}
              보호자님 👋
            </h1>
            <p className="text-[17px] text-[#8B95A1] mt-2 break-keep">
              {isAuthenticated ? "오늘도 건강한 하루 보내세요!" : "반려동물을 위한 실용 도구를 확인해보세요."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
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

        {/* Dashboard Quick Access for Members */}
        {isAuthenticated ? (
          <section className="px-6 mb-8">
            <Link
              to="/dashboard"
              className="block bg-gradient-to-br from-[#3182F6] to-[#5B9BF7] rounded-[24px] p-5 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-[16px] flex items-center justify-center shadow-inner border border-white/10">
                    <span className="text-2xl animate-bounce-slow">📊</span>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-white mb-1">내 대시보드</h3>
                    <p className="text-[13px] text-white/90 font-medium">반려동물 현황 한눈에 보기</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="text-white text-sm">›</span>
                </div>
              </div>
            </Link>
          </section>
        ) : (
          /* Hero Banner for Non-Members */
          <section className="px-6 mb-12 mt-2">
            <div className="bg-[#3182F6] rounded-[32px] p-8 relative overflow-hidden text-center shadow-xl shadow-blue-500/20">
              {/* Background Decorations */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#3182F6] to-[#1B64DA]" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-[13px] font-bold mb-5 border border-white/10 shadow-sm animate-fade-in-up">
                  ✨ 35,000명 보호자의 선택
                </span>
                <h2 className="text-[28px] font-bold text-white leading-tight mb-3 break-keep animate-fade-in-up [animation-delay:100ms]">
                  반려동물 케어,<br />어떻게 시작할까요?
                </h2>
                <p className="text-white/80 text-[15px] mb-8 leading-snug break-keep animate-fade-in-up [animation-delay:200ms]">
                  AI 사료량 계산부터 산책 기록까지,<br />
                  반려식탁에서 한 번에 관리하세요.
                </p>

                {/* Floating Cards Animation */}
                <div className="relative w-full h-[120px] mb-6">
                  {/* Card 1 */}
                  <div className="absolute left-1/2 -translate-x-[60%] top-0 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl w-[140px] animate-float-slow shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-lg">🧮</div>
                      <div className="text-left">
                        <div className="text-[10px] text-white/70">사료량</div>
                        <div className="text-[12px] font-bold text-white">75g</div>
                      </div>
                    </div>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-orange-400" />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="absolute left-1/2 translate-x-[10%] top-[40px] bg-white rounded-2xl p-3 shadow-xl w-[130px] animate-float-delayed">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-lg">⏱️</div>
                      <div className="text-left">
                        <div className="text-[10px] text-gray-500">산책 시간</div>
                        <div className="text-[12px] font-bold text-gray-900">45분 완료</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  to="/login?mode=signup"
                  className="w-full bg-white text-[#3182F6] py-4 rounded-[20px] font-bold text-[17px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group animate-fade-in-up [animation-delay:400ms]"
                >
                  3초 만에 시작하기
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <p className="text-white/60 text-[12px] mt-4 animate-fade-in-up [animation-delay:500ms]">
                  이미 <span className="text-white font-bold">1,234명</span>이 함께하고 있어요
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tools Section - Categorized */}
        <section className="px-6 mb-12">
          <h2 className="text-[22px] font-bold text-[#191F28] mb-6 px-1">도구 모음</h2>

          <div className="space-y-10">
            {toolSections.map((section) => (
              <div key={section.id}>
                <div className="mb-4 px-1">
                  <h3 className="text-[17px] font-bold text-[#333D4B] flex items-center gap-2">
                    {section.title}
                  </h3>
                  <p className="text-[13px] text-[#8B95A1] mt-1">{section.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {section.items.map((tool) => {
                    const colors = colorClasses[tool.color];
                    return (
                      <Link
                        key={tool.id}
                        to={tool.to}
                        onClick={(e) => {
                          if (tool.isComingSoon) {
                            e.preventDefault();
                            alert("🚧 준비 중인 기능입니다.\\n조금만 기다려주세요!");
                          }
                        }}
                        className={`group bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3182F6]/30 focus-visible:ring-offset-2 transition-all duration-200 flex flex-col min-h-[140px] relative overflow-hidden ${tool.isComingSoon ? "opacity-90 grayscale-[0.3]" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`w-11 h-11 rounded-2xl ${colors.bg} flex items-center justify-center text-[22px]`}>
                            {tool.icon}
                          </div>
                          {tool.isComingSoon && (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">
                              준비중
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <h4 className="text-[15px] font-bold text-[#191F28] leading-snug break-keep">
                            {tool.title}
                          </h4>
                          <p className="mt-1 text-[12px] text-[#8B95A1] leading-snug break-keep">
                            {tool.subtitle}
                          </p>
                        </div>
                        {!tool.isComingSoon && (
                          <span className="mt-auto self-end text-slate-300 group-hover:text-slate-400 transition-colors text-lg">
                            ›
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
                  <div className="text-[16px] font-bold text-[#191F28]">반려동물 추가</div>
                  <div className="text-[13px] text-[#8B95A1]">새 반려동물을 등록해요</div>
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
