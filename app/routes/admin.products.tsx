import { useEffect, useState, useMemo } from "react";
import type { Route } from "./+types/admin.products";
import {
  createRow,
  deleteRow,
  fetchAll,
  updateRow,
  bulkDelete,
  bulkUpdate,
} from "../utils/adminData";
import { Button, FormField, FormSection, ImageUrlInput } from "../components/admin";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 사료 관리" },
    { name: "description", content: "사료 관리" },
  ];
}

type Product = {
  id: string;
  brand: string;
  name: string;
  species: string;
  crudeprotein: number;
  crudefat: number;
  crudefiber: number;
  crudeash: number;
  crudemoisture: number;
  caloriesper100g: number | null;
  caloriesestimatedper100g: number | null;
  caloriessource: string | null;
  mainprotein: string | null;
  targetconditions: string[];
  image: string | null;
};

type ProductForm = {
  id: string;
  brand: string;
  name: string;
  species: string;
  crudeProtein: string;
  crudeFat: string;
  crudeFiber: string;
  crudeAsh: string;
  crudeMoisture: string;
  caloriesPer100g: string;
  caloriesEstimatedPer100g: string;
  caloriesSource: string;
  mainProtein: string;
  targetConditions: string;
  image: string;
};

const defaultForm: ProductForm = {
  id: "",
  brand: "",
  name: "",
  species: "DOG",
  crudeProtein: "",
  crudeFat: "",
  crudeFiber: "",
  crudeAsh: "",
  crudeMoisture: "",
  caloriesPer100g: "",
  caloriesEstimatedPer100g: "",
  caloriesSource: "OFFICIAL",
  mainProtein: "",
  targetConditions: "",
  image: "",
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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selection, setSelection] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState("caloriessource");
  const [bulkValue, setBulkValue] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    const result = await fetchAll<Product>("Product", { orderBy: "name" });
    if (!result.ok) {
      setError(result.error);
      setProducts([]);
    } else {
      setProducts(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setForm(defaultForm);
    setMode("create");
  }

  function handleEdit(product: Product) {
    setForm({
      id: product.id,
      brand: product.brand ?? "",
      name: product.name ?? "",
      species: product.species ?? "DOG",
      crudeProtein: String(product.crudeprotein ?? ""),
      crudeFat: String(product.crudefat ?? ""),
      crudeFiber: String(product.crudefiber ?? ""),
      crudeAsh: String(product.crudeash ?? ""),
      crudeMoisture: String(product.crudemoisture ?? ""),
      caloriesPer100g: String(product.caloriesper100g ?? ""),
      caloriesEstimatedPer100g: String(product.caloriesestimatedper100g ?? ""),
      caloriesSource: product.caloriessource ?? "OFFICIAL",
      mainProtein: product.mainprotein ?? "",
      targetConditions: formatStringList(product.targetconditions),
      image: product.image ?? "",
    });
    setMode("edit");
    setShowForm(true);
  }

  // Auto-calculate estimated calories
  useEffect(() => {
    // Only calculate if all nutrient fields have values
    if (
      form.crudeProtein &&
      form.crudeFat &&
      form.crudeFiber &&
      form.crudeAsh &&
      form.crudeMoisture
    ) {
      const protein = parseFloat(form.crudeProtein) || 0;
      const fat = parseFloat(form.crudeFat) || 0;
      const fiber = parseFloat(form.crudeFiber) || 0;
      const ash = parseFloat(form.crudeAsh) || 0;
      const moisture = parseFloat(form.crudeMoisture) || 0;

      // Ensure values sum to <= 100 roughly, just calc NFE
      // NFE = 100 - (Protein + Fat + Fiber + Ash + Moisture)
      const nfe = Math.max(0, 100 - (protein + fat + fiber + ash + moisture));

      // Modified Atwater: (3.5 * Protein) + (8.5 * Fat) + (3.5 * NFE)
      const calories = (3.5 * protein) + (8.5 * fat) + (3.5 * nfe);

      setForm((prev) => ({
        ...prev,
        caloriesEstimatedPer100g: Math.round(calories).toString(),
        // If official source is not set, default to ESTIMATED
        caloriesSource: prev.caloriesSource || "ESTIMATED"
      }));
    }
  }, [
    form.crudeProtein,
    form.crudeFat,
    form.crudeFiber,
    form.crudeAsh,
    form.crudeMoisture,
  ]);

  // Auto-switch calorie source based on input
  useEffect(() => {
    if (form.caloriesPer100g && form.caloriesPer100g.trim() !== "") {
      setForm((prev) => ({ ...prev, caloriesSource: "OFFICIAL" }));
    } else {
      setForm((prev) => ({ ...prev, caloriesSource: "ESTIMATED" }));
    }
  }, [form.caloriesPer100g]);

  // Safe UUID generator
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      const payload = {
        id: form.id || uuidv4(),
        brand: form.brand.trim(),
        name: form.name.trim(),
        species: form.species,
        // DB requires these to be NOT NULL, so default to 0 if empty
        crudeprotein: parseNumber(form.crudeProtein) ?? 0,
        crudefat: parseNumber(form.crudeFat) ?? 0,
        crudefiber: parseNumber(form.crudeFiber) ?? 0,
        crudeash: parseNumber(form.crudeAsh) ?? 0,
        crudemoisture: parseNumber(form.crudeMoisture) ?? 0,
        caloriesper100g: parseNumber(form.caloriesPer100g),
        caloriesestimatedper100g: parseNumber(form.caloriesEstimatedPer100g),
        caloriessource: form.caloriesSource.trim() || null,
        mainprotein: form.mainProtein.trim() || null,
        targetconditions: parseStringList(form.targetConditions),
        image: form.image.trim() || null,
      };

      const result =
        mode === "create"
          ? await createRow<Product>("Product", payload)
          : await updateRow<Product>("Product", form.id, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      resetForm();
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const result = await deleteRow("Product", id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadProducts();
  }

  async function handleBulkDelete() {
    if (!selection.length) return;
    if (!confirm(`선택한 ${selection.length}개 항목을 삭제하시겠습니까?`)) return;
    const result = await bulkDelete("Product", selection);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelection([]);
    await loadProducts();
  }

  function toggleSelection(id: string) {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Sort & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [sortField, setSortField] = useState<keyof Product | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Extract unique brands
  const brands = useMemo(() => {
    const unique = new Set(products.map(p => p.brand).filter(Boolean));
    return ["ALL", ...Array.from(unique).sort()];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Filter by Brand
    if (selectedBrand !== "ALL") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.brand.toLowerCase().includes(lower)
      );
    }

    // Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return sortOrder === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [products, searchTerm, selectedBrand, sortField, sortOrder]);

  function handleSort(field: keyof Product) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to desc for numbers usually (like protein/fat)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>사료 관리</h2>
          <p className="admin-page-desc">사료 정보를 등록하고 수정합니다.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + 새 사료 등록
        </Button>
      </div>


      {error && (
        <div className="admin-alert error" style={{ marginBottom: "20px" }}>
          <span className="admin-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {mode === "create" ? "새 사료 등록" : "사료 수정"}
                </h3>
                <p className="text-sm text-slate-500">사료의 기본 정보와 영양 성분을 입력하세요.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID field hidden for cleaner UI */}

                <FormField label="종류" required>
                  <div className="flex gap-3">
                    {[
                      { value: "DOG", label: "🐕 강아지" },
                      { value: "CAT", label: "🐈 고양이" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, species: option.value })}
                        className={`flex-1 py-3 rounded-xl text-[15px] font-bold transition-all ${
                          form.species === option.value
                            ? "bg-[#3182F6] text-white"
                            : "bg-[#F2F4F6] text-[#4E5968]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="브랜드" required>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="예: 하버"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="제품명" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 램앤라이스 밸런스"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="조단백 (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.crudeProtein}
                    onChange={(e) => setForm({ ...form, crudeProtein: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="조지방 (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.crudeFat}
                    onChange={(e) => setForm({ ...form, crudeFat: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="조섬유 (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.crudeFiber}
                    onChange={(e) => setForm({ ...form, crudeFiber: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="조회분 (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.crudeAsh}
                    onChange={(e) => setForm({ ...form, crudeAsh: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="수분 (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.crudeMoisture}
                    onChange={(e) => setForm({ ...form, crudeMoisture: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField
                  label="칼로리 (100g)"
                  description={
                    form.caloriesEstimatedPer100g
                      ? `비워두면 추정치(${form.caloriesEstimatedPer100g} kcal/100g)가 자동으로 적용됩니다.`
                      : "비워두면 성분 값으로 자동 계산됩니다."
                  }
                >
                  <input
                    type="number"
                    value={form.caloriesPer100g}
                    onChange={(e) => setForm({ ...form, caloriesPer100g: e.target.value })}
                    className="admin-input"
                    placeholder="0"
                  />
                </FormField>

                {/* Hidden Fields: Estimated Calories & Source (Automated) */}

                <FormField label="주단백">
                  <input
                    type="text"
                    value={form.mainProtein}
                    onChange={(e) => setForm({ ...form, mainProtein: e.target.value })}
                    placeholder="예: 양고기"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="타깃 태그" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.targetConditions}
                    onChange={(e) => setForm({ ...form, targetConditions: e.target.value })}
                    placeholder="예: 피부, 관절, 소화 (쉼표로 구분)"
                    className="admin-input"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["피부", "관절", "다이어트", "소화", "신장", "요로", "알러지", "노령", "퍼피", "성견"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = form.targetConditions ? form.targetConditions.split(",").map(s => s.trim()) : [];
                          if (!current.includes(tag)) {
                            setForm({ ...form, targetConditions: [...current, tag].join(", ") });
                          }
                        }}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <ImageUrlInput
                    label="대표 이미지 URL"
                    value={form.image}
                    onChange={(value) => setForm({ ...form, image: value })}
                    placeholder="https://example.com/image.jpg"
                  />
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

      <FormSection title="사료 목록" description="등록된 사료를 관리합니다">

        {/* Brand Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border ${selectedBrand === brand
                ? "bg-slate-800 text-white border-slate-800 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              {brand === "ALL" ? "전체 보기" : brand}
            </button>
          ))}
        </div>

        {/* Toolbar: Search & Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end md:items-center">
          <div className="flex-1 relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="사료명 또는 브랜드 검색"
              className="admin-input pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  if (sortField === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name");
                    setSortOrder("asc");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortField === "name"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                가나다순 {sortField === "name" && (sortOrder === "asc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => {
                  if (sortField === "brand") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("brand");
                    setSortOrder("asc");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortField === "brand"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                브랜드순 {sortField === "brand" && (sortOrder === "asc" ? "↓" : "↑")}
              </button>
              {/* Clear Sort */}
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
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            등록된 사료가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product.id}
                className={`group flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${selection.includes(product.id)
                  ? "bg-blue-50/50 border-blue-200 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
              >
                {/* Checkbox & Image */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <input
                    type="checkbox"
                    checked={selection.includes(product.id)}
                    onChange={() => toggleSelection(product.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        No Img
                      </div>
                    )}
                  </div>

                  {/* Mobile-only Title (Click to Edit) */}
                  <div className="md:hidden flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(product)}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-slate-500 font-medium">{product.brand}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${product.species === "CAT" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                        {product.species === "CAT" ? "🐈" : "🐕"}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 truncate hover:text-blue-600 transition-colors">{product.name}</div>
                  </div>
                </div>

                {/* Main Content (Desktop) */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full">
                  {/* Title Section (Click to Edit) */}
                  <div className="md:col-span-5 hidden md:block cursor-pointer group-hover/title:text-blue-600" onClick={() => handleEdit(product)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 font-medium">{product.brand}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${product.species === "CAT" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                        {product.species === "CAT" ? "🐈 고양이" : "🐕 강아지"}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 truncate hover:text-blue-600 transition-colors">{product.name}</div>
                  </div>

                  {/* Nutrient Stats */}
                  <div className="md:col-span-4 flex flex-wrap gap-2 md:gap-4 items-center">
                    <div className="flex flex-col items-start px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 min-w-[70px]">
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Protein</span>
                      <span className="text-sm font-semibold text-slate-700">{product.crudeprotein}%</span>
                    </div>
                    <div className="flex flex-col items-start px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 min-w-[70px]">
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Fat</span>
                      <span className="text-sm font-semibold text-slate-700">{product.crudefat}%</span>
                    </div>
                    <div className="flex flex-col items-start px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 min-w-[80px]">
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Calories</span>
                      <span className="text-sm font-semibold text-slate-700">{product.caloriesper100g || product.caloriesestimatedper100g || "-"}</span>
                    </div>
                  </div>

                  {/* Actions (Only Delete now) */}
                  <div className="md:col-span-3 flex justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(product.id)}
                      className="px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}
