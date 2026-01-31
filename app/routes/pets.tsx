import { useEffect, useState } from "react";
import type { Route } from "./+types/pets";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/admin";
import { fetchPetProfiles, createPetProfile, updatePetProfile, deletePetProfile, toPetProfile, type DbPetProfile } from "../utils/petProfiles";
import { getSupabaseClient } from "../utils/supabase";
import { saveStoredProfile } from "../utils/profile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 내 반려동물" },
    { name: "description", content: "반려동물 프로필 관리" },
  ];
}

type PetForm = {
  id?: string;
  name: string;
  species: "DOG" | "CAT";
  breed_id: string;
  breed_name: string;
  weight_kg: string;
  is_neutered: boolean;
  activity_level: 1 | 2 | 3 | 4 | 5;
  allergies: string;
};

const defaultForm: PetForm = {
  name: "",
  species: "DOG",
  breed_id: "",
  breed_name: "",
  weight_kg: "",
  is_neutered: false,
  activity_level: 3,
  allergies: "",
};

export default function PetsPage() {
  const { user, isAuthenticated } = useAuth();
  
  
  const [profiles, setProfiles] = useState<DbPetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PetForm>(defaultForm);
  const [mode, setMode] = useState<"create" | "edit">("create");

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

  function handleEdit(profile: DbPetProfile) {
    setForm({
      id: profile.id,
      name: profile.name,
      species: profile.species,
      breed_id: profile.breed_id || "",
      breed_name: profile.breed_name || "",
      weight_kg: String(profile.weight_kg),
      is_neutered: profile.is_neutered,
      activity_level: profile.activity_level,
      allergies: (profile.allergies || []).join(", "),
    });
    setMode("edit");
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!user?.id) return;

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      species: form.species,
      breed_id: form.breed_id || null,
      breed_name: form.breed_name || null,
      weight_kg: parseFloat(form.weight_kg) || 0,
      is_neutered: form.is_neutered,
      activity_level: form.activity_level,
      allergies: form.allergies.split(",").map(s => s.trim()).filter(Boolean),
      birth_date: null,
      image_url: null,
      is_active: true,
    };

    try {
      if (mode === "edit" && form.id) {
        await updatePetProfile(form.id, payload);
      } else {
        await createPetProfile(payload);
      }
      
      setShowForm(false);
      setForm(defaultForm);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  }

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
      <div className="container">
        <section className="hero">
          <h2>로그인이 필요합니다</h2>
          <p>반려동물 프로필을 관리하려면 로그인해주세요.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="hero">
        <div className="flex items-center justify-between">
          <div>
            <h2>내 반려동물</h2>
            <p>반려동물 프로필을 등록하고 계산기에서 사용하세요.</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setForm(defaultForm);
              setMode("create");
              setShowForm(true);
            }}
          >
            + 새 반려동물 등록
          </Button>
        </div>
      </section>



      {error && (
        <section className="card">
          <div className="text-red-600">⚠️ {error}</div>
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">
                {mode === "create" ? "새 반려동물 등록" : "반려동물 수정"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-input w-full"
                  placeholder="예: 보리"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">종류 *</label>
                  <select
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value as "DOG" | "CAT" })}
                    className="admin-select w-full"
                  >
                    <option value="DOG">🐕 강아지</option>
                    <option value="CAT">🐈 고양이</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">체중 (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight_kg}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                    className="admin-input w-full"
                    placeholder="예: 3.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">품종</label>
                  <input
                    type="text"
                    value={form.breed_name}
                    onChange={(e) => setForm({ ...form, breed_name: e.target.value })}
                    className="admin-input w-full"
                    placeholder="예: 포메라니안"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">활동량 (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.activity_level}
                    onChange={(e) => setForm({ ...form, activity_level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className="admin-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_neutered}
                    onChange={(e) => setForm({ ...form, is_neutered: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300"
                  />
                  <span className="text-sm">중성화 완료</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">알러지 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  className="admin-input w-full"
                  placeholder="예: 닭, 소, 밀"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {mode === "create" ? "등록" : "저장"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <section className="card">
          <div className="text-center py-8">불러오는 중...</div>
        </section>
      ) : profiles.length === 0 ? (
        <section className="card">
          <div className="text-center py-8 text-slate-500">
            등록된 반려동물이 없습니다.
          </div>
        </section>
      ) : (
        <section className="card-grid two">
          {profiles.map((profile) => (
            <article key={profile.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{profile.species === "DOG" ? "🐕" : "🐈"}</span>
                    <h3 className="font-bold text-lg">{profile.name}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    {profile.breed_name || "품종 미지정"} · {profile.weight_kg}kg
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(profile)}
                    className="p-2 text-slate-400 hover:text-blue-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">중성화</span>
                  <span>{profile.is_neutered ? "완료" : "미완료"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">활동량</span>
                  <span>{profile.activity_level}단계</span>
                </div>
                {profile.allergies?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">알러지</span>
                    <span>{profile.allergies.join(", ")}</span>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => handleUseProfile(profile)}
              >
                계산기에 적용
              </Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
