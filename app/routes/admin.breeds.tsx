import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.breeds";
import {
  createRow,
  deleteRow,
  fetchAll,
  updateRow,
  bulkDelete,
} from "../utils/adminData";
import { Button, FormField, FormSection } from "../components/admin";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 품종 관리" },
    { name: "description", content: "품종 관리" },
  ];
}

type PetType = "dog" | "cat";

type Breed = {
  id: number;
  slug: string;
  name_ko: string;
  name_en: string | null;
  aliases: string[] | null;
  popularity_rank: number | null;
  is_mixed: boolean | null;
  is_unknown: boolean | null;
};

type BreedForm = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  aliases: string;
  popularity_rank: string;
  is_mixed: boolean;
  is_unknown: boolean;
};

const defaultForm: BreedForm = {
  id: "",
  slug: "",
  name_ko: "",
  name_en: "",
  aliases: "",
  popularity_rank: "",
  is_mixed: false,
  is_unknown: false,
};

const tableNames: Record<PetType, string> = {
  dog: "dog_breeds",
  cat: "cat_breeds",
};

const petTypeLabels: Record<PetType, string> = {
  dog: "강아지",
  cat: "고양이",
};

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseStringList(value: string): string[] {
  if (!value.trim()) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function formatStringList(value: string[] | null): string {
  if (!value?.length) return "";
  return value.join(", ");
}

export default function AdminBreeds() {
  const [petType, setPetType] = useState<PetType>("dog");
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<BreedForm>(defaultForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [showForm, setShowForm] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selection, setSelection] = useState<number[]>([]);
  const [sortField, setSortField] = useState<"name_ko" | "popularity_rank" | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const currentTable = tableNames[petType];

  async function loadBreeds() {
    setLoading(true);
    setError(null);
    setSelection([]); // 품종 변경 시 선택 초기화
    const result = await fetchAll<Breed>(currentTable, { orderBy: "name_ko" });
    if (!result.ok) {
      setError(result.error);
      setBreeds([]);
    } else {
      setBreeds(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBreeds();
  }, [petType]);


  const filteredAndSortedBreeds = breeds
    .filter((breed) => {
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        breed.name_ko.toLowerCase().includes(lower) ||
        (breed.name_en?.toLowerCase() || "").includes(lower) ||
        breed.slug.toLowerCase().includes(lower)
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;

      if (sortField === "popularity_rank") {
        const aRank = a.popularity_rank ?? Number.MAX_SAFE_INTEGER;
        const bRank = b.popularity_rank ?? Number.MAX_SAFE_INTEGER;
        return sortOrder === "asc" ? aRank - bRank : bRank - aRank;
      }

      if (sortField === "name_ko") {
        const aName = a.name_ko ?? "";
        const bName = b.name_ko ?? "";
        return sortOrder === "asc"
          ? aName.localeCompare(bName, "ko")
          : bName.localeCompare(aName, "ko");
      }

      return 0;
    });

  function resetForm() {
    setForm(defaultForm);
    setMode("create");
  }

  function handleEdit(breed: Breed) {
    setForm({
      id: String(breed.id),
      slug: breed.slug ?? "",
      name_ko: breed.name_ko ?? "",
      name_en: breed.name_en ?? "",
      aliases: formatStringList(breed.aliases),
      popularity_rank: String(breed.popularity_rank ?? ""),
      is_mixed: Boolean(breed.is_mixed),
      is_unknown: Boolean(breed.is_unknown),
    });
    setMode("edit");
    setShowForm(true);
  }

  async function handleSubmit() {
    try {
      const payload: Record<string, unknown> = {
        slug: form.slug.trim(),
        name_ko: form.name_ko.trim(),
        name_en: form.name_en.trim() || null,
        aliases: parseStringList(form.aliases),
        popularity_rank: parseNumber(form.popularity_rank),
        is_mixed: form.is_mixed,
        is_unknown: form.is_unknown,
      };

      if (mode === "edit" && form.id) {
        payload.id = parseNumber(form.id);
      }

      const result =
        mode === "create"
          ? await createRow<Breed>(currentTable, payload)
          : await updateRow<Breed>(currentTable, parseNumber(form.id) || 0, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      resetForm();
      setShowForm(false);
      await loadBreeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const result = await deleteRow(currentTable, id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadBreeds();
  }

  async function handleBulkDelete() {
    if (!selection.length) return;
    if (!confirm(`선택한 ${selection.length}개 항목을 삭제하시겠습니까?`)) return;
    const result = await bulkDelete(currentTable, selection);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelection([]);
    await loadBreeds();
  }

  function toggleSelection(id: number) {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>품종 관리</h2>
          <p className="admin-page-desc">등록된 {petTypeLabels[petType]} 품종을 관리합니다.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + 새 품종 등록
        </Button>
      </div>

      {/* Pet Type Tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(petTypeLabels) as PetType[]).map((type) => (
          <button
            key={type}
            onClick={() => setPetType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              petType === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {type === "dog" ? "🐕" : "🐈"} {petTypeLabels[type]}
          </button>
        ))}
      </div>


      {error && (
        <div className="admin-alert error" style={{ marginBottom: "20px" }}>
          <span className="admin-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {mode === "create" ? `새 ${petTypeLabels[petType]} 품종 등록` : `${petTypeLabels[petType]} 품종 수정`}
                </h3>
                <p className="text-sm text-slate-500">품종 정보를 입력하세요.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-4">
                <FormField label="슬러그" required>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="예: golden-retriever"
                    className="admin-input"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="국문명" required>
                    <input
                      type="text"
                      value={form.name_ko}
                      onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                      placeholder="예: 골든 리트리버"
                      className="admin-input"
                    />
                  </FormField>

                  <FormField label="영문명">
                    <input
                      type="text"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      placeholder="예: Golden Retriever"
                      className="admin-input"
                    />
                  </FormField>
                </div>

                <FormField label="별칭" description="쉼표로 구분">
                  <input
                    type="text"
                    value={form.aliases}
                    onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                    placeholder="예: 골든, 리트리버"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="인기 순위">
                  <input
                    type="number"
                    value={form.popularity_rank}
                    onChange={(e) => setForm({ ...form, popularity_rank: e.target.value })}
                    placeholder="예: 1"
                    className="admin-input"
                  />
                </FormField>

                <div className="flex gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_mixed}
                      onChange={(e) =>
                        setForm({ ...form, is_mixed: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">혼종(믹스) 여부</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_unknown}
                      onChange={(e) =>
                        setForm({ ...form, is_unknown: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">미확인(기타) 여부</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 justify-end z-10">
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

      {/* List Section */}
      <FormSection title={`${petTypeLabels[petType]} 품종 목록`} description={`등록된 ${petTypeLabels[petType]} 품종을 관리합니다`}>


        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end md:items-center">
          <div className="flex-1 relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="품종명(국문/영문) 또는 슬러그 검색"
              className="admin-input pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  if (sortField === "name_ko") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name_ko");
                    setSortOrder("asc");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortField === "name_ko"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                가나다순 {sortField === "name_ko" && (sortOrder === "asc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => {
                  if (sortField === "popularity_rank") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("popularity_rank");
                    setSortOrder("asc");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortField === "popularity_rank"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                순위순 {sortField === "popularity_rank" && (sortOrder === "asc" ? "↓" : "↑")}
              </button>
              {sortField && (
                <button
                  onClick={() => {
                    setSortField("");
                    setSortOrder("asc");
                  }}
                  className="px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selection.length > 0 && (
          <div className="sticky top-4 z-40 flex items-center justify-between gap-3 mb-6 p-4 bg-white shadow-lg shadow-blue-900/5 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
            <span className="text-sm font-medium text-slate-700 px-2">{selection.length}개 선택됨</span>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              선택 삭제
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-slate-500">불러오는 중...</p>
          </div>
        ) : filteredAndSortedBreeds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span className="text-2xl block mb-2">{petType === "dog" ? "🐕" : "🐈"}</span>
            {searchTerm ? "검색된 품종이 없습니다." : `등록된 ${petTypeLabels[petType]} 품종이 없습니다.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedBreeds.map((breed) => (
              <div
                key={breed.id}
                onClick={(e) => {
                  // Prevent edit when clicking checkbox or delete button
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('button')) return;
                  handleEdit(breed);
                }}
                className={`group relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 cursor-pointer ${selection.includes(breed.id)
                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                  }`}
              >
                {/* Selection Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selection.includes(breed.id)}
                    onChange={() => toggleSelection(breed.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Breed Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 truncate">
                      {breed.name_ko}
                    </span>
                    {breed.popularity_rank && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                        TOP {breed.popularity_rank}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-1">
                    {breed.name_en || breed.slug}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {breed.is_mixed && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">혼종</span>
                    )}
                    {breed.is_unknown && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">미확인</span>
                    )}
                    {breed.aliases && breed.aliases.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-400 rounded">+{breed.aliases.length} 별칭</span>
                    )}
                  </div>
                </div>

                {/* Hover Action Group */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(breed.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <span className="text-lg">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}
