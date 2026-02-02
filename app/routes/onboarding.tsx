import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/onboarding";
import { defaultPet } from "../data/mock";
import DataSourceBadge from "../components/DataSourceBadge";
import { useAuth } from "../hooks/useAuth";
import { useCatalogData } from "../hooks/useCatalogData";
import { createPetProfile } from "../utils/petProfiles";
import { loadStoredProfile, saveStoredProfile } from "../utils/profile";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 프로필 설정" },
    { name: "description", content: "반려동물 맞춤 설정을 시작합니다." },
  ];
}

const steps = [
  { id: "species", title: "어떤 아이와\n함께하고 계신가요?", subtitle: "맞춤형 급여량을 계산해 드릴게요." },
  { id: "name", title: "아이의 이름은\n무엇인가요?", subtitle: "다정하게 불러드릴게요." },
  { id: "birth", title: "생년월일을\n알려주세요.", subtitle: "모르면 건너뛰어도 돼요." },
  { id: "breed", title: "품종을\n알려주세요.", subtitle: "품종별 평균 데이터와 비교해 드려요." },
  { id: "age_gender", title: "성별과 중성화 여부를\n확인해주세요.", subtitle: "호르몬 변화에 따라 필요 열량이 달라져요." }, // Combined for simplicity or split? stick to split if easy, but maybe cleaner combined. Let's stick to simple steps.
  { id: "weight", title: "몸무게는\n얼마인가요?", subtitle: "정확한 급여량 계산의 기준이 돼요." },
  { id: "activity", title: "평소 활동량은\n어떤가요?", subtitle: "산책 횟수나 움직임을 떠올려주세요." },
  { id: "allergies", title: "혹시 못 먹는\n음식이 있나요?", subtitle: "알러지 유발 성분을 사료 추천에서 제외해요." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { breeds, source, loading, error } = useCatalogData();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(defaultPet);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setProfile(loadStoredProfile());
  }, []);

  const availableBreeds = useMemo(
    () => breeds.filter((breed) => breed.species === profile.species),
    [breeds, profile.species],
  );

  // Auto-select first breed if needed
  useEffect(() => {
    if (!availableBreeds.length) return;
    const exists = availableBreeds.some((breed) => breed.id === profile.breedId);
    if (!exists) {
      setProfile((prev) => ({
        ...prev,
        breedId: availableBreeds[0].id,
      }));
    }
  }, [availableBreeds, profile.breedId]);

  const allergyOptions = ["닭", "소", "생선", "양", "오리", "곡물"];

  function toggleAllergy(allergy: string) {
    setProfile((prev) => {
      const nextAllergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter((item) => item !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies: nextAllergies };
    });
  }

  async function handleSave() {
    const matchedBreed = availableBreeds.find((breed) => breed.id === profile.breedId);
    if (isAuthenticated && user?.id) {
      try {
        await createPetProfile({
          user_id: user.id,
          name: profile.name.trim() || "이름 없음",
          species: profile.species,
          breed_id: profile.breedId || null,
          breed_name: matchedBreed?.name ?? null,
          weight_kg: profile.weightKg,
          is_neutered: profile.isNeutered,
          activity_level: profile.activityLevel,
          allergies: profile.allergies,
          birth_date: profile.birthDate ? new Date(profile.birthDate).toISOString() : null,
          image_url: null,
          is_active: true,
        });
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "저장에 실패했습니다.";
        alert(message);
        return;
      }
    }

    saveStoredProfile(profile);
    navigate("/pets", { replace: true });
  }

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const stepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1 bg-[#F2F4F6] w-full">
        <div
          className="h-full bg-[#3182F6] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header (Back button) */}
      <div className="px-5 py-4 flex justify-between items-center">
        {currentStep > 0 ? (
          <button onClick={prevStep} className="text-[#8B95A1] p-2 -ml-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
            ← 이전
          </button>
        ) : (
          <Link to="/" className="text-[#8B95A1] p-2 -ml-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
            ✕ 닫기
          </Link>
        )}
        <DataSourceBadge source={source} loading={loading} error={error} small />
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 pt-4 pb-24 flex flex-col animate-fadeIn">
        <h1 className="text-[26px] font-bold text-[#191F28] whitespace-pre-line leading-snug mb-2">
          {stepData.title}
        </h1>
        <p className="text-[16px] text-[#8B95A1] mb-10">
          {stepData.subtitle}
        </p>

        <div className="flex-1">
          {/* Step 1: Species */}
          {stepData.id === "species" && (
            <div className="space-y-3">
              <button
                onClick={() => setProfile(p => ({ ...p, species: "DOG" }))}
                className={`w-full p-6 rounded-[24px] border-2 text-left transition-all ${profile.species === "DOG"
                    ? "border-[#3182F6] bg-[#E8F3FF]"
                    : "border-[#F2F4F6] bg-white hover:bg-[#F9FAFB]"
                  }`}
              >
                <span className="text-[32px] block mb-2">🐕</span>
                <span className={`text-[18px] font-bold ${profile.species === "DOG" ? "text-[#3182F6]" : "text-[#191F28]"}`}>강아지</span>
              </button>
              <button
                onClick={() => setProfile(p => ({ ...p, species: "CAT" }))}
                className={`w-full p-6 rounded-[24px] border-2 text-left transition-all ${profile.species === "CAT"
                    ? "border-[#3182F6] bg-[#E8F3FF]"
                    : "border-[#F2F4F6] bg-white hover:bg-[#F9FAFB]"
                  }`}
              >
                <span className="text-[32px] block mb-2">🐈</span>
                <span className={`text-[18px] font-bold ${profile.species === "CAT" ? "text-[#3182F6]" : "text-[#191F28]"}`}>고양이</span>
              </button>
            </div>
          )}

          {/* Step 2: Name */}
          {stepData.id === "name" && (
            <div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="예: 뽀삐"
                className="w-full text-[24px] font-bold border-b-2 border-[#E5E8EB] py-3 focus:border-[#3182F6] focus:outline-none placeholder:text-[#CED4DA]"
                autoFocus
              />
            </div>
          )}

          {/* Step 3: Birth Date */}
          {stepData.id === "birth" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-[#8B95A1] mb-2">
                  생년월일
                </label>
                <input
                  type="date"
                  value={profile.birthDate ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value || null }))}
                  className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[14px] text-[16px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, birthDate: null }))}
                className="w-full py-3 rounded-[14px] text-[15px] font-bold bg-[#F2F4F6] text-[#8B95A1] hover:bg-[#E5E8EB] transition-colors"
              >
                모름
              </button>
            </div>
          )}

          {/* Step 4: Breed */}
          {stepData.id === "breed" && (
            <div>
              <select
                value={profile.breedId}
                onChange={(e) => setProfile(p => ({ ...p, breedId: e.target.value }))}
                className="w-full p-4 text-[18px] font-medium bg-[#F9FAFB] rounded-[16px] border border-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:outline-none appearance-none"
              >
                {availableBreeds.map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
              <p className="mt-4 text-[14px] text-[#8B95A1] bg-[#F2F4F6] p-4 rounded-[16px]">
                💡 품종을 선택하면 평균 체중과 유전적 특징을 참고할 수 있어요.
              </p>
            </div>
          )}

          {/* Step 4: Age/Gender/Neutered (Simplified to Neutered for now based on mock) */}
          {stepData.id === "age_gender" && (
            <div className="space-y-4">
              <label className="block text-[15px] font-bold text-[#4E5968] mb-2">중성화 수술을 했나요?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProfile(p => ({ ...p, isNeutered: true }))}
                  className={`p-5 rounded-[20px] text-center font-bold transition-all ${profile.isNeutered
                      ? "bg-[#3182F6] text-white shadow-md"
                      : "bg-[#F2F4F6] text-[#8B95A1]"
                    }`}
                >
                  했어요
                </button>
                <button
                  onClick={() => setProfile(p => ({ ...p, isNeutered: false }))}
                  className={`p-5 rounded-[20px] text-center font-bold transition-all ${!profile.isNeutered
                      ? "bg-[#3182F6] text-white shadow-md"
                      : "bg-[#F2F4F6] text-[#8B95A1]"
                    }`}
                >
                  아직 안 했어요
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Weight */}
          {stepData.id === "weight" && (
            <div>
              <div className="relative flex items-center justify-center">
                <input
                  type="number"
                  value={profile.weightKg}
                  onChange={(e) => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))}
                  className="w-[120px] text-center text-[40px] font-bold border-b-2 border-[#E5E8EB] py-3 focus:border-[#3182F6] focus:outline-none bg-transparent"
                  autoFocus
                />
                <span className="text-[24px] font-bold text-[#8B95A1] ml-2 mt-2">kg</span>
              </div>
            </div>
          )}

          {/* Step 6: Activity */}
          {stepData.id === "activity" && (
            <div className="text-center px-4">
              <div className="text-[60px] mb-4 transition-all duration-300 transform">
                {profile.activityLevel === 1 && "💤"}
                {profile.activityLevel === 2 && "🏠"}
                {profile.activityLevel === 3 && "🚶"}
                {profile.activityLevel === 4 && "🏃"}
                {profile.activityLevel === 5 && "⚡️"}
              </div>
              <p className="text-[18px] font-bold text-[#3182F6] mb-8">
                Level {profile.activityLevel}
              </p>
              <input
                type="range"
                min={1}
                max={5}
                value={profile.activityLevel}
                onChange={(e) => setProfile(p => ({ ...p, activityLevel: Number(e.target.value) as any }))}
                className="w-full h-4 bg-[#E5E8EB] rounded-full appearance-none cursor-pointer accent-[#3182F6]"
              />
              <div className="flex justify-between mt-4 text-[13px] text-[#8B95A1]">
                <span>적음</span>
                <span>많음</span>
              </div>
            </div>
          )}

          {/* Step 7: Allergies */}
          {stepData.id === "allergies" && (
            <div className="grid grid-cols-2 gap-3">
              {allergyOptions.map((allergy) => (
                <button
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                  className={`p-4 rounded-[16px] font-bold transition-all ${profile.allergies.includes(allergy)
                      ? "bg-[#FFEBEB] text-[#FF5B5B] ring-2 ring-[#FF5B5B]"
                      : "bg-[#F9FAFB] text-[#4E5968] hover:bg-[#F2F4F6]"
                    }`}
                >
                  {allergy}
                </button>
              ))}
              <button
                onClick={() => setProfile(p => ({ ...p, allergies: [] }))}
                className={`col-span-2 p-4 rounded-[16px] font-medium border border-dashed border-[#CED4DA] text-[#8B95A1] hover:bg-[#F9FAFB]`}
              >
                없음 / 모름
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={nextStep}
          className="w-full bg-[#3182F6] text-white font-bold text-[17px] py-4 rounded-[20px] shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
        >
          {currentStep === steps.length - 1 ? "완료하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
