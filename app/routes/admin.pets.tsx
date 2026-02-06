import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.pets";
import type { UserProfile } from "../utils/userProfiles";
import { deleteRow, fetchAll, fetchListByIn, fetchUsersAuthInfo, updateRow } from "../utils/adminData";
import { Button, FormField } from "../components/admin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 반려동물 관리" },
    { name: "description", content: "반려동물 프로필 관리" },
  ];
}

type PetProfile = {
  id: string;
  user_id: string;
  name: string;
  species: "DOG" | "CAT";
  breed_id: string | null;
  breed_name: string | null;
  weight_kg: number;
  is_neutered: boolean;
  activity_level: number;
  allergies: string[];
  created_at: string;
};

type OwnerInfo = {
  userId: string;
  nickname: string | null;
  email: string | null;
};

export default function AdminPets() {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [ownerMap, setOwnerMap] = useState<Record<string, OwnerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState<"all" | "DOG" | "CAT">("all");
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    setLoading(true);
    const result = await fetchAll<PetProfile>("pet_profiles", {
      orderBy: "created_at",
      ascending: false,
    });
    if (!result.ok) {
      setError(result.error);
      setOwnerMap({});
    } else {
      const nextPets = result.data || [];
      setPets(nextPets);

      const userIds = [...new Set(nextPets.map((pet) => pet.user_id).filter(Boolean))];
      if (userIds.length) {
        const [profilesResult, authResult] = await Promise.all([
          fetchListByIn<UserProfile>("user_profiles", "user_id", userIds),
          fetchUsersAuthInfo(userIds),
        ]);
        const profileMap = new Map(
          (profilesResult.ok ? profilesResult.data : []).map((profile) => [profile.user_id, profile]),
        );
        const authMap = new Map(
          (authResult.ok ? authResult.data : []).map((info) => [info.user_id, info]),
        );
        const nextOwnerMap: Record<string, OwnerInfo> = {};
        userIds.forEach((userId) => {
          const profile = profileMap.get(userId);
          const auth = authMap.get(userId);
          nextOwnerMap[userId] = {
            userId,
            nickname: profile?.nickname ?? null,
            email: auth?.email ?? null,
          };
        });
        setOwnerMap(nextOwnerMap);
      } else {
        setOwnerMap({});
      }
    }
    setLoading(false);
  }

  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === "all" ? true : pet.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const result = await deleteRow("pet_profiles", id);
    if (!result.ok) {
      alert("삭제에 실패했습니다: " + result.error);
    } else {
      await loadPets();
    }
  };

  const handleSave = async () => {
    if (!selectedPet) return;

    const result = await updateRow("pet_profiles", selectedPet.id, {
      name: selectedPet.name,
      species: selectedPet.species,
      breed_name: selectedPet.breed_name,
      weight_kg: selectedPet.weight_kg,
      is_neutered: selectedPet.is_neutered,
      activity_level: selectedPet.activity_level,
    });

    if (!result.ok) {
      alert("저장에 실패했습니다: " + result.error);
    } else {
      setIsEditing(false);
      setSelectedPet(null);
      await loadPets();
    }
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
        <h1 className="text-2xl font-bold text-[#191F28] mb-2">반려동물 관리</h1>
        <p className="text-[#8B95A1]">총 {pets.length}마리의 반려동물</p>
      </div>

      <div className="bg-white rounded-[16px] p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <FormField label="검색">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="반려동물 이름 검색"
                className="admin-input w-full"
              />
            </FormField>
          </div>
          <div>
            <FormField label="종류">
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value as "all" | "DOG" | "CAT")}
                className="admin-select"
              >
                <option value="all">전체</option>
                <option value="DOG">🐕 강아지</option>
                <option value="CAT">🐈 고양이</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F2F4F6]">
            <tr>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">이름</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">주인</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">종류</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">품종</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">체중</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">등록일</th>
              <th className="px-4 py-3 text-center text-[14px] font-bold text-[#4E5968]">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredPets.map((pet) => {
              const owner = ownerMap[pet.user_id];
              const ownerEmailOrId = owner?.email ?? pet.user_id.slice(0, 8);
              return (
                <tr key={pet.id} className="border-t border-[#E5E8EB] hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#191F28]">{pet.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#191F28]">{owner?.nickname ?? "-"}</div>
                    <div className="text-xs text-[#8B95A1]" title={pet.user_id}>
                      {ownerEmailOrId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[12px] font-bold ${
                        pet.species === "DOG"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {pet.species === "DOG" ? "🐕 강아지" : "🐈 고양이"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4E5968]">{pet.breed_name || "-"}</td>
                  <td className="px-4 py-3 text-[#4E5968]">{pet.weight_kg}kg</td>
                  <td className="px-4 py-3 text-[#4E5968]">{formatDate(pet.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedPet(pet);
                          setIsEditing(true);
                        }}
                      >
                        수정
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(pet.id)}>
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPets.length === 0 && (
          <div className="text-center py-12 text-[#8B95A1]">검색 결과가 없습니다.</div>
        )}
      </div>

      {selectedPet && isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#191F28]">반려동물 정보 수정</h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPet(null);
                }}
                className="w-10 h-10 flex items-center justify-center text-[#8B95A1] hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="이름">
                <input
                  type="text"
                  value={selectedPet.name}
                  onChange={(e) => setSelectedPet({ ...selectedPet, name: e.target.value })}
                  className="admin-input w-full"
                />
              </FormField>

              <FormField label="종류">
                <select
                  value={selectedPet.species}
                  onChange={(e) => setSelectedPet({ ...selectedPet, species: e.target.value as "DOG" | "CAT" })}
                  className="admin-select w-full"
                >
                  <option value="DOG">🐕 강아지</option>
                  <option value="CAT">🐈 고양이</option>
                </select>
              </FormField>

              <FormField label="품종">
                <input
                  type="text"
                  value={selectedPet.breed_name || ""}
                  onChange={(e) => setSelectedPet({ ...selectedPet, breed_name: e.target.value || null })}
                  className="admin-input w-full"
                />
              </FormField>

              <FormField label="체중 (kg)">
                <input
                  type="number"
                  step="0.1"
                  value={selectedPet.weight_kg}
                  onChange={(e) => setSelectedPet({ ...selectedPet, weight_kg: parseFloat(e.target.value) || 0 })}
                  className="admin-input w-full"
                />
              </FormField>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_neutered"
                  checked={selectedPet.is_neutered}
                  onChange={(e) => setSelectedPet({ ...selectedPet, is_neutered: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_neutered" className="text-[#4E5968]">중성화 완료</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPet(null);
                }}
                className="flex-1"
              >
                취소
              </Button>
              <Button variant="primary" onClick={handleSave} className="flex-1">
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
