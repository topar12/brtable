import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/products";
import DataSourceBadge from "../components/DataSourceBadge";
import { ProductImage, resolveProductImage } from "../components/ProductImage";
import { useCatalogData } from "../hooks/useCatalogData";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { pricePosition } from "../utils/calc";
import { formatNumber, formatPrice } from "../utils/format";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 사료" },
    { name: "description", content: "알러지 제외 기준의 사료 리스트." },
  ];
}

export default function Products() {
  const { profile } = useStoredProfile();
  const { products, source, loading, error } = useCatalogData();
  const [searchTerm, setSearchTerm] = useState("");

  const excluded = profile.allergies;

  // 1. Filter by Allergies
  const allergyFiltered = excluded.length
    ? products.filter(
      (product) =>
        !product.allergens.some((allergen) => excluded.includes(allergen)),
    )
    : products;

  // 2. Filter by Search Term
  const finalProducts = allergyFiltered.filter((product) =>
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hiddenCount = products.length - finalProducts.length;

  return (
    <div className="bg-[#F2F4F6] min-h-screen pb-24">
      {/* Sticky Header & Search */}
      <div className="bg-[#F2F4F6]/80 backdrop-blur-md sticky top-0 z-10 px-5 pt-5 pb-4 transition-all border-b border-black/5">
        <div className="max-w-md mx-auto">
          <header className="flex items-center mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
            >
              <span className="mr-1 text-lg">←</span>
              <span className="text-[15px] font-medium">돌아가기</span>
            </Link>
            <h1 className="text-[17px] font-bold text-[#191F28] ml-auto">사료 리스트</h1>
          </header>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="브랜드 또는 제품명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-[#191F28] placeholder-[#8B95A1] px-11 py-3.5 rounded-[20px] text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-[#3182F6]/10 focus:border-[#3182F6] border border-transparent transition-all shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Horizontal Filters */}
          {excluded.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              <span className="flex-shrink-0 bg-[#3182F6]/10 text-[#3182F6] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1">
                <span>🛡️</span>
                {excluded.length}개 제외중
              </span>
              {excluded.map((item) => (
                <span key={item} className="flex-shrink-0 bg-white border border-[#E5E8EB] text-[#4E5968] px-3 py-1.5 rounded-full text-[13px] font-medium">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Data Source Badge */}
        <div className="flex justify-end">
          <DataSourceBadge source={source} loading={loading} error={error} />
        </div>

        {/* Product List */}
        {finalProducts.length > 0 ? (
          finalProducts.map((product) => {
            const sku = product.skus[0];
            const position = pricePosition(sku.currentPrice, sku.priceHistory);
            const compareTarget = products.find((item) => item.id !== product.id) ?? product;
            const imageUrl = resolveProductImage(product.image, sku.image);
            const minPrice = sku.priceHistory.length
              ? Math.min(...sku.priceHistory)
              : sku.currentPrice;
            const maxPrice = sku.priceHistory.length
              ? Math.max(...sku.priceHistory)
              : sku.currentPrice;

            return (
              <article key={product.id} className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform duration-200">
                <Link to={`/products/${product.id}`} className="block">
                  <div className="flex gap-4">
                    {/* Left: Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-[#F2F4F6] rounded-2xl overflow-hidden">
                      <ProductImage
                        src={imageUrl}
                        alt={`${product.brand} ${product.name}`}
                        variant="card"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-[13px] text-[#8B95A1] font-medium mb-0.5">{product.brand}</span>
                      <h3 className="text-[16px] font-bold text-[#191F28] leading-snug truncate pr-2 mb-2">{product.name}</h3>

                      <div className="flex items-center gap-3">
                        <div className="bg-[#F2F4F6] px-2.5 py-1 rounded-lg">
                          <span className="text-[12px] text-[#4E5968] font-medium">{formatNumber(product.kcalPerKg)} kcal</span>
                        </div>
                        <span className="text-[15px] font-bold text-[#191F28]">{formatPrice(sku.currentPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Position Bar */}
                  <div className="mt-4 pt-4 border-t border-[#F2F4F6]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] text-[#8B95A1]">가격 위치</span>
                      <span className="text-[12px] text-[#4E5968] font-medium">
                        {formatPrice(minPrice)} ~ {formatPrice(maxPrice)}
                      </span>
                    </div>
                    <div className="h-2 bg-[#F2F4F6] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 bg-[#3182F6] rounded-full"
                        style={{ left: `${position}%`, width: '12px', transform: 'translateX(-50%)' }} // Dot style
                      />
                      <div
                        className="h-full bg-[#3182F6]"
                        style={{ width: `${position}%`, opacity: 0.3 }} // Bar style
                      />
                    </div>
                  </div>
                </Link>

                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/products/${product.id}`}
                    className="flex-1 py-3 text-[14px] font-semibold text-[#4E5968] bg-[#F2F4F6] rounded-xl text-center hover:bg-[#E5E8EB] transition-colors"
                  >
                    상세 정보
                  </Link>
                  <Link
                    to={`/compare?a=${product.id}&b=${compareTarget.id}`}
                    className="flex-1 py-3 text-[14px] font-semibold text-[#3182F6] bg-[#3182F6]/10 rounded-xl text-center hover:bg-[#3182F6]/20 transition-colors"
                  >
                    비교하기
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-[40px] mb-4">🔍</span>
            <p className="text-[17px] font-bold text-[#191F28] mb-2">조건에 맞는 사료가 없어요</p>
            <p className="text-[14px] text-[#8B95A1] mb-6">검색어를 변경하거나 필터를 조정해보세요.</p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-5 py-2.5 bg-[#3182F6] text-white rounded-xl text-[14px] font-bold hover:bg-[#2563EB] transition-colors"
            >
              모든 사료 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
