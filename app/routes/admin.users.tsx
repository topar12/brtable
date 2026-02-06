import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin.users";
import { fetchAll, fetchUsersAuthInfo } from "../utils/adminData";
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
  const [authInfoMap, setAuthInfoMap] = useState<Record<string, string | null>>({});

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

    if (profilesResult.ok) {
      const userIds = (profilesResult.data ?? []).map((user) => user.user_id);
      const authResult = await fetchUsersAuthInfo(userIds);
      if (authResult.ok) {
        const map: Record<string, string | null> = {};
        authResult.data.forEach((item) => {
          map[item.user_id] = item.last_sign_in_at;
        });
        setAuthInfoMap(map);
      }
    }

    setLoading(false);
  }

  const getUserRole = (userId: string) => {
    const role = roles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("ko-KR");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPetFilter =
      filterHasPet === "all" ? true : filterHasPet === "yes" ? user.has_pet : !user.has_pet;
    const userRole = getUserRole(user.user_id);
    const matchesRoleFilter = filterRole === "all" ? true : userRole === filterRole;
    return matchesSearch && matchesPetFilter && matchesRoleFilter;
  });



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
               <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">상태</th>
               <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">마지막 로그인</th>
               <th className="px-4 py-3 text-center text-[14px] font-bold text-[#4E5968]">관리</th>
             </tr>
           </thead>
           <tbody>
             {filteredUsers.map((user) => {
               const userRole = getUserRole(user.user_id);
               const statusLabel = user.deleted_at ? "탈퇴" : user.is_banned ? "밴" : "정상";
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
                 <td className="px-4 py-3 text-[#4E5968]">{statusLabel}</td>
                 <td className="px-4 py-3 text-[#4E5968]">
                   {formatDateTime(authInfoMap[user.user_id])}
                 </td>
                 <td className="px-4 py-3 text-center">
                  <Link to={`/admin/users/${user.user_id}`}>
                    <Button variant="secondary">상세</Button>
                  </Link>
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
    </div>
  );
}
