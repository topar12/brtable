import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/admin.users.$userId";
import { createRow, fetchListByField, fetchUsersAuthInfo, updateRow } from "../utils/adminData";
import type { UserProfile } from "../utils/userProfiles";
import type { DbPetProfile } from "../utils/petProfiles";
import { Button } from "../components/admin";
import { useAuth } from "../hooks/useAuth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 사용자 상세" },
    { name: "description", content: "사용자 상세 정보" },
  ];
}

type UserRole = {
  user_id: string;
  role: "master" | "operator" | "user";
};

export default function AdminUserDetail() {
  const { userId } = useParams();
  const { isMaster } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pets, setPets] = useState<DbPetProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [pendingRole, setPendingRole] = useState<UserRole["role"] | null>(null);
  const [authInfo, setAuthInfo] = useState<{ email: string | null; last_sign_in_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => {
    if (!userId) return "user";
    return roles.find((item) => item.user_id === userId)?.role ?? "user";
  }, [roles, userId]);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;
    async function loadData() {
      setLoading(true);
      setError(null);

      const [profileResult, petResult, roleResult, authResult] = await Promise.all([
        fetchListByField<UserProfile>("user_profiles", "user_id", currentUserId),
        fetchListByField<DbPetProfile>("pet_profiles", "user_id", currentUserId, { orderBy: "created_at", ascending: false }),
        fetchListByField<UserRole>("users_roles", "user_id", currentUserId),
        fetchUsersAuthInfo([currentUserId]),
      ]);

      if (!profileResult.ok) {
        setError(profileResult.error);
      } else {
        setProfile(profileResult.data[0] ?? null);
      }

      if (petResult.ok) setPets(petResult.data ?? []);
      if (roleResult.ok) setRoles(roleResult.data ?? []);

      if (authResult.ok) {
        const info = authResult.data[0];
        setAuthInfo(info ? { email: info.email, last_sign_in_at: info.last_sign_in_at } : null);
      }

      setLoading(false);
    }

    loadData();
  }, [userId]);

  async function handleRoleConfirm() {
    if (!userId || !pendingRole) return;
    const payload = { user_id: userId, role: pendingRole };
    const result = roles.length
      ? await updateRow<UserRole>("users_roles", userId, payload, "user_id")
      : await createRow<UserRole>("users_roles", payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPendingRole(null);
    const rolesResult = await fetchListByField<UserRole>("users_roles", "user_id", userId);
    if (rolesResult.ok) setRoles(rolesResult.data ?? []);
  }

  async function handleBanToggle() {
    if (!profile) return;
    const nextValue = !profile.is_banned;
    const confirmed = window.confirm(nextValue ? "이 사용자를 밴 처리할까요?" : "밴을 해제할까요?");
    if (!confirmed) return;
    const result = await updateRow<UserProfile>("user_profiles", profile.id, {
      is_banned: nextValue,
      updated_at: new Date().toISOString(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setProfile(result.data);
  }

  async function handleDeactivate() {
    if (!profile) return;
    const confirmed = window.confirm("이 사용자를 탈퇴 처리할까요? 되돌릴 수 없습니다.");
    if (!confirmed) return;
    const result = await updateRow<UserProfile>("user_profiles", profile.id, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setProfile(result.data);
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/users" className="text-sm text-slate-500 hover:text-slate-700">
            ← 사용자 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-[#191F28] mt-2">사용자 상세</h1>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-sm mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#8B95A1] mb-1">이메일</p>
            <p className="text-[18px] font-bold text-[#191F28] break-all">
              {authInfo?.email ?? "-"}
            </p>
            <p className="text-sm text-[#8B95A1] mt-3">닉네임</p>
            <p className="text-[16px] font-semibold text-[#191F28]">{profile?.nickname ?? "-"}</p>
          </div>
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="text-sm text-[#8B95A1]">역할</div>
            <div className="flex items-center gap-2">
              {isMaster ? (
                <>
                  <select
                    value={pendingRole ?? role}
                    onChange={(event) => setPendingRole(event.target.value as UserRole["role"])}
                    className="admin-select"
                  >
                    <option value="user">일반</option>
                    <option value="operator">운영자</option>
                    <option value="master">마스터</option>
                  </select>
                  <Button variant="secondary" size="sm" onClick={handleRoleConfirm} disabled={!pendingRole}>
                    확인
                  </Button>
                </>
              ) : (
                <span className="text-sm font-semibold text-[#191F28]">
                  {role === "master" ? "마스터" : role === "operator" ? "운영자" : "일반"}
                </span>
              )}
            </div>
            <div className="text-sm text-[#8B95A1]">상태</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#191F28]">
                {profile?.deleted_at
                  ? "탈퇴"
                  : profile?.is_banned
                  ? "밴"
                  : "정상"}
              </span>
              {isMaster && (
                <>
                  <Button variant="secondary" size="sm" onClick={handleBanToggle}>
                    {profile?.is_banned ? "밴 해제" : "밴"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDeactivate}>
                    탈퇴
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#F2F4F6] rounded-[16px] p-4">
            <p className="text-xs text-[#8B95A1]">가입일</p>
            <p className="text-sm font-semibold text-[#191F28]">{formatDate(profile?.created_at)}</p>
          </div>
          <div className="bg-[#F2F4F6] rounded-[16px] p-4">
            <p className="text-xs text-[#8B95A1]">마지막 로그인</p>
            <p className="text-sm font-semibold text-[#191F28]">{formatDateTime(authInfo?.last_sign_in_at)}</p>
          </div>
          <div className="bg-[#F2F4F6] rounded-[16px] p-4">
            <p className="text-xs text-[#8B95A1]">반려동물 여부</p>
            <p className="text-sm font-semibold text-[#191F28]">{profile?.has_pet ? "있음" : "없음"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-[#191F28]">반려동물</h2>
          <span className="text-sm text-[#8B95A1]">{pets.length}마리</span>
        </div>

        {pets.length === 0 ? (
          <div className="text-sm text-[#8B95A1]">등록된 반려동물이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {pets.map((pet) => (
              <div key={pet.id} className="border border-[#E5E8EB] rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-[#191F28]">
                    {pet.name} · {pet.species === "DOG" ? "강아지" : "고양이"}
                  </div>
                  <span className="text-xs text-[#8B95A1]">{pet.is_active ? "활성" : "비활성"}</span>
                </div>
                <div className="text-sm text-[#4E5968]">
                  품종: {pet.breed_name ?? "-"} · 체중: {pet.weight_kg}kg · 중성화: {pet.is_neutered ? "예" : "아니오"}
                </div>
                <div className="text-xs text-[#8B95A1] mt-2">
                  활동량 {pet.activity_level} · 생일 {pet.birth_date ? formatDate(pet.birth_date) : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
