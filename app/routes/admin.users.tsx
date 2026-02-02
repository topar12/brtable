import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.users";
import { fetchAll } from "../utils/adminData";
import { Button, FormField } from "../components/admin";
import type { UserProfile } from "../utils/userProfiles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 사용자 관리" },
    { name: "description", content: "사용자 프로필 관리" },
  ];
}

type UserRole = {
  user_id: string;
  role: "master" | "operator" | "user";
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHasPet, setFilterHasPet] = useState<"all" | "yes" | "no">("all");
  const [filterRole, setFilterRole] = useState<"all" | "master" | "operator" | "user">("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const [profilesResult, rolesResult] = await Promise.all([
      fetchAll<UserProfile>("user_profiles", {
        orderBy: "created_at",
        ascending: false,
      }),
      fetchAll<UserRole>("users_roles"),
    ]);

    if (!profilesResult.ok) {
      setError(profilesResult.error);
    } else {
      setUsers(profilesResult.data || []);
    }

    if (rolesResult.ok) {
      setRoles(rolesResult.data || []);
    }

    setLoading(false);
  }

  const getUserRole = (userId: string) => {
    const role = roles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPetFilter =
      filterHasPet === "all" ? true : filterHasPet === "yes" ? user.has_pet : !user.has_pet;
    const userRole = getUserRole(user.user_id);
    const matchesRoleFilter = filterRole === "all" ? true : userRole === filterRole;
    return matchesSearch && matchesPetFilter && matchesRoleFilter;
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInterestLabel = (id: string) => {
    const labels: Record<string, string> = {
      food_recommend: "맞춤 사료",
      feeding_calc: "급여량 계산",
      walk_record: "산책 기록",
      health_care: "건강 관리",
    };
    return labels[id] || id;
  };

  const getReferralLabel = (id: string) => {
    const labels: Record<string, string> = {
      friend: "지인 추천",
      search: "검색",
      sns: "SNS",
      other: "기타",
    };
    return labels[id] || id;
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#191F28] mb-2">사용자 관리</h1>
        <p className="text-[#8B95A1]">총 {users.length}명의 사용자</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[16px] p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <FormField label="검색">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="닉네임 검색"
                className="admin-input w-full"
              />
            </FormField>
          </div>
          <div>
            <FormField label="반려동물">
              <select
                value={filterHasPet}
                onChange={(e) => setFilterHasPet(e.target.value as "all" | "yes" | "no")}
                className="admin-select"
              >
                <option value="all">전체</option>
                <option value="yes">있음</option>
                <option value="no">없음</option>
              </select>
            </FormField>
          </div>
          <div>
            <FormField label="역할">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as "all" | "master" | "operator" | "user")}
                className="admin-select"
              >
                <option value="all">전체</option>
                <option value="master">마스터</option>
                <option value="operator">운영자</option>
                <option value="user">일반</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F2F4F6]">
            <tr>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">닉네임</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">역할</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">반려동물</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">지역</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">연령대</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">가입일</th>
              <th className="px-4 py-3 text-center text-[14px] font-bold text-[#4E5968]">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const userRole = getUserRole(user.user_id);
              return (
              <tr key={user.id} className="border-t border-[#E5E8EB] hover:bg-[#F8F9FA]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#191F28]">{user.nickname}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-[12px] font-bold ${
                      userRole === "master"
                        ? "bg-red-50 text-red-600"
                        : userRole === "operator"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {userRole === "master" ? "마스터" : userRole === "operator" ? "운영자" : "일반"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-[12px] font-bold ${
                      user.has_pet
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.has_pet ? "있음" : "없음"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4E5968]">{user.region || "-"}</td>
                <td className="px-4 py-3 text-[#4E5968]">{user.age_group || "-"}</td>
                <td className="px-4 py-3 text-[#4E5968]">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <Button variant="secondary" onClick={() => setSelectedUser(user)}>
                    상세
                  </Button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[#8B95A1]">검색 결과가 없습니다.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#191F28]">사용자 상세 정보</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-10 h-10 flex items-center justify-center text-[#8B95A1] hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">닉네임</label>
                    <div className="font-bold text-[#191F28]">{selectedUser.nickname}</div>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">반려동물</label>
                    <div className="font-bold text-[#191F28]">
                      {selectedUser.has_pet ? "있음" : "없음"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">지역</label>
                    <div className="font-bold text-[#191F28]">{selectedUser.region || "-"}</div>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">연령대</label>
                    <div className="font-bold text-[#191F28]">{selectedUser.age_group || "-"}</div>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">가입 경로</label>
                    <div className="font-bold text-[#191F28]">
                      {selectedUser.referral_source
                        ? getReferralLabel(selectedUser.referral_source)
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#8B95A1]">가입일</label>
                    <div className="font-bold text-[#191F28]">{formatDate(selectedUser.created_at)}</div>
                  </div>
                </div>
              </div>

              {selectedUser.interests.length > 0 && (
                <div>
                  <label className="text-[14px] font-bold text-[#191F28] mb-2 block">관심사</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[13px] font-bold"
                      >
                        {getInterestLabel(interest)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button variant="secondary" onClick={() => setSelectedUser(null)} className="w-full">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
