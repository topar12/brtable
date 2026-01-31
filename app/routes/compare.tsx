import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/compare";
import DataSourceBadge from "../components/DataSourceBadge";
import { useCatalogData } from "../hooks/useCatalogData";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { calculateDer, mixPlan, pricePosition } from "../utils/calc";
import { formatNumber, formatPrice } from "../utils/format";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 비교" },
    { name: "description", content: "사료 비교와 혼합 급여 안내." },
  ];
}

export default function Compare() {
  const { profile } = useStoredProfile();
  const { products, source, loading, error } = useCatalogData();
  const [params] = useSearchParams();
  const first =
    products.find((item) => item.id === params.get("a")) ?? products[0];
  const second =
    products.find((item) => item.id === params.get("b")) ??
    products[1] ??
    products[0];

  const der = calculateDer(
    profile.weightKg,
    profile.activityLevel,
    profile.isNeutered,
  );
  const mix = mixPlan(der, first, second, 0.5);

  const StatRow = ({ label, valA, valB, unit, highlight = false }: any) => {
    const max = Math.max(Number(valA), Number(valB));
    const winA = Number(valA) >= Number(valB);
    const winB = Number(valB) >= Number(valA);

    return (
      <div className="py-4 border-b border-[#F2F4F6] last:border-0">
        <div className="flex justify-between text-[13px] text-[#8B95A1] mb-2 px-1">
          <span>{label}</span>
          <span>{unit}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <span className={`text-[16px] font-bold ${highlight && winA ? "text-[#3182F6]" : "text-[#191F28]"}`}>
              {formatNumber(valA)}
            </span>
            {/* Bar A (Right aligned) */}
            <div className="h-1.5 bg-[#F2F4F6] rounded-full mt-1 flex justify-end">
              <div
                className={`h-full rounded-full ${highlight && winA ? "bg-[#3182F6]" : "bg-[#8B95A1]/30"}`}
                style={{ width: `${(Number(valA) / max) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-px h-8 bg-[#F2F4F6]" /> {/* Vertical Divider */}

          <div className="flex-1 text-left">
            <span className={`text-[16px] font-bold ${highlight && winB ? "text-[#EF4444]" : "text-[#191F28]"}`}>
              {formatNumber(valB)}
            </span>
            {/* Bar B (Left aligned) */}
            <div className="h-1.5 bg-[#F2F4F6] rounded-full mt-1 flex justify-start">
              <div
                className={`h-full rounded-full ${highlight && winB ? "bg-[#EF4444]" : "bg-[#8B95A1]/30"}`}
                style={{ width: `${(Number(valB) / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      {/* Sticky VS Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-[#F2F4F6] shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <Link to="/products" className="text-[#8B95A1] text-[14px]">← 목록</Link>
          <div className="text-[16px] font-bold">비교하기</div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="grid grid-cols-2 text-center pb-4">
          <div className="px-4 border-r border-[#F2F4F6]">
            <div className="text-[13px] text-[#8B95A1] mb-1 truncate">{first.brand}</div>
            <div className="text-[15px] font-bold text-[#191F28] leading-tight line-clamp-2 h-[42px] flex items-center justify-center">
              {first.name}
            </div>
          </div>
          <div className="px-4">
            <div className="text-[13px] text-[#8B95A1] mb-1 truncate">{second.brand}</div>
            <div className="text-[15px] font-bold text-[#191F28] leading-tight line-clamp-2 h-[42px] flex items-center justify-center">
              {second.name}
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-6">
        <div className="flex justify-center">
          <DataSourceBadge source={source} loading={loading} error={error} />
        </div>

        {/* Comparison Cards */}
        <section className="bg-white rounded-[24px] p-6 shadow-sm">
          <h3 className="text-[16px] font-bold mb-4">영양 성분 비교</h3>
          <StatRow label="조단백" unit="%" valA={first.protein} valB={second.protein} highlight />
          <StatRow label="조지방" unit="%" valA={first.fat} valB={second.fat} highlight />
          <StatRow label="조섬유" unit="%" valA={first.fiber} valB={second.fiber} />
          <StatRow label="수분" unit="%" valA={first.moisture} valB={second.moisture} />
          <StatRow label="칼로리" unit="kcal/kg" valA={first.kcalPerKg} valB={second.kcalPerKg} highlight />
        </section>

        <section className="bg-white rounded-[24px] p-6 shadow-sm">
          <h3 className="text-[16px] font-bold mb-4">가격 비교</h3>
          <StatRow
            label="현재가 (최소단위 기준)"
            unit="원"
            valA={first.skus[0].currentPrice}
            valB={second.skus[0].currentPrice}
            highlight
          />
          <div className="mt-4 text-[13px] text-[#8B95A1] text-center">
            * 사이트별/기간별 가격 변동이 있을 수 있습니다.
          </div>
        </section>

        {/* User Profile Recommendation */}
        <section className="bg-[#191F28] rounded-[24px] p-6 text-white text-center shadow-lg">
          <h3 className="text-[16px] font-bold mb-2">반반 급여하면?</h3>
          <p className="text-[14px] text-white/60 mb-6">
            {profile.name} (목표: {formatNumber(der, 0)}kcal) 기준 50:50 혼합 시
          </p>

          <div className="flex justify-center gap-6 items-end">
            <div>
              <div className="text-[13px] text-white/60 mb-1">{first.brand}</div>
              <div className="text-[24px] font-bold text-[#3182F6]">{formatNumber(mix.gramsA, 0)}g</div>
            </div>
            <div className="text-[20px] pb-1">+</div>
            <div>
              <div className="text-[13px] text-white/60 mb-1">{second.brand}</div>
              <div className="text-[24px] font-bold text-[#EF4444]">{formatNumber(mix.gramsB, 0)}g</div>
            </div>
          </div>
          <div className="mt-6">
            <Link to="/calculator" className="inline-block px-5 py-2.5 bg-white/10 rounded-full text-[13px] font-bold hover:bg-white/20 transition-colors">
              비율 조정하러 가기 →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
