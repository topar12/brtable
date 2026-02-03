import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/pets.edit.$id";
import { useAuth } from "../hooks/useAuth";
import { useCatalogData } from "../hooks/useCatalogData";
import {
    fetchPetProfiles,
    updatePetProfile,
    type DbPetProfile,
} from "../utils/petProfiles";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "반려식탁 | 프로필 수정" },
        { name: "description", content: "반려동물 프로필을 수정합니다." },
    ];
}

export default function EditPetPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { breeds } = useCatalogData();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<DbPetProfile | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [species, setSpecies] = useState<"DOG" | "CAT">("DOG");
    const [breedId, setBreedId] = useState<string>("");
    const [weight, setWeight] = useState<string>("");
    const [isNeutered, setIsNeutered] = useState(false);
    const [activityLevel, setActivityLevel] = useState<number>(3);
    const [birthDate, setBirthDate] = useState<string>("");
    const [allergies, setAllergies] = useState<string[]>([]);

    // UI State
    const [showBreedSelect, setShowBreedSelect] = useState(false);
    const [breedSearch, setBreedSearch] = useState("");

    useEffect(() => {
        async function loadPet() {
            if (!user?.id || !id) return;
            try {
                const pets = await fetchPetProfiles(user.id);
                const target = pets.find(p => p.id === id);
                if (target) {
                    setProfile(target);
                    // Initialize Form
                    setName(target.name);
                    setSpecies(target.species);
                    setBreedId(target.breed_id || "");
                    setWeight(target.weight_kg.toString());
                    setIsNeutered(target.is_neutered);
                    setActivityLevel(target.activity_level);
                    setBirthDate(target.birth_date ? target.birth_date.split('T')[0] : "");
                    setAllergies(target.allergies || []);
                } else {
                    alert("반려동물을 찾을 수 없습니다.");
                    navigate("/pets");
                }
            } catch (e) {
                console.error(e);
                alert("프로필을 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        }

        if (isAuthenticated) {
            loadPet();
        } else if (!loading && !isAuthenticated) {
            navigate("/login");
        }
    }, [user, id, isAuthenticated, navigate]);

    const availableBreeds = breeds.filter((b) => b.species === species);
    const allergyOptions = ["닭", "소", "생선", "양", "오리", "곡물"];

    const toggleAllergy = (allergy: string) => {
        setAllergies(prev =>
            prev.includes(allergy)
                ? prev.filter(a => a !== allergy)
                : [...prev, allergy]
        );
    };

    const handleSave = async () => {
        if (!profile || !id) return;

        try {
            const matchedBreed = breeds.find(b => b.id === breedId);

            await updatePetProfile(id, {
                name,
                species,
                breed_id: breedId || null,
                breed_name: matchedBreed?.name || null,
                weight_kg: Number(weight),
                is_neutered: isNeutered,
                activity_level: activityLevel as 1 | 2 | 3 | 4 | 5,
                birth_date: birthDate ? new Date(birthDate).toISOString() : null,
                allergies,
            });

            alert("수정되었습니다.");
            navigate("/pets", { replace: true });
        } catch (e) {
            alert("저장에 실패했습니다.");
            console.error(e);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center">불러오는 중...</div>;
    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#F2F4F6] pb-24 font-['Pretendard']">
            <div className="max-w-md mx-auto min-h-screen flex flex-col">

                {/* Header */}
                <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
                    >
                        <span className="mr-1 text-lg">←</span>
                    </button>
                    <span className="font-bold text-[#191F28] ml-3 text-[17px]">프로필 수정</span>
                </header>

                <main className="px-6 py-6 flex flex-col gap-6">

                    {/* Section 1: Basic Info */}
                    <section className="bg-white rounded-[24px] p-6 shadow-sm space-y-6">
                        <h2 className="font-bold text-[18px] text-[#191F28]">기본 정보</h2>

                        {/* Name */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">이름</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-12 px-4 rounded-[14px] bg-[#F9FAFB] border border-[#F2F4F6] focus:border-[#3182F6] focus:outline-none font-bold text-[#191F28]"
                            />
                        </div>

                        {/* Species */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">종류</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSpecies("DOG")}
                                    className={`py-3 rounded-[14px] font-bold transition-all ${species === "DOG" ? "bg-[#E8F3FF] text-[#3182F6]" : "bg-[#F9FAFB] text-[#8B95A1]"
                                        }`}
                                >강아지</button>
                                <button
                                    onClick={() => setSpecies("CAT")}
                                    className={`py-3 rounded-[14px] font-bold transition-all ${species === "CAT" ? "bg-[#E8F3FF] text-[#3182F6]" : "bg-[#F9FAFB] text-[#8B95A1]"
                                        }`}
                                >고양이</button>
                            </div>
                        </div>

                        {/* Breed */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">품종</label>
                            <button
                                onClick={() => setShowBreedSelect(true)}
                                className="w-full h-12 px-4 rounded-[14px] bg-[#F9FAFB] border border-[#F2F4F6] text-left flex items-center justify-between active:bg-[#F2F4F6] transition-colors"
                            >
                                <span className={`font-bold ${breedId ? "text-[#191F28]" : "text-[#ADB5BD]"}`}>
                                    {availableBreeds.find(b => b.id === breedId)?.name || "품종 선택"}
                                </span>
                                <span className="text-[#8B95A1] text-[12px]">▼</span>
                            </button>
                        </div>

                        {/* Breed Selection Modal */}
                        {/* Breed Selection Modal (Bottom Sheet) */}
                        {showBreedSelect && (
                            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-[fadeIn_0.2s_ease-out]">
                                <div
                                    className="bg-white w-full max-w-md rounded-t-[24px] max-h-[60vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Handle Bar */}
                                    <div className="flex justify-center pt-2 pb-1" onClick={() => setShowBreedSelect(false)}>
                                        <div className="w-10 h-1 bg-[#E5E8EB] rounded-full cursor-pointer opacity-80 hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Header */}
                                    <div className="px-5 pb-2 border-b border-[#F2F4F6] flex items-center justify-between">
                                        <h3 className="font-bold text-[16px] text-[#191F28]">품종 선택</h3>
                                        <button
                                            onClick={() => setShowBreedSelect(false)}
                                            className="p-2 -mr-2 text-[#8B95A1] hover:text-[#333D4B]"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Search */}
                                    <div className="px-4 py-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="품종을 검색해주세요"
                                                value={breedSearch}
                                                onChange={(e) => setBreedSearch(e.target.value)}
                                                className="w-full bg-[#F2F4F6] pl-9 pr-3 py-2 rounded-[10px] text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                                autoFocus
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B95A1]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0 overscroll-contain">
                                        <div className="space-y-0.5">
                                            {availableBreeds
                                                .filter(b => b.name.includes(breedSearch))
                                                .map(breed => (
                                                    <button
                                                        key={breed.id}
                                                        onClick={() => {
                                                            setBreedId(breed.id);
                                                            setShowBreedSelect(false);
                                                        }}
                                                        className={`w-full py-2 text-left border-b border-[#F2F4F6] last:border-0 flex items-center justify-between hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors px-2 rounded-lg ${breedId === breed.id
                                                            ? "text-[#3182F6] font-bold"
                                                            : "text-[#333D4B]"
                                                            }`}
                                                    >
                                                        <span className="text-[14px]">{breed.name}</span>
                                                        {breedId === breed.id && <span className="text-[14px]">✓</span>}
                                                    </button>
                                                ))
                                            }
                                            {availableBreeds.filter(b => b.name.includes(breedSearch)).length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-10 text-[#8B95A1]">
                                                    <span className="text-3xl mb-2">🔍</span>
                                                    <p className="text-[14px]">검색 결과가 없습니다.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Birthday */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">생년월일</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full h-12 px-4 rounded-[14px] bg-[#F9FAFB] border border-[#F2F4F6] focus:border-[#3182F6] focus:outline-none"
                            />
                        </div>
                    </section>

                    {/* Section 2: Physical Info */}
                    <section className="bg-white rounded-[24px] p-6 shadow-sm space-y-6">
                        <h2 className="font-bold text-[18px] text-[#191F28]">신체 정보</h2>

                        {/* Weight */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">몸무게 (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full h-12 px-4 rounded-[14px] bg-[#F9FAFB] border border-[#F2F4F6] focus:border-[#3182F6] focus:outline-none font-bold text-[#191F28]"
                            />
                        </div>

                        {/* Neutered */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">중성화 여부</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsNeutered(true)}
                                    className={`flex-1 py-3 rounded-[14px] font-bold transition-all ${isNeutered ? "bg-[#E8F3FF] text-[#3182F6]" : "bg-[#F9FAFB] text-[#8B95A1]"
                                        }`}
                                >했어요</button>
                                <button
                                    onClick={() => setIsNeutered(false)}
                                    className={`flex-1 py-3 rounded-[14px] font-bold transition-all ${!isNeutered ? "bg-[#E8F3FF] text-[#3182F6]" : "bg-[#F9FAFB] text-[#8B95A1]"
                                        }`}
                                >안 했어요</button>
                            </div>
                        </div>

                        {/* Activity */}
                        <div>
                            <label className="block text-[14px] font-bold text-[#8B95A1] mb-2">활동량 (1~5단계)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(Number(e.target.value))}
                                    className="flex-1 h-2 bg-[#E5E8EB] rounded-full accent-[#3182F6]"
                                />
                                <span className="font-bold text-[#3182F6] w-8 text-center">{activityLevel}</span>
                            </div>
                            <p className="text-[13px] text-[#8B95A1] mt-2 text-right">높을수록 활동적임</p>
                        </div>
                    </section>

                    {/* Section 3: Allergies */}
                    <section className="bg-white rounded-[24px] p-6 shadow-sm space-y-4">
                        <h2 className="font-bold text-[18px] text-[#191F28]">알러지 정보</h2>
                        <div className="flex flex-wrap gap-2">
                            {allergyOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleAllergy(opt)}
                                    className={`px-4 py-2 rounded-[14px] text-[14px] font-bold transition-all ${allergies.includes(opt)
                                        ? "bg-[#FFEBEB] text-[#FF5B5B]"
                                        : "bg-[#F9FAFB] text-[#8B95A1]"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-[#3182F6] text-white rounded-[20px] font-bold text-[17px] shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
                    >
                        저장하기
                    </button>

                    <button
                        onClick={() => navigate("/pets")}
                        className="w-full py-4 bg-white text-[#8B95A1] rounded-[20px] font-bold text-[15px] hover:bg-[#F9FAFB] transition-colors"
                    >
                        취소
                    </button>

                </main>
            </div>
        </div >
    );
}
