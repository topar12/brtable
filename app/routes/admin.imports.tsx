import { useState } from "react";
import type { Route } from "./+types/admin.imports";
import {
  importFromCsv,
  importFromJson,
  exportToCsv,
  exportToJson,
  batchInsert,
  parseJson,
} from "../utils/adminData";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 데이터 입출력" },
    { name: "description", content: "데이터 입출력" },
  ];
}

type EntityType = "Product" | "ProductSKU" | "dog_breeds";

const entityLabels: Record<EntityType, string> = {
  Product: "사료 (Product)",
  ProductSKU: "SKU (ProductSKU)",
  dog_breeds: "품종 (dog_breeds)",
};

export default function AdminImports() {
  const [entity, setEntity] = useState<EntityType>("Product");
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [chunkSize, setChunkSize] = useState("50");

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    // Fetch data for export
    const { fetchAll } = await import("../utils/adminData");
    const result = await fetchAll<Record<string, unknown>>(entity);
    
    if (!result.ok) {
      setMessage(`낼 수 없기 실패: ${result.error}`);
      return;
    }

    if (!result.data.length) {
      setMessage("낼 수 없기할 데이터가 없습니다.");
      return;
    }

    if (format === "json") {
      downloadFile(
        `${entity}.json`,
        exportToJson(result.data),
        "application/json"
      );
    } else {
      downloadFile(`${entity}.csv`, exportToCsv(result.data), "text/csv");
    }
    
    setMessage(`${result.data.length}건 낼 수 없기 완료`);
  }

  async function handleImport() {
    setProgress(null);
    setMessage(null);

    const options = {
      chunkSize: parseInt(chunkSize) || 50,
      onProgress: (p: { completed: number; total: number }) => {
        setProgress(`${p.completed}/${p.total} 처리됨`);
      },
    };

    const result =
      format === "json"
        ? await importFromJson<Record<string, unknown>>(entity, payload, options)
        : await importFromCsv<Record<string, unknown>>(entity, payload, options);

    if (!result.ok) {
      setMessage(`가져오기 실패: ${result.error}`);
      return;
    }

    setMessage(`${result.data.length}건 가져오기 완료`);
    setPayload("");
  }

  async function handleBatchInsert() {
    if (format !== "json") {
      setMessage("배치 삽입은 JSON만 지원합니다.");
      return;
    }

    setProgress(null);
    setMessage(null);

    const parsed = parseJson<Record<string, unknown>>(payload);
    if (!parsed.ok) {
      setMessage(`JSON 파싱 실패: ${parsed.error}`);
      return;
    }

    const result = await batchInsert(entity, parsed.data, {
      chunkSize: parseInt(chunkSize) || 50,
      onProgress: (p: { completed: number; total: number }) => {
        setProgress(`${p.completed}/${p.total} 처리됨`);
      },
    });

    if (!result.ok) {
      setMessage(`배치 삽입 실패: ${result.error}`);
      return;
    }

    setMessage(`${result.data.length}건 배치 삽입 완료`);
    setPayload("");
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>데이터 입출력</h2>
          <p className="admin-page-desc">CSV/JSON 형식으로 데이터를 가져오거나 낼 수 있습니다.</p>
        </div>
      </div>


      <div className="admin-section">
        <div className="admin-card">
          <h3 style={{ margin: "0 0 8px 0" }}>데이터 내보내기</h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--admin-muted)" }}>
            선택한 테이블의 전체 데이터를 JSON/CSV로 다운로드합니다.
          </p>
          
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>대상</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as EntityType)}
              >
                {Object.entries(entityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>포맷</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "json" | "csv")}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="admin-button-row" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleExport}
            >
              📥 내보내기 다운로드
            </button>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-card">
          <h3 style={{ margin: "0 0 8px 0" }}>데이터 가져오기</h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--admin-muted)" }}>
            JSON/CSV를 붙여넣어 일괄 등록합니다. 배치 크기는 한 번에 삽입할 행 수입니다.
          </p>
          
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>대상</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as EntityType)}
              >
                {Object.entries(entityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>포맷</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "json" | "csv")}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="admin-field">
              <label>배치 크기</label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                min="1"
                max="1000"
              />
              <span className="admin-helper-text">예: 50 (큰 값일수록 빠르지만 실패 시 영향이 커짐)</span>
            </div>
          </div>

          <div className="admin-field" style={{ marginTop: "16px" }}>
            <label>데이터</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={10}
              placeholder={
                format === "json"
                  ? '[{ "id": "...", "brand": "..." }]'
                  : 'id,brand,name\\n1,하버,램앤라이스'
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid var(--admin-border)",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            />
          </div>

          <div className="admin-button-row" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleImport}
            >
              📤 가져오기 실행
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleBatchInsert}
            >
              🚀 배치 삽입 실행 (JSON)
            </button>
          </div>

          {(message || progress) && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "var(--admin-bg)",
                borderRadius: "8px",
              }}
            >
              {progress && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--admin-muted)",
                    marginBottom: "8px",
                  }}
                >
                  진행: {progress}
                </div>
              )}
              {message && (
                <div
                  style={{
                    fontSize: "14px",
                    color: message.includes("실패")
                      ? "#dc2626"
                      : "#16a34a",
                  }}
                >
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
