import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchMyUserProfile, upsertMyUserProfile, checkNicknameAvailable } from "../utils/userProfiles";

export function meta() {
  return [
    { title: "반려식탁 | 사용자 프로필" },
    { name: "description", content: "사용자 정보와 반려동물 프로필 관리" },
  ];
}

function RoleBadge({ role }: { role: string }) {
  const labelMap: Record<string, string> = {
    master: "마스터",
    operator: "운영자",
    member: "보호자",
    guest: "게스트",
  };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-blue-50 text-[#3182F6]">
      {labelMap[role] ?? "보호자"}
    </span>
  );
}

const regionOptions = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const ageGroupOptions = ["20대", "30대", "40대", "50대 이상"];

export default function ProfilePage() {
  const { user, isAuthenticated, role, signOut } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    hasPet: null as boolean | null,
    region: "",
    ageGroup: "",
    interests: [] as string[],
    referralSource: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setProfileLoading(false);
      return;
    }

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      const { data, error } = await fetchMyUserProfile(user.id);
      if (error) {
        setProfileError(error);
      }
      if (data) {
        setForm({
          nickname: data.nickname ?? "",
          hasPet: data.has_pet,
          region: data.region ?? "",
          ageGroup: data.age_group ?? "",
          interests: data.interests ?? [],
          referralSource: data.referral_source ?? "",
        });
      } else {
        const fallbackNickname = user.user_metadata?.name ?? "";
        if (fallbackNickname) {
          setForm((prev) => ({ ...prev, nickname: fallbackNickname }));
        }
      }
      setProfileLoading(false);
    };

    loadProfile();
  }, [isAuthenticated, user?.id, user?.user_metadata?.name]);

  const handleSave = async () => {
    if (!user?.id) return;
    const trimmedNickname = form.nickname.trim();
    if (!trimmedNickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    const { available, error: nicknameError } = await checkNicknameAvailable(
      trimmedNickname,
      user.id
    );
    if (nicknameError) {
      alert("닉네임 확인에 실패했습니다: " + nicknameError);
      return;
    }
    if (!available) {
      alert("이미 사용 중인 닉네임입니다.");
      return;
    }
    setIsSaving(true);
    setProfileError(null);
    const { error } = await upsertMyUserProfile({
      user_id: user.id,
      nickname: trimmedNickname,
      has_pet: form.hasPet ?? false,
      interests: form.interests,
      region: form.region || null,
      age_group: form.ageGroup || null,
      referral_source: form.referralSource || null,
    });
    setIsSaving(false);
    if (error) {
      setProfileError(error);
      return;
    }
    alert("저장되었습니다.");
  };

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
            <h1 className="text-[26px] font-bold text-[#191F28]">사용자 프로필</h1>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
              <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">👤</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#191F28] mb-3">로그인이 필요합니다</h2>
              <p className="text-[15px] text-[#8B95A1] mb-8">
                사용자 정보를 확인하고<br />반려동물을 관리하려면 로그인해주세요.
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
          <Link
            to="/"
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
          >
            <span className="mr-1">←</span>
            <span className="text-sm">돌아가기</span>
          </Link>
          <h1 className="text-[26px] font-bold text-[#191F28]">사용자 프로필</h1>
        </header>

        <section className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] text-[#8B95A1] mb-1">사용자 정보</p>
              <p className="text-[20px] font-bold text-[#191F28] break-all">
                {user?.email ?? "이메일 정보 없음"}
              </p>
            </div>
            <RoleBadge role={role} />
          </div>
          <button
            onClick={signOut}
            className="mt-5 w-full py-3 bg-slate-100 text-[#8B95A1] rounded-[16px] text-[15px] font-bold hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            로그아웃
          </button>
        </section>

        <section className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#191F28]">내 정보</h2>
              <p className="text-[14px] text-[#8B95A1]">가입 시 입력한 정보를 확인하고 수정할 수 있어요.</p>
            </div>
          </div>

          {profileLoading && (
            <div className="bg-[#F2F4F6] rounded-[16px] p-4 text-center text-[14px] text-[#8B95A1]">
              불러오는 중...
            </div>
          )}

          {!profileLoading && (
            <div className="space-y-5">
              <div>
                <label className="text-[12px] text-[#8B95A1]">닉네임</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
                  placeholder="예: 뽀삐맘"
                  className="mt-2 w-full px-4 py-3 bg-[#F2F4F6] rounded-[14px] text-[15px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#8B95A1]">반려동물 여부</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, hasPet: true }))}
                    className={`py-3 rounded-[14px] text-[14px] font-bold transition-all ${
                      form.hasPet === true
                        ? "bg-blue-50 text-[#3182F6] border-2 border-[#3182F6]"
                        : "bg-[#F2F4F6] text-[#4E5968] border-2 border-transparent"
                    }`}
                  >
                    있어요
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, hasPet: false }))}
                    className={`py-3 rounded-[14px] text-[14px] font-bold transition-all ${
                      form.hasPet === false
                        ? "bg-blue-50 text-[#3182F6] border-2 border-[#3182F6]"
                        : "bg-[#F2F4F6] text-[#4E5968] border-2 border-transparent"
                    }`}
                  >
                    없어요
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-[#8B95A1]">지역</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                    className="mt-2 w-full px-3 py-3 bg-[#F2F4F6] rounded-[14px] text-[14px] text-[#191F28]"
                  >
                    <option value="">선택 안 함</option>
                    {regionOptions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-[#8B95A1]">연령대</label>
                  <select
                    value={form.ageGroup}
                    onChange={(e) => setForm((prev) => ({ ...prev, ageGroup: e.target.value }))}
                    className="mt-2 w-full px-3 py-3 bg-[#F2F4F6] rounded-[14px] text-[14px] text-[#191F28]"
                  >
                    <option value="">선택 안 함</option>
                    {ageGroupOptions.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {profileError && (
                <div className="p-3 bg-red-50 rounded-[14px] text-[13px] text-red-600 text-center">
                  ⚠️ {profileError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-3 rounded-[16px] text-[15px] font-bold transition-all ${
                  isSaving
                    ? "bg-[#E5E8EB] text-[#8B95A1]"
                    : "bg-[#3182F6] text-white hover:bg-blue-600 active:scale-[0.98]"
                }`}
              >
                {isSaving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-bold text-[#191F28]">반려동물 관리</h2>
            <span className="text-[13px] text-[#8B95A1]">프로필을 관리하세요</span>
          </div>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <Link
              to="/pets"
              className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">🐾</div>
                <div>
                  <div className="text-[16px] font-bold text-[#191F28]">반려동물 프로필 관리</div>
                  <div className="text-[13px] text-[#8B95A1]">등록된 프로필을 확인하세요</div>
                </div>
              </div>
              <span className="text-slate-300">›</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
