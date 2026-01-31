import { Link } from "react-router";
import type { Route } from "./+types/home";
import DataSourceBadge from "../components/DataSourceBadge";
import { useCatalogData } from "../hooks/useCatalogData";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { useAuth } from "../hooks/useAuth";
import { calculateDer, calculateDailyGrams } from "../utils/calc";
import { formatNumber, formatPrice } from "../utils/format";
import { recommendProductsWithScore } from "../utils/recommendation";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁" },
    { name: "description", content: "영양 중심 급여 설계와 맞춤 추천." },
  ];
}

export default function Home() {
  const { breeds, products, source, loading, error } = useCatalogData();
  const { profile } = useStoredProfile();
  const { isAuthenticated, signOut } = useAuth();
  const breed = breeds.find((item) => item.id === profile.breedId);
  const scoredProducts = recommendProductsWithScore(products, profile);
  const featuredScore = scoredProducts[0] ?? null;
  const featured = featuredScore?.product ?? products[0];
  const sku = featured?.skus[0];

  // Derive State
  const der = calculateDer(
    profile.weightKg,
    profile.activityLevel,
    profile.isNeutered
  );
  const grams = featured ? calculateDailyGrams(der, featured.kcalPerKg) : 0;
  const position = featuredScore?.pricePosition ?? 50;
  const positionLabel = featuredScore?.pricePositionLabel ?? "중가";
  const reasons = featuredScore?.reasons ?? [];

  // Data Loading State
  if (loading || !featured || !sku) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">데이터를 불러오고 있어요</h2>
          <p className="text-slate-500 mt-2">잠시만 기다려주세요</p>
          <div className="mt-6 opacity-70">
            <DataSourceBadge source={source} loading={loading} error={error} />
          </div>
        </div>
      </div>
    );
  }

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
              {isAuthenticated ? "오늘도 건강한 하루 보내세요!" : "반려견을 위한 맞춤 설계를 시작해보세요."}
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

        {/* Quick Stats Grid */}
        <section className="px-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[120px]">
              <span className="text-[15px] font-medium text-[#8B95A1]">하루 에너지</span>
              <div>
                <span className="text-[28px] font-bold text-[#191F28]">{formatNumber(der, 0)}</span>
                <span className="text-[16px] font-medium text-[#8B95A1] ml-1">kcal</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[120px]">
              <span className="text-[15px] font-medium text-[#8B95A1]">권장 급여량</span>
              <div>
                <span className="text-[28px] font-bold text-[#3182F6]">{formatNumber(grams, 0)}</span>
                <span className="text-[16px] font-medium text-[#8B95A1] ml-1">g</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Recommendation Card */}
        <section className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[20px] font-bold text-[#191F28]">오늘의 맞춤 사료</h3>
            <Link to="/compare" className="text-[14px] font-medium text-[#3182F6]">
              비교하기 &gt;
            </Link>
          </div>

          <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden group active:scale-[0.98] transition-transform duration-200">
            <Link to={`/products/${featured.id}`} className="block">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="block text-[15px] font-bold text-[#8B95A1] mb-1">{featured.brand}</span>
                  <h4 className="text-[22px] font-bold text-[#191F28] leading-tight break-keep">
                    {featured.name}
                  </h4>
                </div>
                {/* Image Placeholder or Logic */}
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 ml-4">
                  <span className="text-2xl">🥣</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[13px] font-bold">
                  {positionLabel} 가격대
                </span>
                <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[13px] font-medium">
                  {formatNumber(featured.kcalPerKg)} kcal/kg
                </span>
              </div>

              {/* Price Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[13px] font-medium text-[#8B95A1] mb-2">
                  <span>저가</span>
                  <span className="text-[#3182F6] font-bold">현재 위치</span>
                  <span>고가</span>
                </div>
                <div className="h-2 bg-[#F2F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3182F6] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${position}%` }}
                  />
                </div>
              </div>

              {reasons.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-[14px] font-bold text-[#191F28] mb-2">추천 이유</p>
                  <ul className="space-y-1">
                    {reasons.map((reason, i) => (
                      <li key={i} className="text-[14px] text-[#4E5968] flex items-start">
                        <span className="mr-2 text-blue-500">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Link>
          </div>
        </section>

        {/* Shortcuts */}
        <section className="px-6 mb-12">
          <h3 className="text-[20px] font-bold text-[#191F28] mb-4 px-1">더 보기</h3>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <Link to="/calculator" className="flex items-center justify-between p-5 border-b border-slate-50 active:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl">🧮</div>
                <div>
                  <div className="text-[16px] font-bold text-[#191F28]">급여량 계산기</div>
                  <div className="text-[13px] text-[#8B95A1]">정확한 양을 계산해보세요</div>
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
        <footer className="px-6 text-center pb-8 border-t border-slate-200 mt-auto pt-8">
          <div className="inline-block opacity-60 mb-2">
            <DataSourceBadge source={source} loading={loading} error={error} />
          </div>
          <p className="text-[12px] text-[#8B95A1]">
            반려식탁은 수의학적 기준(WSAVA)을 준수합니다.
          </p>
        </footer>

      </div>
    </div>
  );
}
