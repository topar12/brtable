import { Link } from "react-router";
import type { Route } from "./+types/menu";
import { useAuth } from "../hooks/useAuth";
import { useStoredProfile } from "../hooks/useStoredProfile";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "전체 메뉴 - 반려식탁" },
    { name: "description", content: "반려식탁의 모든 기능을 한눈에" },
  ];
}

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: {
    icon: string;
    label: string;
    to: string;
    disabled?: boolean;
  }[];
}

const menuSections: MenuSection[] = [
  {
    id: "tools",
    title: "도구",
    icon: "🛠️",
    color: "blue",
    items: [
      { icon: "🧮", label: "급여량 계산기", to: "/calculator" },
      { icon: "🔎", label: "사료 정보 탐색", to: "/products" },
      { icon: "📊", label: "사료 비교하기", to: "/compare" },
    ],
  },
  {
    id: "pets",
    title: "내 반려동물",
    icon: "🐾",
    color: "orange",
    items: [
      { icon: "🐕", label: "반려동물 프로필", to: "/pets" },
      { icon: "✏️", label: "반려동물 추가", to: "/onboarding" },
    ],
  },
  {
    id: "other",
    title: "기타",
    icon: "⚙️",
    color: "gray",
    items: [
      { icon: "⚙️", label: "설정", to: "#", disabled: true },
      { icon: "❓", label: "도움말", to: "#", disabled: true },
      { icon: "ℹ️", label: "앱 정보", to: "#", disabled: true },
    ],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  gray: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" },
};

function MenuSectionCard({
  section,
  isExpanded,
  onToggle,
}: {
  section: MenuSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = colorClasses[section.color];

  return (
    <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-xl`}>
            {section.icon}
          </div>
          <span className="text-[17px] font-bold text-[#191F28]">{section.title}</span>
        </div>
        <span
          className={`text-[#8B95A1] text-xl transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      <div
        className={`transition-all duration-200 ease-out overflow-hidden ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-5 pb-4 border-t ${colors.border}`}>
          <div className="pt-3 space-y-1">
            {section.items.map((item, index) => (
              <MenuItem key={index} item={item} sectionColor={section.color} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  item,
}: {
  item: { icon: string; label: string; to: string; disabled?: boolean };
  sectionColor: string;
}) {
  if (item.disabled) {
    return (
      <div className="flex items-center justify-between px-3 py-3 rounded-xl opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <span className="text-xl">{item.icon}</span>
          <span className="text-[15px] font-medium text-[#4E5968]">{item.label}</span>
        </div>
        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          준비중
        </span>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{item.icon}</span>
        <span className="text-[15px] font-medium text-[#4E5968] group-hover:text-[#191F28]">
          {item.label}
        </span>
      </div>
      <span className="text-slate-300 group-hover:text-slate-400 transition-colors">›</span>
    </Link>
  );
}

export default function Menu() {
  const { isAuthenticated, signOut } = useAuth();
  const { profile } = useStoredProfile();
  const [expandedSections, setExpandedSections] = useState<string[]>(["tools", "pets"]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-8">
          <h1 className="text-[26px] font-bold text-[#191F28]">전체 메뉴</h1>
        </header>

        {/* User Card */}
        <section className="px-6 mb-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] text-[#8B95A1] mb-1">안녕하세요,</p>
                  <p className="text-[20px] font-bold text-[#191F28]">
                    {profile.name} 보호자님 👋
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-slate-100 text-[#8B95A1] rounded-xl text-[14px] font-medium hover:bg-slate-200 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[15px] text-[#8B95A1] mb-4">
                  로그인하고 모든 기능을 이용하세요
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 py-3 bg-[#3182F6] text-white rounded-xl text-[15px] font-bold text-center hover:bg-blue-600 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="flex-1 py-3 bg-slate-100 text-[#4E5968] rounded-xl text-[15px] font-bold text-center hover:bg-slate-200 transition-colors"
                  >
                    회원가입
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Menu Sections */}
        <section className="px-6 space-y-4">
          {menuSections.map((section) => (
            <MenuSectionCard
              key={section.id}
              section={section}
              isExpanded={expandedSections.includes(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </section>

        {/* Footer */}
        <footer className="px-6 mt-auto pt-8 pb-8 text-center">
          <p className="text-[12px] text-[#8B95A1]">
            반려식탁 v1.0.0
          </p>
        </footer>
      </div>
    </div>
  );
}
