import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/calculator";
import DataSourceBadge from "../components/DataSourceBadge";
import { useCatalogData } from "../hooks/useCatalogData";
import { useAuth } from "../hooks/useAuth";
import { calculateDer, calculateDailyGrams, mixPlan } from "../utils/calc";
import { formatNumber } from "../utils/format";
import { fetchPetProfiles, toPetProfile, type DbPetProfile } from "../utils/petProfiles";
import { saveStoredProfile, loadStoredProfile } from "../utils/profile";
import type { PetProfile, Product } from "../data/mock";
import { ProductImage, resolveProductImage } from "../components/ProductImage";
import ProductSelectionModal from "../components/ProductSelectionModal";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 계산기" },
    { name: "description", content: "RER/DER 및 혼합 급여 계산." },
  ];
}

const defaultProfile: PetProfile = {
  name: "",
  species: "DOG",
  breedId: "",
  weightKg: 5,
  isNeutered: false,
  activityLevel: 3,
  allergies: [],
};

export default function Calculator() {
  const { user, isAuthenticated } = useAuth();
  const { products, source, loading, error } = useCatalogData();
  const [showResults, setShowResults] = useState(false);
  const [feedingType, setFeedingType] = useState<"single" | "mixed">("single");
  const [selectedProduct1, setSelectedProduct1] = useState<Product | null>(null);
  const [selectedProduct2, setSelectedProduct2] = useState<Product | null>(null);
  const [ratio, setRatio] = useState(60);
  const [petProfiles, setPetProfiles] = useState<DbPetProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<"product1" | "product2" | null>(null);
  const [showActivityTooltip, setShowActivityTooltip] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("#activity-selector")) return;
      setShowActivityTooltip(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const [profile, setProfile] = useState<PetProfile>(defaultProfile);
  const [isClient, setIsClient] = useState(false);

  const [calculationResult, setCalculationResult] = useState<{
    der: number;
    dailyPrimary: number;
    mix: { gramsA: number; gramsB: number };
    rer: number;
  } | null>(null);

  useEffect(() => {
    const stored = loadStoredProfile();
    setProfile(stored);
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchPetProfiles(user.id).then(setPetProfiles).catch(console.error);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (products.length > 0) {
      setSelectedProduct1(products[0]);
      setSelectedProduct2(products[1] || products[0]);
    }
  }, [products]);

  const handleProfileChange = (profileId: string) => {
    const selected = petProfiles.find(p => p.id === profileId);
    if (selected) {
      const petProfile = toPetProfile(selected);
      setProfile(petProfile);
      saveStoredProfile(petProfile);
      setSelectedProfileId(profileId);
      setShowResults(false);
    }
  };

  const handleInputChange = (field: keyof PetProfile, value: unknown) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    saveStoredProfile(newProfile);
    setShowResults(false);
  };

  const handleCalculate = () => {
    const primary = selectedProduct1 || products[0];
    const secondary = selectedProduct2 || products[1] || products[0];

    const rer = 70 * Math.pow(profile.weightKg, 0.75);
    const der = calculateDer(
      profile.weightKg,
      profile.activityLevel,
      profile.isNeutered,
    );
    const dailyPrimary = calculateDailyGrams(der, primary?.kcalPerKg || 3500);
    const mix = mixPlan(der, primary, secondary, ratio / 100);

    setCalculationResult({
      der,
      dailyPrimary,
      mix,
      rer,
    });
    setShowResults(true);
  };

  const getActivityLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "매우 낮음 (거의 안 움직임)",
      2: "낮음 (가끔 산책)",
      3: "보통 (하루 30분 산책)",
      4: "높음 (하루 1시간 이상 활동)",
      5: "매우 높음 (많은 운 동)",
    };
    return labels[level] || "보통";
  };

  const filteredProducts = products.filter(p => p.species === profile.species);

  return (
    <div className="bg-[#F2F4F6] min-h-screen pb-24">
      <div className="px-5 pt-12 pb-6">
        <Link to="/" className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4">
          <span className="mr-1">←</span>
          <span className="text-sm">돌아가기</span>
        </Link>
        <h1 className="text-[26px] font-bold text-[#191F28] leading-tight">
          급여량 계산기 <span className="text-[26px]">🧮</span>
        </h1>
        <p className="text-[17px] text-[#8B95A1] mt-2">
          아이에게 딱 맞는 열 량을 계산해 보세요.
        </p>
      </div>

      <div className="px-5 space-y-6">
        <div className="flex justify-end">
          <DataSourceBadge source={source} loading={loading} error={error} />
        </div>

        {isAuthenticated && petProfiles.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {petProfiles.map((pet) => (
              <button
                key={pet.id}
                onClick={() => handleProfileChange(pet.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-[20px] text-[15px] font-bold transition-all ${selectedProfileId === pet.id
                  ? "bg-[#3182F6] text-white shadow-lg shadow-blue-500/30 ring-2 ring-white"
                  : "bg-white text-[#4E5968] shadow-sm"
                  }`}
              >
                {pet.species === "DOG" ? "🐕" : "🐈"} {pet.name}
              </button>
            ))}
            <Link
              to="/pets"
              className="flex-shrink-0 px-4 py-3 bg-white text-[#8B95A1] rounded-[20px] text-[15px] font-medium shadow-sm flex items-center gap-1"
            >
              + 추가
            </Link>
          </div>
        )}

        {!showResults ? (
          <>
            <section className="bg-white rounded-[28px] p-6 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#191F28] mb-6">기본 정보 입력</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[14px] font-medium text-[#8B95A1] mb-2">종류</label>
                  <div className="flex gap-3">
                    {[
                      { value: "DOG", label: "🐕 강아지" },
                      { value: "CAT", label: "🐈 고양이" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleInputChange("species", option.value);
                          setSelectedProduct1(null);
                          setSelectedProduct2(null);
                        }}
                        className={`flex-1 py-3 rounded-xl text-[15px] font-bold transition-all ${profile.species === option.value
                          ? "bg-[#3182F6] text-white"
                          : "bg-[#F2F4F6] text-[#4E5968]"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#8B95A1] mb-2">체중</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      value={profile.weightKg}
                      onChange={(e) => handleInputChange("weightKg", parseFloat(e.target.value) || 0)}
                      className="flex-1 text-[24px] font-bold text-[#191F28] py-2 pr-12 border-b-2 border-[#E5E8EB] focus:border-[#3182F6] focus:outline-none bg-transparent"
                      placeholder="5.0"
                    />
                    <span className="absolute right-0 text-[16px] font-bold text-[#8B95A1] pointer-events-none">kg</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl">
                    <span className="block text-[13px] text-[#8B95A1] mb-2">중성화 여부</span>
                    <div className="flex gap-2">
                      {[
                        { value: false, label: "안 함" },
                        { value: true, label: "했음" },
                      ].map((option) => (
                        <button
                          key={String(option.value)}
                          onClick={() => handleInputChange("isNeutered", option.value)}
                          className={`flex-1 py-2 rounded-lg text-[14px] font-bold transition-all ${profile.isNeutered === option.value
                            ? "bg-[#3182F6] text-white"
                            : "bg-white text-[#4E5968]"
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-2xl col-span-2 sm:col-span-1">
                    <span className="block text-[13px] text-[#8B95A1] mb-2">활동량 레벨</span>
                    <div className="flex gap-1 relative z-10">
                      {[
                        { level: 1, desc: "거의 안 움직임", example: "하루 대부분 휴식", emoji: "💤" },
                        { level: 2, desc: "가끔 산책", example: "주 2-3회 짧은 산책", emoji: "🙂" },
                        { level: 3, desc: "보통", example: "하루 30분 산책", emoji: "🐕" },
                        { level: 4, desc: "활발", example: "하루 1시간 이상 활동", emoji: "🏃" },
                        { level: 5, desc: "매우 활발", example: "장시간 운동, 놀이", emoji: "⚡" },
                      ].map(({ level, desc, example, emoji }) => {
                        const isSelected = profile.activityLevel === level;
                        return (
                          <div key={level} className="flex-1 relative group">
                            {/* Popup Tooltip (Below) */}
                            <div
                              className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-36 p-2 bg-white rounded-xl shadow-xl border border-blue-50 transition-all duration-300 ease-out origin-top z-50 pointer-events-none 
                                ${isSelected && showActivityTooltip ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}`}
                            >
                              {/* Arrow (Pointing Up) */}
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-t border-l border-blue-50 rotate-45" />

                              <div className="flex items-start gap-2 relative z-10">
                                <span className="text-lg shrink-0 leading-none mt-0.5">{emoji}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-[12px] text-[#191F28] mb-0.5 leading-tight">{desc}</p>
                                  <p className="text-[10px] text-[#8B95A1] leading-tight break-keep">{example}</p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                handleInputChange("activityLevel", level);
                                setShowActivityTooltip(true);
                              }}
                              className={`w-full py-2 rounded-lg text-[14px] font-bold transition-all relative z-10 ${isSelected
                                  ? "bg-[#3182F6] text-white shadow-md shadow-blue-500/20 scale-105"
                                  : "bg-white text-[#4E5968] border border-[#E5E8EB] hover:border-[#3182F6] hover:text-[#3182F6]"
                                }`}
                            >
                              {level}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[28px] p-6 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#191F28] mb-6">사료 선택</h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[14px] font-medium text-[#8B95A1]">
                      {feedingType === "single" ? "사료 선택" : "첫 번째 사료"}
                    </label>
                  </div>
                  <button
                    onClick={() => setModalTarget("product1")}
                    className="w-full p-4 bg-[#F9FAFB] rounded-xl flex items-center gap-3 text-left border border-[#F2F4F6] hover:border-[#3182F6] transition-colors"
                  >
                    {selectedProduct1 ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E8EB] p-1 flex items-center justify-center shrink-0">
                          <ProductImage
                            src={resolveProductImage(selectedProduct1.image, selectedProduct1.skus[0]?.image)}
                            alt={selectedProduct1.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-[#8B95A1]">{selectedProduct1.brand}</div>
                          <div className="text-[15px] font-bold text-[#191F28] truncate">{selectedProduct1.name}</div>
                        </div>
                        <span className="text-[#3182F6] text-[13px] font-medium whitespace-nowrap">{Math.round(selectedProduct1.kcalPerKg / 10)} kcal/100g</span>
                      </>
                    ) : (
                      <span className="text-[#8B95A1]">사료를 선택해 주세요</span>
                    )}
                    <span className="text-[#8B95A1]">▼</span>
                  </button>
                </div>

                {feedingType === "single" ? (
                  <button
                    onClick={() => {
                      setFeedingType("mixed");
                      setSelectedProduct2(null); // Reset or Keep logic? Let's reset for fresh start or keep existing if desired. Reset feels safer for "Add" action.
                    }}
                    className="w-full py-3 border-2 border-dashed border-[#E5E8EB] rounded-2xl text-[#8B95A1] font-bold text-[15px] hover:bg-[#F9FAFB] hover:border-[#3182F6] hover:text-[#3182F6] transition-all flex items-center justify-center gap-2"
                  >
                    <span>+</span> 사료 추가하기 (혼합 급여)
                  </button>
                ) : (
                  <>
                    <div className="relative animate-fadeIn">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[14px] font-medium text-[#8B95A1]">두 번째 사료</label>
                        <button
                          onClick={() => {
                            setFeedingType("single");
                            setSelectedProduct2(null);
                          }}
                          className="text-[12px] text-[#FF5B5B] font-medium hover:bg-[#FFF0F0] px-2 py-1 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                      <button
                        onClick={() => setModalTarget("product2")}
                        className="w-full p-4 bg-[#F9FAFB] rounded-xl flex items-center gap-3 text-left border border-[#F2F4F6] hover:border-[#3182F6] transition-colors"
                      >
                        {selectedProduct2 ? (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E8EB] p-1 flex items-center justify-center shrink-0">
                              <ProductImage
                                src={resolveProductImage(selectedProduct2.image, selectedProduct2.skus[0]?.image)}
                                alt={selectedProduct2.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-[#8B95A1]">{selectedProduct2.brand}</div>
                              <div className="text-[15px] font-bold text-[#191F28] truncate">{selectedProduct2.name}</div>
                            </div>
                            <span className="text-[#3182F6] text-[13px] font-medium whitespace-nowrap">{Math.round(selectedProduct2.kcalPerKg / 10)} kcal/100g</span>
                          </>
                        ) : (
                          <span className="text-[#8B95A1]">사료를 선택해 주세요</span>
                        )}
                        <span className="text-[#8B95A1]">▼</span>
                      </button>
                    </div>

                    <div className="p-4 bg-[#F9FAFB] rounded-2xl animate-fadeIn">
                      <label className="block text-[14px] font-medium text-[#8B95A1] mb-3">혼합 비율</label>
                      <div className="relative px-2">
                        <input
                          type="range"
                          min={20}
                          max={80}
                          step={5}
                          value={ratio}
                          onChange={(e) => setRatio(Number(e.target.value))}
                          className="w-full h-3 bg-[#E5E8EB] rounded-full appearance-none cursor-pointer focus:outline-none accent-[#3182F6]"
                        />
                        <div className="flex justify-between mt-3 text-[13px] font-bold">
                          <span className="text-[#3182F6]">{selectedProduct1?.brand || "사료1"} {ratio}%</span>
                          <span className="text-[#8B95A1]">{selectedProduct2?.brand || "사료2"} {100 - ratio}%</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <button
              onClick={handleCalculate}
              disabled={!selectedProduct1 || (feedingType === "mixed" && !selectedProduct2)}
              className="w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              계산하기
            </button>
          </>
        ) : (
          <>
            <section className="bg-[#3182F6] rounded-[28px] p-7 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{profile.species === "DOG" ? "🐕" : "🐈"}</span>
                  <span className="text-[18px] font-bold">{profile.name || "내 반려동물"}</span>
                </div>

                <div className="text-center py-6">
                  <span className="opacity-80 text-[15px] font-medium">일일 권장 급여량</span>
                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-[48px] font-bold">{formatNumber(calculationResult?.der || 0, 0)}</span>
                    <span className="text-[20px] font-medium opacity-80">kcal</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                  {feedingType === "single" ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] font-medium opacity-90">{selectedProduct1?.brand} 단독 급여</span>
                      <span className="text-[20px] font-bold">{formatNumber(calculationResult?.dailyPrimary || 0, 0)}g</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] font-medium opacity-90">{selectedProduct1?.brand} ({ratio}%)</span>
                        <span className="text-[18px] font-bold">{formatNumber(calculationResult?.mix?.gramsA || 0, 0)}g</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] font-medium opacity-90">{selectedProduct2?.brand} ({100 - ratio}%)</span>
                        <span className="text-[18px] font-bold">{formatNumber(calculationResult?.mix?.gramsB || 0, 0)}g</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute -right-6 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </section>

            <section className="bg-white rounded-[28px] p-6 shadow-sm">
              <h3 className="text-[18px] font-bold text-[#191F28] mb-5">상세 정보</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">기초 대사량 (RER)</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{formatNumber(calculationResult?.rer || 0, 0)} kcal</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">일일 에너지 필요량 (DER)</span>
                  <span className="text-[16px] font-bold text-[#3182F6]">{formatNumber(calculationResult?.der || 0, 0)} kcal</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">체중</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{profile.weightKg} kg</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">중성화 여부</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{profile.isNeutered ? "완료" : "미완료"}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">활동량</span>
                  <span className="text-[16px] font-bold text-[#191F28]">Level {profile.activityLevel}</span>
                </div>

                <div className="py-3">
                  <span className="text-[15px] text-[#8B95A1]">활동량 설명</span>
                  <p className="text-[14px] text-[#4E5968] mt-1">{getActivityLabel(profile.activityLevel)}</p>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">급여 방식</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{feedingType === "single" ? "단독 급여" : "혼합 급여"}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#F2F4F6]">
                  <span className="text-[15px] text-[#8B95A1]">선택된 사료</span>
                  <span className="text-[16px] font-bold text-[#191F28] text-right">
                    {selectedProduct1?.brand}
                    {feedingType === "mixed" && selectedProduct2 && ` + ${selectedProduct2.brand}`}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResults(false)}
                className="flex-1 py-4 bg-white text-[#4E5968] rounded-[20px] text-[17px] font-bold shadow-sm active:scale-[0.98] transition-transform"
              >
                다시 계산
              </button>

              {isAuthenticated && (
                <Link
                  to="/pets"
                  className="flex-1 py-4 bg-[#E8F3FF] text-[#3182F6] rounded-[20px] text-[17px] font-bold text-center shadow-sm active:scale-[0.98] transition-transform"
                >
                  프로필 저장
                </Link>
              )}
            </div>
          </>
        )}
      </div>
      <ProductSelectionModal
        isOpen={!!modalTarget}
        onClose={() => setModalTarget(null)}
        products={filteredProducts}
        title={modalTarget === "product1" ? (feedingType === "single" ? "사료 선택" : "첫 번째 사료 선택") : "두 번째 사료 선택"}
        onSelect={(product) => {
          if (modalTarget === "product1") {
            setSelectedProduct1(product);
          } else {
            setSelectedProduct2(product);
          }
        }}
      />
    </div>
  );
}
