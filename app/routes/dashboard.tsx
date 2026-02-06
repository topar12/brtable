import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchPetProfiles, type DbPetProfile } from "../utils/petProfiles";
import { fetchWalkSessions, type WalkSession } from "../utils/walkSessions";
import { calculatePetAge, type DogSize } from "../utils/age-calculator";
import { calculateDer, calculateDailyGrams, estimateKcalPerKg } from "../utils/calc";
import { formatDurationWords } from "../utils/time";

export function meta() {
    return [
        { title: "내 반려동물 대시보드 - 반려식탁" },
        { name: "description", content: "내 반려동물의 모든 기록을 한눈에" },
    ];
}

// 체중으로 강아지 사이즈 추정
function getDogSize(weightKg: number): DogSize {
    if (weightKg < 10) return "SMALL";
    if (weightKg < 25) return "MEDIUM";
    if (weightKg < 45) return "LARGE";
    return "GIANT";
}

// 생년월일로 나이 계산
function getAgeFromBirthDate(birthDate: string | null): { years: number; months: number } {
    if (!birthDate) return { years: 0, months: 0 };
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months };
}

// 활동량 레벨 텍스트
function getActivityLevelText(level: number): string {
    const levels = ["매우 낮음", "낮음", "보통", "높음", "매우 높음"];
    return levels[level - 1] || "보통";
}

