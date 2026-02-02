import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/welcome";
import { useAuth } from "../hooks/useAuth";
import { upsertMyUserProfile, checkProfileExists } from "../utils/userProfiles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 환영합니다" },
    { name: "description", content: "프로필 설정을 완료해주세요." },
  ];
}

const steps = [
  { id: "nickname", title: "반가워요!\n어떻게 불러드릴까요?", subtitle: "앱에서 사용할 닉네임을 알려주세요." },
  { id: "hasPet", title: "반려동물과\n함께하고 계신가요?", subtitle: "맞춤형 서비스를 제공해 드릴게요." },
  { id: "interests", title: "어떤 기능이\n필요하신가요?", subtitle: "관심 있는 기능을 선택해주세요. (선택)" },
  { id: "region", title: "어느 지역에\n계신가요?", subtitle: "지역 기반 서비스를 제공해 드려요. (선택)" },
  { id: "ageGroup", title: "연령대를\n알려주세요.", subtitle: "더 나은 서비스를 위해 활용됩니다. (선택)" },
  { id: "referral", title: "어떻게 알게\n되셨나요?", subtitle: "가입 경로를 알려주세요. (선택)" },
  { id: "complete", title: "모든 설정이\n완료되었어요!", subtitle: "반려식탁과 함께 건강한 반려생활을 시작핼보세요." },
];

const interestOptions = [
  { id: "food_recommend", label: "맞춤 사료 추천", icon: "🎯" },
  { id: "feeding_calc", label: "급여량 계산", icon: "🧮" },
  { id: "walk_record", label: "산책 기록", icon: "🚶" },
  { id: "health_care", label: "건강 관리", icon: "💪" },
];

const regionOptions = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const ageGroupOptions = ["20대", "30대", "40대", "50대 이상"];

