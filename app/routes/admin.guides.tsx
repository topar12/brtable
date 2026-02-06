import type { Route } from "./+types/admin.guides";
import type { Guide } from "../data/guides";

import { guideItems } from "../data/guides";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 가이드 관리" },
    { name: "description", content: "케어 가이드 관리" },
  ];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function renderPetBadge(guide: Guide) {
  return guide.petType === "dog" ? "🐕 강아지" : "🐈 고양이";
}

export default function AdminGuides() {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>가이드 관리</h2>
          <p className="admin-page-desc">강아지/고양이 케어 가이드를 확인합니다.</p>
        </div>
        <div className="text-sm text-slate-500">총 {guideItems.length}개</div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>제목</th>
              <th>카테고리</th>
              <th>난이도</th>
              <th>소요</th>
              <th>업데이트</th>
            </tr>
          </thead>
          <tbody>
            {guideItems.map((guide) => (
              <tr key={guide.id}>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-[12px] font-bold ${
                      guide.petType === "dog"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {renderPetBadge(guide)}
                  </span>
                </td>
                <td>
                  <div className="font-medium text-slate-900">{guide.title}</div>
                  <div className="text-xs text-slate-400 line-clamp-1">{guide.summary}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {guide.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[11px] rounded-full bg-slate-50 text-slate-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-slate-600">{guide.category}</td>
                <td>
                  <span className="px-2 py-1 rounded-full text-[12px] font-bold bg-slate-100 text-slate-600">
                    {guide.level}
                  </span>
                </td>
                <td className="text-slate-600">{guide.readTime}</td>
                <td className="text-slate-500 text-sm">{formatDate(guide.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {guideItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">등록된 가이드가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
