import { useMemo, useState } from "react";

import type { Route } from "./+types/guide";
import type { PetType } from "../data/guides";

import { guideItems, petTypeLabels } from "../data/guides";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 펫 케어 가이드" },
    { name: "description", content: "강아지/고양이 케어 가이드 모음" },
  ];
}

const tabItems: Array<{ id: PetType; label: string; icon: string }> = [
  { id: "dog", label: "강아지", icon: "🐕" },
  { id: "cat", label: "고양이", icon: "🐈" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Guide() {
  const [petType, setPetType] = useState<PetType>("dog");
  const guides = useMemo(
    () => guideItems.filter((guide) => guide.petType === petType),
    [petType]
  );

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24 font-['Pretendard','-apple-system','BlinkMacSystemFont','system-ui','Roboto','Helvetica_Neue','Segoe_UI','Apple_SD_Gothic_Neo','Noto_Sans_KR','Malgun_Gothic','sans-serif']">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="px-6 pt-6 pb-4 sticky top-0 z-10 bg-[#F2F4F6]/90 backdrop-blur-md border-b border-slate-200/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#8B95A1] font-medium">펫 케어 가이드</p>
              <h1 className="text-[20px] font-bold text-[#191F28]">반려생활 가이드 보드</h1>
            </div>
            <div className="text-2xl">📘</div>
          </div>
          <p className="mt-2 text-[14px] text-[#8B95A1]">
            초보 집사도 바로 적용할 수 있는 핵심 팁을 모았어요.
          </p>

          <div className="flex gap-2 mt-4">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPetType(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  petType === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-6 py-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            <div className="hidden sm:grid grid-cols-[1.6fr_0.7fr_0.6fr_0.6fr] gap-4 px-4 py-3 text-[12px] font-bold text-[#4E5968] bg-[#F2F4F6]">
              <span>{petTypeLabels[petType]} 가이드</span>
              <span>카테고리</span>
              <span>소요</span>
              <span>업데이트</span>
            </div>
            <div className="divide-y divide-slate-100">
              {guides.map((guide) => (
                <div
                  key={guide.id}
                  className="px-4 py-4 sm:grid sm:grid-cols-[1.6fr_0.7fr_0.6fr_0.6fr] sm:gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[15px] font-bold text-[#191F28]">
                        {guide.title}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                        {guide.level}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#8B95A1] leading-relaxed line-clamp-2">
                      {guide.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] rounded-full bg-slate-50 text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-[13px] text-[#4E5968] font-medium">
                    <span className="sm:hidden text-[#8B95A1] mr-2">카테고리</span>
                    {guide.category}
                  </div>
                  <div className="mt-1 sm:mt-0 text-[13px] text-[#4E5968]">
                    <span className="sm:hidden text-[#8B95A1] mr-2">소요</span>
                    {guide.readTime}
                  </div>
                  <div className="mt-1 sm:mt-0 text-[13px] text-[#4E5968]">
                    <span className="sm:hidden text-[#8B95A1] mr-2">업데이트</span>
                    {formatDate(guide.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {guides.length === 0 && (
            <div className="text-center py-12 text-[#8B95A1]">
              {petTypeLabels[petType]} 가이드가 없습니다.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