const referralOptions = [
  { id: "friend", label: "지인 추천", icon: "👥" },
  { id: "search", label: "검색", icon: "🔍" },
  { id: "sns", label: "SNS", icon: "📱" },
  { id: "other", label: "기타", icon: "📝" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    hasPet: null as boolean | null,
    interests: [] as string[],
    region: "",
    ageGroup: "",
    referralSource: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Check if profile already exists
    const checkExisting = async () => {
      if (user?.id) {
        const hasProfile = await checkProfileExists(user.id);
        if (hasProfile) {
          navigate("/");
        } else if (user.user_metadata?.name) {
          setForm((prev) => ({ ...prev, nickname: user.user_metadata.name }));
        }
      }
    };
    checkExisting();
  }, [isAuthenticated, user, navigate]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const stepData = steps[currentStep];

  const canProceed = () => {
    switch (stepData.id) {
      case "nickname":
        return form.nickname.trim().length > 0;
      case "hasPet":
        return form.hasPet !== null;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipStep = () => {
    // Skip optional steps (3-6)
    if (currentStep >= 2 && currentStep <= 5) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const { error } = await upsertMyUserProfile({
      user_id: user.id,
      nickname: form.nickname.trim(),
      has_pet: form.hasPet ?? false,
      interests: form.interests,
      region: form.region || null,
      age_group: form.ageGroup || null,
      referral_source: form.referralSource || null,
    });

    setIsLoading(false);
    if (error) {
      alert("저장에 실패했습니다: " + error);
    } else {
      navigate("/");
    }
  };

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative">
      {/* Progress Bar */}
      <div className="h-1 bg-[#F2F4F6] w-full">
        <div
          className="h-full bg-[#3182F6] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-center">
        {currentStep > 0 ? (
          <button
            onClick={prevStep}
            className="text-[#8B95A1] p-2 -ml-2 hover:bg-[#F2F4F6] rounded-full transition-colors"
          >
            ← 이전
          </button>
        ) : (
          <div />
        )}
        <span className="text-[14px] text-[#8B95A1]">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-8 flex flex-col">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-[#191F28] whitespace-pre-line leading-tight">
            {stepData.title}
          </h1>
          <p className="text-[17px] text-[#8B95A1] mt-3">{stepData.subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {/* Nickname Step */}
          {stepData.id === "nickname" && (
            <div className="space-y-4">
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
                placeholder="예: 뽀삐맘, 초코아빠"
                className="w-full px-5 py-4 bg-[#F2F4F6] rounded-[16px] text-[18px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30"
                autoFocus
              />
            </div>
          )}

          {/* Has Pet Step */}
          {stepData.id === "hasPet" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setForm((prev) => ({ ...prev, hasPet: true }))}
                className={`p-6 rounded-[20px] border-2 transition-all ${
                  form.hasPet === true
                    ? "border-[#3182F6] bg-blue-50"
                    : "border-[#E5E8EB] hover:border-[#3182F6]/50"
                }`}
              >
                <div className="text-4xl mb-3">🐕🐈</div>
                <div className="text-[16px] font-bold text-[#191F28]">네, 키우고 있어요</div>
              </button>
              <button
                onClick={() => setForm((prev) => ({ ...prev, hasPet: false }))}
                className={`p-6 rounded-[20px] border-2 transition-all ${
                  form.hasPet === false
                    ? "border-[#3182F6] bg-blue-50"
                    : "border-[#E5E8EB] hover:border-[#3182F6]/50"
                }`}
              >
                <div className="text-4xl mb-3">🌱</div>
                <div className="text-[16px] font-bold text-[#191F28]">아직 없어요</div>
              </button>
            </div>
          )}

          {/* Interests Step */}
          {stepData.id === "interests" && (
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleInterest(option.id)}
                  className={`p-4 rounded-[16px] border-2 text-left transition-all ${
                    form.interests.includes(option.id)
                      ? "border-[#3182F6] bg-blue-50"
                      : "border-[#E5E8EB] hover:border-[#3182F6]/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-[14px] font-bold text-[#191F28]">{option.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Region Step */}
          {stepData.id === "region" && (
            <div className="grid grid-cols-3 gap-2">
              {regionOptions.map((region) => (
                <button
                  key={region}
                  onClick={() => setForm((prev) => ({ ...prev, region }))}
                  className={`py-3 px-2 rounded-[12px] text-[14px] font-medium transition-all ${
                    form.region === region
                      ? "bg-[#3182F6] text-white"
                      : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          )}

          {/* Age Group Step */}
          {stepData.id === "ageGroup" && (
            <div className="grid grid-cols-2 gap-3">
              {ageGroupOptions.map((age) => (
                <button
                  key={age}
                  onClick={() => setForm((prev) => ({ ...prev, ageGroup: age }))}
                  className={`py-4 rounded-[16px] border-2 text-[16px] font-bold transition-all ${
                    form.ageGroup === age
                      ? "border-[#3182F6] bg-blue-50 text-[#3182F6]"
                      : "border-[#E5E8EB] text-[#191F28] hover:border-[#3182F6]/50"
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          )}

          {/* Referral Step */}
          {stepData.id === "referral" && (
            <div className="grid grid-cols-2 gap-3">
              {referralOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setForm((prev) => ({ ...prev, referralSource: option.id }))}
                  className={`p-4 rounded-[16px] border-2 text-left transition-all ${
                    form.referralSource === option.id
                      ? "border-[#3182F6] bg-blue-50"
                      : "border-[#E5E8EB] hover:border-[#3182F6]/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-[14px] font-bold text-[#191F28]">{option.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Complete Step */}
          {stepData.id === "complete" && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎉</span>
              </div>
              <div className="space-y-2 text-left bg-[#F2F4F6] rounded-[16px] p-5">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#8B95A1]">닉네임</span>
                  <span className="font-medium text-[#191F28]">{form.nickname}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#8B95A1]">반려동물</span>
                  <span className="font-medium text-[#191F28]">{form.hasPet ? "있음" : "없음"}</span>
                </div>
                {form.interests.length > 0 && (
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#8B95A1]">관심사</span>
                    <span className="font-medium text-[#191F28]">{form.interests.length}개</span>
                  </div>
                )}
                {form.region && (
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#8B95A1]">지역</span>
                    <span className="font-medium text-[#191F28]">{form.region}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 pb-24">
          <button
            onClick={nextStep}
            disabled={!canProceed() || isLoading}
            className={`w-full py-4 rounded-[20px] text-[17px] font-bold transition-all ${
              canProceed() && !isLoading
                ? "bg-[#3182F6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                : "bg-[#E5E8EB] text-[#8B95A1] cursor-not-allowed"
            }`}
          >
            {isLoading
              ? "저장 중..."
              : currentStep === steps.length - 1
              ? "시작하기"
              : "다음"}
          </button>

          {currentStep >= 2 && currentStep <= 5 && (
            <button
              onClick={skipStep}
              className="w-full py-3 text-[15px] text-[#8B95A1] hover:text-[#4E5968] transition-colors"
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
