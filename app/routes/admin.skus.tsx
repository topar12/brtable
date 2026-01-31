import { useEffect, useState, useMemo } from "react";
import type { Route } from "./+types/admin.skus";
import {
  createRow,
  deleteRow,
  fetchAll,
  updateRow,
} from "../utils/adminData";
import { Button, FormField, FormSection, ImageUrlInput } from "../components/admin";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려식탁 | SKU 관리" },
    { name: "description", content: "SKU 관리" },
  ];
}

type Sku = {
  id: string;
  productid: string;
  weight: number;
  price: number;
  image: string | null;
  purchaselink: string | null;
  clickcount: number | null;
};

type Product = {
  id: string;
  brand: string;
  name: string;
  image: string | null; // Added image support
};

type SkuForm = {
  id: string;
  productId: string;
  weight: string;
  price: string;
  image: string;
  purchaseLink: string;
  clickCount: string;
};

const defaultForm: SkuForm = {
  id: "",
  productId: "",
  weight: "",
  price: "",
  image: "",
  purchaseLink: "",
  clickCount: "0",
};

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function AdminSkus() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SkuForm>(defaultForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Group SKUs by Product ID
  const groupedSkus = useMemo(() => {
    const groups: Record<string, Sku[]> = {};
    skus.forEach((sku) => {
      const pid = sku.productid || "unknown";
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(sku);
    });
    // Sort SKUs by weight within groups
    Object.keys(groups).forEach((pid) => {
      groups[pid].sort((a, b) => (a.weight || 0) - (b.weight || 0));
    });
    return groups;
  }, [skus]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [skusResult, productsResult] = await Promise.all([
      fetchAll<Sku>("ProductSKU", { orderBy: "productid" }),
      fetchAll<Product>("Product", { orderBy: "name" }),
    ]);

    if (!skusResult.ok) {
      setError(skusResult.error);
      setSkus([]);
    } else {
      setSkus(skusResult.data);
    }

    if (productsResult.ok) {
      setProducts(productsResult.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(defaultForm);
    setMode("create");
  }

  function handleAddSku(productId?: string) {
    resetForm();
    if (productId) {
      setForm((prev) => ({ ...prev, productId }));
    }
    setMode("create");
    setShowForm(true);
  }

  function handleEdit(sku: Sku) {
    setForm({
      id: sku.id,
      productId: sku.productid ?? "",
      weight: String(sku.weight ?? ""),
      price: String(sku.price ?? ""),
      image: sku.image ?? "",
      purchaseLink: sku.purchaselink ?? "",
      clickCount: String(sku.clickcount ?? "0"),
    });
    setMode("edit");
    setShowForm(true);
  }

  async function handleSubmit() {
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      productid: form.productId.trim(),
      weight: parseNumber(form.weight),
      price: parseNumber(form.price),
      image: form.image.trim() || null,
      purchaselink: form.purchaseLink.trim() || null,
      clickcount: parseNumber(form.clickCount) ?? 0,
    };

    const result =
      mode === "create"
        ? await createRow<Sku>("ProductSKU", payload)
        : await updateRow<Sku>("ProductSKU", form.id, payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const result = await deleteRow("ProductSKU", id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadData();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>SKU 관리</h2>
          <p className="admin-page-desc">상품별 옵션(무게, 가격)을 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="상품명 또는 브랜드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-64"
          />
          <Button
            variant="primary"
            onClick={() => handleAddSku()}
          >
            + 새 SKU 등록
          </Button>
        </div>
      </div>


      {error && (
        <div className="admin-alert error" style={{ marginBottom: "20px" }}>
          <span className="admin-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <FormSection
              title={mode === "create" ? "새 SKU 등록" : "SKU 수정"}
              description="사료 SKU 정보를 입력하세요."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection */}
                <FormField label="사료" required>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="admin-select"
                    disabled={mode === "create" && !!form.productId && filteredProducts.some(p => p.id === form.productId)} // If pre-selected from card
                  >
                    <option value="">선택하세요</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.brand} {product.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="무게 (kg)" required>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="예: 2"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="가격 (원)" required>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="예: 28000"
                    className="admin-input"
                  />
                </FormField>

                <FormField label="클릭 수">
                  <input
                    type="number"
                    value={form.clickCount}
                    onChange={(e) => setForm({ ...form, clickCount: e.target.value })}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="구매 링크" className="md:col-span-2">
                  <input
                    type="url"
                    value={form.purchaseLink}
                    onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
                    placeholder="https://..."
                    className="admin-input"
                  />
                </FormField>

                <div className="md:col-span-2">
                  <ImageUrlInput
                    label="이미지 URL (옵션)"
                    value={form.image}
                    onChange={(value) => setForm({ ...form, image: value })}
                    placeholder="입력하지 않으면 상품 대표 이미지를 사용합니다"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 justify-end">
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  취소
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  {mode === "create" ? "등록" : "저장"}
                </Button>
              </div>
            </FormSection>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-slate-500">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map((product) => {
            const productSkus = groupedSkus[product.id] || [];
            if (productSkus.length === 0 && searchTerm) return null; // Hide empty if searching? Optional. Let's show all for now unless heavily filtered.

            return (
              <div key={product.id} className="admin-form-section overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {/* Product Thumbnail if available (assuming product.image exists in DB schema, though type had it as null until now) */}
                    {product.image ? (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                        <span className="text-xs">No Img</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-500">{product.brand}</div>
                      <div className="text-lg font-bold text-slate-900">{product.name}</div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleAddSku(product.id)}>
                    + SKU 추가
                  </Button>
                </div>

                {productSkus.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>무게</th>
                          <th>가격</th>
                          <th>100g당 가격</th>
                          <th>클릭</th>
                          <th>구매 링크</th>
                          <th className="w-20">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSkus.map((sku) => {
                          const pricePer100g = sku.price && sku.weight ? Math.round(sku.price / (sku.weight * 10)) : 0;
                          return (
                            <tr key={sku.id}>
                              <td className="font-medium">{sku.weight}kg</td>
                              <td>{sku.price?.toLocaleString()}원</td>
                              <td className="text-slate-400 text-xs">
                                {pricePer100g > 0 ? `${pricePer100g.toLocaleString()}원` : '-'}
                              </td>
                              <td>{sku.clickcount ?? 0}</td>
                              <td>
                                {sku.purchaselink ? (
                                  <a href={sku.purchaselink} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline text-xs">
                                    링크
                                  </a>
                                ) : (
                                  <span className="text-slate-300 text-xs">-</span>
                                )}
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEdit(sku)}
                                    className="h-9 px-4 text-sm font-medium hover:bg-blue-50 text-slate-600"
                                  >
                                    수정
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(sku.id)}
                                    className="h-9 px-4 text-sm font-medium"
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                    등록된 SKU가 없습니다. 추가해주세요.
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
