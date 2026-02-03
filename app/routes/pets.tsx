import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/pets";
import { useAuth } from "../hooks/useAuth";
import {
  fetchPetProfiles,
  deletePetProfile,
  toPetProfile,
  type DbPetProfile,
} from "../utils/petProfiles";
import { saveStoredProfile } from "../utils/profile";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 내 반려동물" },
    { name: "description", content: "반려동물 프로필 관리" },
  ];
}

export default function PetsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState<DbPetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles() {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPetProfiles(user.id);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfiles();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePetProfile(id);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  function handleUseProfile(profile: DbPetProfile) {
    const petProfile = toPetProfile(profile);
    saveStoredProfile(petProfile);
    alert(`${profile.name} 프로필이 계산기에 적용되었습니다.`);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] pb-24">
        <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
          <header className="mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-6"
            >
              <span className="mr-1">←</span>
              <span className="text-sm">돌아가기</span>
            </button>
            <h1 className="text-[26px] font-bold text-[#191F28]">내 반려동물</h1>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
              <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#191F28] mb-3">로그인이 필요합니다</h2>
              <p className="text-[15px] text-[#8B95A1] mb-8">
                반려동물 프로필을 관리하려면<br />로그인해주세요.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all"
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

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
        <header className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
          >
            <span className="mr-1">←</span>
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[26px] font-bold text-[#191F28] mb-1">내 반려동물</h1>
              <p className="text-[15px] text-[#8B95A1]">
                반려동물 프로필을 등록하고 계산기에서 사용하세요.
              </p>
            </div>
          </div>
        </header>

        <Link
          to="/onboarding"
          className="block w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold mb-6 hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 text-center"
        >
          + 새 반려동물 등록
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-[20px]">
            <p className="text-[14px] text-red-600 text-center">⚠️ {error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[15px] text-[#8B95A1]">불러오는 중...</p>
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐾</span>
            </div>
            <p className="text-[16px] text-[#8B95A1]">등록된 반려동물이 없습니다.</p>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <article
                key={profile.id}
                className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-2xl">
                      {profile.species === "DOG" ? "🐕" : "🐈"}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-[#191F28]">
                        {profile.name}
                      </h3>
                      <p className="text-[14px] text-[#8B95A1]">
                        {profile.breed_name || "품종 미지정"} · {profile.weight_kg}kg
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      to={`/pets/edit/${profile.id}`}
                      className="p-2 text-[#8B95A1] hover:text-[#3182F6] hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="p-2 text-[#8B95A1] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#8B95A1]">중성화</span>
                    <span className="font-medium text-[#191F28]">
                      {profile.is_neutered ? "완료" : "미완료"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#8B95A1]">활동량</span>
                    <span className="font-medium text-[#191F28]">
                      {profile.activity_level}단계
                    </span>
                  </div>
                  {profile.allergies?.length > 0 && (
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#8B95A1]">알러지</span>
                      <span className="font-medium text-[#191F28]">
                        {profile.allergies.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUseProfile(profile)}
                  className="w-full py-3 bg-[#E8F3FF] text-[#3182F6] rounded-[16px] text-[15px] font-bold hover:bg-blue-100 active:scale-[0.98] transition-all"
                >
                  계산기에 적용
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
