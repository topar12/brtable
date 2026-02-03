import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tools.pet-age";
import { calculatePetAge, type PetSpecies, type DogSize } from "../utils/age-calculator";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "반려동물 나이계산기 - 반려식탁" },
    { name: "description", content: "우리 아이는 사람 나이로 몇 살일까요?" },
  ];
}

export default function PetAge() {
  const [species, setSpecies] = useState<PetSpecies>("DOG");
  const [dogSize, setDogSize] = useState<DogSize>("SMALL");
  const [years, setYears] = useState<string>("");
  const [months, setMonths] = useState<string>("");

  const calculate = () => {
    const y = parseInt(years) || 0;
    const m = parseInt(months) || 0;
    if (y === 0 && m === 0) return null;
    return calculatePetAge(species, y, m, species === "DOG" ? dogSize : undefined);
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-32 font-['Pretendard','-apple-system','BlinkMacSystemFont','system-ui','Roboto','Helvetica_Neue','Segoe_UI','Apple_SD_Gothic_Neo','Noto_Sans_KR','Malgun_Gothic','sans-serif']">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* Header */}
        <header className="px-6 py-5 flex items-center sticky top-0 z-10 bg-[#F2F4F6]/80 backdrop-blur-md">
          <Link
            to="/"
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
          >
            <span className="mr-1 text-lg">←</span>
            <span className="text-[15px] font-medium">돌아가기</span>
          </Link>
          <span className="font-bold text-[#191F28] ml-auto text-[17px]">나이 계산기</span>
        </header>

        <main className="px-6 flex-1 flex flex-col gap-8 mt-2">

          {/* Intro Section */}
          <div>
            <h1 className="text-[26px] font-bold text-[#191F28] leading-[1.3] mb-3">
              우리 아이,<br />
              <span className="text-[#3182F6]">사람 나이</span>로 몇 살일까요?
            </h1>
            <p className="text-[#8B95A1] text-[16px] leading-relaxed">
              반려동물의 생애 주기를 이해하고<br />
              더 건강하게 돌봐주세요.
            </p>
          </div>

          <div className="flex flex-col gap-8">

            {/* Species Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSpecies("DOG")}
                className={`relative overflow-hidden group p-6 rounded-[24px] border transition-all duration-300 ${species === "DOG"
                    ? "bg-white border-[#3182F6] shadow-[0_8px_30px_rgba(49,130,246,0.15)] ring-1 ring-[#3182F6]"
                    : "bg-white border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] opacity-70 hover:opacity-100 hover:scale-[1.02]"
                  }`}
              >
                <div className="text-4xl mb-3 transform transition-transform group-hover:scale-110 duration-300">🐶</div>
                <div className={`font-bold text-[17px] ${species === "DOG" ? "text-[#191F28]" : "text-[#8B95A1]"}`}>강아지</div>
                {species === "DOG" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#3182F6]"></div>}
              </button>

              <button
                onClick={() => setSpecies("CAT")}
                className={`relative overflow-hidden group p-6 rounded-[24px] border transition-all duration-300 ${species === "CAT"
                    ? "bg-white border-[#3182F6] shadow-[0_8px_30px_rgba(49,130,246,0.15)] ring-1 ring-[#3182F6]"
                    : "bg-white border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] opacity-70 hover:opacity-100 hover:scale-[1.02]"
                  }`}
              >
                <div className="text-4xl mb-3 transform transition-transform group-hover:scale-110 duration-300">🐱</div>
                <div className={`font-bold text-[17px] ${species === "CAT" ? "text-[#191F28]" : "text-[#8B95A1]"}`}>고양이</div>
                {species === "CAT" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#3182F6]"></div>}
              </button>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-[28px] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-7 animate-[fadeIn_0.4s_ease-out]">

              {/* Dog Size Selector */}
              {species === "DOG" && (
                <div className="space-y-3 animate-[slideUp_0.3s_ease-out]">
                  <label className="text-[14px] font-bold text-[#4E5968] ml-1">강아지 크기</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "SMALL", label: "소형견", sub: "~10kg" },
                      { id: "MEDIUM", label: "중형견", sub: "10~25kg" },
                      { id: "LARGE", label: "대형견", sub: "25kg~" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setDogSize(s.id as DogSize)}
                        className={`py-3.5 rounded-[18px] border transition-all duration-200 flex flex-col items-center justify-center gap-0.5 ${dogSize === s.id
                            ? "border-[#3182F6] bg-blue-50/50 text-[#3182F6] font-bold shadow-sm"
                            : "border-slate-100 bg-slate-50/50 text-[#8B95A1] hover:bg-slate-100"
                          }`}
                      >
                        <span className="text-[15px]">{s.label}</span>
                        <span className="text-[11px] opacity-70 font-normal">{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Input */}
              <div className="space-y-3">
                <label className="text-[14px] font-bold text-[#4E5968] ml-1">현재 나이</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative group">
                    <input
                      type="number"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                      placeholder="0"
                      className="w-full h-16 pl-6 pr-12 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 outline-none text-xl font-bold transition-all placeholder:text-slate-300/70"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8B95A1] text-[15px] font-medium group-focus-within:text-[#3182F6] transition-colors">살</span>
                  </div>
                  <div className="flex-1 relative group">
                    <input
                      type="number"
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                      placeholder="0"
                      className="w-full h-16 pl-6 pr-12 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 outline-none text-xl font-bold transition-all placeholder:text-slate-300/70"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8B95A1] text-[15px] font-medium group-focus-within:text-[#3182F6] transition-colors">개월</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Card */}
            {result && (
              <div className="rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(49,130,246,0.3)] animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] transform transition-all">
                <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] p-8 text-white relative overflow-hidden">

                  {/* Decorative blobs */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="text-blue-100 font-medium text-[15px] mb-2">사람 나이로 환산하면</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[56px] font-extrabold leading-none tracking-tight drop-shadow-sm">{result.humanAge}</span>
                          <span className="text-[24px] font-medium opacity-90">세</span>
                        </div>
                      </div>
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                        {species === "DOG" ? "🐕" : "🐈"}
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-[22px] p-5 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[13px] font-bold text-blue-100 uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full">LIFE STAGE</span>
                      </div>
                      <div className="text-[20px] font-bold mb-1 leading-snug">{result.description}</div>
                      <div className="h-1.5 w-full bg-black/10 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          style={{ width: result.stage === 'PUPPY' ? '20%' : result.stage === 'JUNIOR' ? '40%' : result.stage === 'ADULT' ? '60%' : result.stage === 'SENIOR' ? '80%' : '100%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 border-t border-slate-100 flex gap-3 text-left">
                  <div className="text-[18px]">💡</div>
                  <p className="text-[13px] text-[#8B95A1] leading-relaxed">
                    반려동물의 생애 주기는 크기와 품종에 따라 다를 수 있습니다. 정기적인 건강검진으로 정확한 상태를 확인해주세요.
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
