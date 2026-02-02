import { Link } from "react-router";
import type { Route } from "./+types/tools.pet-age";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려동물 나이계산기 - 반려식탁" },
    { name: "description", content: "사람 나이로 변환" },
  ];
}

export default function PetAge() {
  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        <header className="px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
          >
            <span className="mr-1">←</span>
            <span className="text-sm">돌아가기</span>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-6">🎂</div>
          <h1 className="text-2xl font-bold text-[#191F28] mb-3">
            반려동물 나이계산기
          </h1>
          <p className="text-gray-500 text-center mb-8">
            준비중이에요! 곧 만나요.
          </p>
          <div className="animate-pulse">
            <div className="w-16 h-1 bg-purple-200 rounded-full"></div>
          </div>
        </main>

      </div>
    </div>
  );
}