// 생애 단계 이모지
function getStageEmoji(stage: string): string {
    const emojiMap: Record<string, string> = {
        PUPPY: "🐕",
        JUNIOR: "🐶",
        ADULT: "🐕‍🦺",
        SENIOR: "👴",
        GERIATRIC: "🌟",
    };
    return emojiMap[stage] || "🐾";
}

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [pets, setPets] = useState<DbPetProfile[]>([]);
    const [sessions, setSessions] = useState<WalkSession[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setLoading(false);
            return;
        }

        let mounted = true;
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                // 병렬로 데이터 fetching (react-best-practices: async-parallel)
                console.log("[Dashboard] Fetching data for user:", user.id);
                const [petData, sessionData] = await Promise.all([
                    fetchPetProfiles(user.id),
                    fetchWalkSessions(user.id),
                ]);
                console.log("[Dashboard] Fetched pets:", petData.length, "sessions:", sessionData.length);

                if (!mounted) return;

                setPets(petData);
                setSessions(sessionData);

                if (petData.length > 0 && !selectedPetId) {
                    setSelectedPetId(petData[0].id);
                }
            } catch (err) {
                if (!mounted) return;
                console.error("[Dashboard] Fetch error:", err);
                setError(err instanceof Error ? err.message : "데이터를 불러오지 못했어요.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, user?.id]);

    const selectedPet = useMemo(
        () => pets.find((pet) => pet.id === selectedPetId) ?? pets[0],
        [pets, selectedPetId]
    );

    // 선택된 반려동물의 산책 기록
    const petSessions = useMemo(() => {
        if (!selectedPet) return [];
        return sessions.filter((s) => s.pet_id === selectedPet.id);
    }, [sessions, selectedPet]);

    // 산책 통계 계산
    const walkStats = useMemo(() => {
        const now = new Date();
        const weekStart = new Date(now);
        const day = weekStart.getDay();
        weekStart.setDate(now.getDate() - ((day + 6) % 7));
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyMs = petSessions
            .filter((s) => new Date(s.started_at) >= weekStart)
            .reduce((sum, s) => sum + s.duration_ms, 0);

        const monthlyMs = petSessions
            .filter((s) => new Date(s.started_at) >= monthStart)
            .reduce((sum, s) => sum + s.duration_ms, 0);

        const totalDistance = petSessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
        const totalWalks = petSessions.length;

        return {
            weeklyMs,
            monthlyMs,
            totalDistance: Math.round(totalDistance * 10) / 10,
            totalWalks,
            recentSessions: petSessions.slice(0, 3),
        };
    }, [petSessions]);

    // 나이 및 생애단계 계산
    const petAgeInfo = useMemo(() => {
        if (!selectedPet?.birth_date) return null;
        const { years, months } = getAgeFromBirthDate(selectedPet.birth_date);
        const size = selectedPet.species === "DOG" ? getDogSize(selectedPet.weight_kg) : "SMALL";
        return calculatePetAge(selectedPet.species, years, months, size);
    }, [selectedPet]);

    // 급여량 계산
    const feedingInfo = useMemo(() => {
        if (!selectedPet) return null;
        const derKcal = calculateDer(
            selectedPet.weight_kg,
            selectedPet.activity_level,
            selectedPet.is_neutered
        );
        // 평균적인 사료 기준 (3500kcal/kg)
        const avgKcalPerKg = 3500;
        const dailyGrams = calculateDailyGrams(derKcal, avgKcalPerKg);
        return {
            derKcal: Math.round(derKcal),
            dailyGrams: Math.round(dailyGrams),
        };
    }, [selectedPet]);

    // 비로그인 상태
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F2F4F6] pb-24">
                <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
                    <header className="mb-8">
                        <Link
                            to="/"
                            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-6"
                        >
                            <span className="mr-1">←</span>
                            <span className="text-sm">돌아가기</span>
                        </Link>
                        <h1 className="text-[26px] font-bold text-[#191F28]">내 대시보드</h1>
                    </header>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">📊</span>
                            </div>
                            <h2 className="text-[20px] font-bold text-[#191F28] mb-3">
                                로그인하고 대시보드를 만나보세요
                            </h2>
                            <p className="text-[15px] text-[#8B95A1] mb-8 leading-relaxed">
                                내 반려동물의 모든 기록을 한눈에!
                                <br />
                                산책 통계, 급여량 추천, 건강 관리까지
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/login"
                                    className="block w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                                >
                                    로그인하기
                                </Link>
                                <Link
                                    to="/"
                                    className="block w-full py-4 bg-[#F2F4F6] text-[#4E5968] rounded-[20px] text-[17px] font-bold text-center hover:bg-[#E5E8EB] active:scale-[0.98] transition-all"
                                >
                                    홈으로 돌아가기
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 로딩 상태
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F4F6] pb-24">
                <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
                    <header className="mb-6">
                        <Link
                            to="/"
                            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
                        >
                            <span className="mr-1">←</span>
                            <span className="text-sm">돌아가기</span>
                        </Link>
                        <h1 className="text-[26px] font-bold text-[#191F28]">내 대시보드</h1>
                    </header>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[15px] text-[#8B95A1]">불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 반려동물이 없는 경우
    if (pets.length === 0) {
        return (
            <div className="min-h-screen bg-[#F2F4F6] pb-24">
                <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
                    <header className="mb-6">
                        <Link
                            to="/"
                            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
                        >
                            <span className="mr-1">←</span>
                            <span className="text-sm">돌아가기</span>
                        </Link>
                        <h1 className="text-[26px] font-bold text-[#191F28]">내 대시보드</h1>
                    </header>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🐾</span>
                            </div>
                            <h2 className="text-[20px] font-bold text-[#191F28] mb-3">
                                아직 등록된 반려동물이 없어요
                            </h2>
                            <p className="text-[15px] text-[#8B95A1] mb-8 leading-relaxed">
                                반려동물을 등록하면
                                <br />
                                맞춤 대시보드를 이용할 수 있어요!
                            </p>
                            <Link
                                to="/onboarding"
                                className="block w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                            >
                                반려동물 등록하기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F4F6] pb-24">
            <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
                {/* Header */}
                <header className="mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
                    >
                        <span className="mr-1">←</span>
                        <span className="text-sm">돌아가기</span>
                    </Link>
                    <h1 className="text-[26px] font-bold text-[#191F28] mb-2">내 대시보드</h1>
                    <p className="text-[15px] text-[#8B95A1]">반려동물의 모든 기록을 한눈에</p>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-[20px]">
                        <p className="text-[14px] text-red-600 text-center">⚠️ {error}</p>
                    </div>
                )}

                {/* Pet Tabs */}
                {pets.length > 1 && (
                    <section className="mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {pets.map((pet) => (
                                <button
                                    key={pet.id}
                                    onClick={() => setSelectedPetId(pet.id)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-bold transition-all ${selectedPetId === pet.id
                                        ? "bg-[#3182F6] text-white shadow-lg shadow-blue-500/20"
                                        : "bg-white text-[#4E5968] hover:bg-slate-50"
                                        }`}
                                >
                                    <span>{pet.species === "CAT" ? "🐈" : "🐕"}</span>
                                    <span>{pet.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Pet Profile Card */}
                {selectedPet && (
                    <section className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[20px] flex items-center justify-center text-3xl flex-shrink-0">
                                {selectedPet.species === "CAT" ? "🐈" : "🐕"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[20px] font-bold text-[#191F28] mb-1 truncate">
                                    {selectedPet.name}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-[#3182F6] rounded-full text-[12px] font-bold">
                                        {selectedPet.species === "DOG" ? "강아지" : "고양이"}
                                    </span>
                                    {selectedPet.breed_name && (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-[#4E5968] rounded-full text-[12px] font-medium">
                                            {selectedPet.breed_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link
                                to={`/pets/edit/${selectedPet.id}`}
                                className="p-2 text-[#8B95A1] hover:text-[#3182F6] hover:bg-blue-50 rounded-xl transition-colors"
                            >
                                ✏️
                            </Link>
                        </div>

                        {/* Pet Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* 나이 정보 */}
                            {petAgeInfo && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[16px] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{getStageEmoji(petAgeInfo.stage)}</span>
                                        <p className="text-[12px] text-[#8B95A1]">나이</p>
                                    </div>
                                    <p className="text-[18px] font-bold text-[#191F28]">
                                        사람 나이 {petAgeInfo.humanAge}세
                                    </p>
                                    <p className="text-[12px] text-[#8B95A1] mt-1">{petAgeInfo.description}</p>
                                </div>
                            )}

                            {/* 체중 */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[16px] p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">⚖️</span>
                                    <p className="text-[12px] text-[#8B95A1]">체중</p>
                                </div>
                                <p className="text-[18px] font-bold text-[#191F28]">{selectedPet.weight_kg}kg</p>
                                <p className="text-[12px] text-[#8B95A1] mt-1">
                                    {selectedPet.is_neutered ? "중성화 완료" : "중성화 안함"}
                                </p>
                            </div>

                            {/* 활동량 */}
                            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-[16px] p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🔥</span>
                                    <p className="text-[12px] text-[#8B95A1]">활동량</p>
                                </div>
                                <p className="text-[18px] font-bold text-[#191F28]">
                                    {getActivityLevelText(selectedPet.activity_level)}
                                </p>
                                <div className="flex gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`w-4 h-2 rounded-full ${level <= selectedPet.activity_level ? "bg-orange-400" : "bg-slate-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 권장 급여량 */}
                            {feedingInfo && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[16px] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">🍽️</span>
                                        <p className="text-[12px] text-[#8B95A1]">권장 급여량</p>
                                    </div>
                                    <p className="text-[18px] font-bold text-[#191F28]">{feedingInfo.dailyGrams}g</p>
                                    <p className="text-[12px] text-[#8B95A1] mt-1">
                                        일일 {feedingInfo.derKcal}kcal
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Walk Statistics */}
                <section className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[18px] font-bold text-[#191F28]">🐾 산책 통계</h2>
                        <Link
                            to="/tools/walk-timer"
                            className="text-[13px] font-bold text-[#3182F6] hover:underline"
                        >
                            산책 시작 →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                            <p className="text-[12px] text-[#8B95A1] mb-2">이번 주</p>
                            <p className="text-[18px] font-bold text-[#191F28]">
                                {walkStats.weeklyMs > 0 ? formatDurationWords(walkStats.weeklyMs) : "0분"}
                            </p>
                        </div>
                        <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                            <p className="text-[12px] text-[#8B95A1] mb-2">이번 달</p>
                            <p className="text-[18px] font-bold text-[#191F28]">
                                {walkStats.monthlyMs > 0 ? formatDurationWords(walkStats.monthlyMs) : "0분"}
                            </p>
                        </div>
                        <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                            <p className="text-[12px] text-[#8B95A1] mb-2">총 거리</p>
                            <p className="text-[18px] font-bold text-[#191F28]">{walkStats.totalDistance}km</p>
                        </div>
                        <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                            <p className="text-[12px] text-[#8B95A1] mb-2">총 산책</p>
                            <p className="text-[18px] font-bold text-[#191F28]">{walkStats.totalWalks}회</p>
                        </div>
                    </div>

                    {/* 최근 산책 기록 */}
                    {walkStats.recentSessions.length > 0 && (
                        <div>
                            <p className="text-[13px] font-bold text-[#8B95A1] mb-3">최근 기록</p>
                            <div className="space-y-2">
                                {walkStats.recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm">
                                                🚶
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-medium text-[#191F28]">
                                                    {formatDurationWords(session.duration_ms)}
                                                </p>
                                                <p className="text-[12px] text-[#8B95A1]">
                                                    {new Date(session.started_at).toLocaleDateString("ko-KR", {
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {session.distance_km && (
                                            <span className="text-[13px] font-bold text-emerald-600">
                                                {session.distance_km}km
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {walkStats.totalWalks === 0 && (
                        <div className="text-center py-4">
                            <p className="text-[14px] text-[#8B95A1] mb-3">아직 산책 기록이 없어요</p>
                            <Link
                                to="/tools/walk-timer"
                                className="inline-flex items-center justify-center px-4 py-2 bg-[#3182F6] text-white rounded-[14px] text-[14px] font-bold"
                            >
                                첫 산책 시작하기
                            </Link>
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
                    <h2 className="text-[18px] font-bold text-[#191F28] mb-4">⚡ 빠른 액션</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <Link
                            to="/tools/walk-timer"
                            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[16px] hover:scale-[0.98] active:scale-95 transition-transform"
                        >
                            <span className="text-2xl">🚶</span>
                            <span className="text-[12px] font-bold text-[#191F28]">산책하기</span>
                        </Link>
                        <Link
                            to="/calculator"
                            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-[16px] hover:scale-[0.98] active:scale-95 transition-transform"
                        >
                            <span className="text-2xl">🧮</span>
                            <span className="text-[12px] font-bold text-[#191F28]">급여량계산</span>
                        </Link>
                        <Link
                            to="/tools/pet-age"
                            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[16px] hover:scale-[0.98] active:scale-95 transition-transform"
                        >
                            <span className="text-2xl">🎂</span>
                            <span className="text-[12px] font-bold text-[#191F28]">나이계산</span>
                        </Link>
                    </div>
                </section>

                {/* Tips Section */}
                {selectedPet && petAgeInfo && (
                    <section className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-white">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="text-2xl">💡</span>
                            <div>
                                <h3 className="text-[16px] font-bold mb-1">오늘의 건강 팁</h3>
                                <p className="text-[13px] text-white/80">
                                    {selectedPet.name}의 생애 단계에 맞는 관리 방법
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-[16px] p-4">
                            <p className="text-[14px] leading-relaxed">
                                {petAgeInfo.stage === "PUPPY" || petAgeInfo.stage === "JUNIOR"
                                    ? `${selectedPet.name}은(는) 성장기입니다! 충분한 단백질 섭취와 규칙적인 산책이 중요해요. 사회화 훈련도 이 시기에 필수랍니다.`
                                    : petAgeInfo.stage === "ADULT"
                                        ? `${selectedPet.name}은(는) 건강한 성년기입니다. 체중 관리와 규칙적인 운동으로 건강을 유지하세요. 매일 ${Math.round(selectedPet.weight_kg * 1.5)}분 이상 산책을 권장해요!`
                                        : `${selectedPet.name}은(는) 시니어 시기입니다. 관절 건강에 신경 쓰고, 정기적인 건강검진을 받아주세요. 부드러운 산책과 충분한 휴식이 필요해요.`}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
