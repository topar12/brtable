import { Link, useParams } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/products.$id";
import DataSourceBadge from "../components/DataSourceBadge";
import { PriceChart } from "../components/PriceChart";
import { ProductImage, resolveProductImage } from "../components/ProductImage";
import { useCatalogData } from "../hooks/useCatalogData";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { usePriceHistory } from "../hooks/usePriceHistory";
import { pricePosition } from "../utils/calc";
import { formatNumber, formatPrice, pricePositionLabel } from "../utils/format";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 사료 상세" },
    { name: "description", content: "사료 영양 정보와 가격 위치." },
  ];
}

export default function ProductDetail() {
  const { products, source, loading, error } = useCatalogData();
  const { profile } = useStoredProfile();
  const { id } = useParams();
  const product = id ? products.find((item) => item.id === id) : undefined;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#191F28] font-bold mb-4">사료를 찾을 수 없어요 😢</p>
          <Link to="/products" className="text-[#3182F6] underline underline-offset-4">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const sku = product.skus[0];
  const position = pricePosition(sku.currentPrice, sku.priceHistory);
  const compareTarget = products.find((item) => item.id !== product.id);
  const allergyHits = profile.allergies.filter((allergy) =>
    product.allergens.includes(allergy),
  );
  const imageUrl = resolveProductImage(product.image, sku.image);
  const [days, setDays] = useState<30 | 90>(30);
  const { data: priceHistory, isLoading: isHistoryLoading } = usePriceHistory(sku.id, days);
  const minPrice = sku.priceHistory.length ? Math.min(...sku.priceHistory) : sku.currentPrice;
  const maxPrice = sku.priceHistory.length ? Math.max(...sku.priceHistory) : sku.currentPrice;

  return (
    <div className="bg-[#F2F4F6] min-h-screen pb-28 relative">
      {/* Transparent Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-5 flex justify-between items-center">
        <Link to="/products" className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-[#191F28]">
          ←
        </Link>
        <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
          <DataSourceBadge source={source} loading={loading} error={error} small />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-b-[32px] overflow-hidden shadow-sm relative">
        <div className="pt-20 pb-8 px-6 flex flex-col items-center text-center">
          <div className="w-48 h-48 mb-6 relative">
            <ProductImage
              src={imageUrl}
              alt={`${product.brand} ${product.name}`}
              variant="detail"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>

          <span className="text-[#3182F6] font-bold text-[14px] mb-2 tracking-wide uppercase">{product.brand}</span>
          <h1 className="text-[22px] font-bold text-[#191F28] leading-snug mb-4 max-w-[80%] mx-auto">
            {product.name}
          </h1>

          <div className="text-[26px] font-bold text-[#191F28]">
            {formatPrice(sku.currentPrice)}
          </div>
          <p className="text-[14px] text-[#8B95A1] mt-1">{sku.sizeKg}kg 기준</p>

          {/* Key Specs Row */}
          <div className="flex gap-2 mt-8 w-full justify-center">
            <div className="bg-[#F2F4F6] px-4 py-2 rounded-2xl">
              <span className="block text-[12px] text-[#8B95A1]">칼로리</span>
              <span className="block text-[15px] font-bold text-[#191F28]">{formatNumber(product.kcalPerKg)}</span>
            </div>
            <div className="bg-[#F2F4F6] px-4 py-2 rounded-2xl">
              <span className="block text-[12px] text-[#8B95A1]">조단백</span>
              <span className="block text-[15px] font-bold text-[#191F28]">{product.protein}%</span>
            </div>
            <div className="bg-[#F2F4F6] px-4 py-2 rounded-2xl">
              <span className="block text-[12px] text-[#8B95A1]">조지방</span>
              <span className="block text-[15px] font-bold text-[#191F28]">{product.fat}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allergy Alert */}
      {allergyHits.length > 0 && (
        <div className="mx-5 mt-5 bg-[#FFF0F0] rounded-[24px] p-5 border border-[#FFE0E0]">
          <h3 className="text-[#FF5B5B] font-bold text-[15px] flex items-center gap-2 mb-2">
            ⚠️ 알러지 주의 성분 발견
          </h3>
          <p className="text-[14px] text-[#E03A3A] opacity-80 mb-3">
            우리 아이가 피해야 할 성분이 포함되어 있어요.
          </p>
          <div className="flex flex-wrap gap-2">
            {allergyHits.map(item => (
              <span key={item} className="bg-white text-[#FF5B5B] px-3 py-1 rounded-full text-[13px] font-bold shadow-sm">
                🚫 {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Price Analysis */}
      <div className="mx-5 mt-5 bg-white rounded-[24px] p-6 shadow-sm">
        <h3 className="text-[18px] font-bold text-[#191F28] mb-4">가격 분석</h3>

        <div className="mb-6">
          <div className="flex justify-between text-[14px] text-[#8B95A1] mb-2">
            <span>가격 위치</span>
            <span className="text-[#3182F6] font-bold">{pricePositionLabel(position)}</span>
          </div>
          <div className="h-3 bg-[#F2F4F6] rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 bg-[#3182F6]" style={{ left: `${position}%`, width: '4px', transform: 'translateX(-50%)' }} />
            <div className="h-full bg-[#3182F6] opacity-20" style={{ width: `${position}%` }} />
          </div>
          <div className="flex justify-between text-[12px] text-[#8B95A1] mt-2">
            <span>{formatPrice(minPrice)}</span>
            <span>{formatPrice(maxPrice)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[15px] font-bold text-[#191F28]">가격 추세 차트</h4>
            <div className="flex bg-[#F2F4F6] rounded-lg p-0.5">
              <button onClick={() => setDays(30)} className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${days === 30 ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}>30일</button>
              <button onClick={() => setDays(90)} className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${days === 90 ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}>90일</button>
            </div>
          </div>

          {isHistoryLoading ? (
            <div className="h-40 flex items-center justify-center text-[#8B95A1] text-[13px]">데이터 로딩 중...</div>
          ) : priceHistory.length > 0 ? (
            <PriceChart
              data={priceHistory}
              currentPrice={sku.currentPrice}
              minPrice={sku.priceHistory[0] ?? sku.currentPrice}
              maxPrice={sku.priceHistory[sku.priceHistory.length - 1] ?? sku.currentPrice}
              days={days}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-[#8B95A1] text-[13px]">데이터가 충분하지 않아요.</div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="mx-5 mt-5 bg-white rounded-[24px] p-6 shadow-sm mb-5">
        <h3 className="text-[18px] font-bold text-[#191F28] mb-4">원재료</h3>
        <div className="flex flex-wrap gap-2">
          {product.ingredients.map((item) => (
            <span key={item} className="px-3 py-1.5 bg-[#F9FAFB] text-[#4E5968] rounded-xl text-[13px] font-medium border border-[#F2F4F6]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-[88px] left-0 right-0 px-5 pointer-events-none">
        <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
          {compareTarget && (
            <Link
              to={`/compare?a=${product.id}&b=${compareTarget.id}`}
              className="flex-1 bg-white border border-[#E5E8EB] text-[#191F28] font-bold py-3.5 rounded-2xl shadow-lg text-center active:scale-[0.98] transition-transform"
            >
              VS 비교하기
            </Link>
          )}
          <button className="flex-[2] bg-[#3182F6] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 text-center active:scale-[0.98] transition-transform">
            구매하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
