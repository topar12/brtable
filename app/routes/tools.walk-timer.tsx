import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tools.walk-timer";
import { useWalkTimer } from "../hooks/useWalkTimer";
import { formatHms, formatKoDateTime, formatDurationWords } from "../utils/time";
import {
  loadWalkSessions,
  addWalkSession,
  deleteWalkSession,
  type WalkSessionV1,
} from "../utils/walkSessions";
import { useStoredProfile } from "../hooks/useStoredProfile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "산책 타이머 - 반려식탁" },
    { name: "description", content: "산책 시간과 거리 기록" },
  ];
}

export default function WalkTimer() {
  const { status, elapsedMs, start, pause, resume, stop, reset } = useWalkTimer();
  const { profile } = useStoredProfile();
  const [sessions, setSessions] = useState<WalkSessionV1[]>([]);
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setSessions(loadWalkSessions());
  }, []);

  const handleSave = () => {
    const distanceNum = distance ? parseFloat(distance) : null;
    addWalkSession({
      startedAtIso: new Date(Date.now() - elapsedMs).toISOString(),
      endedAtIso: new Date().toISOString(),
      durationMs: elapsedMs,
      distanceKm: distanceNum,
      notes: notes.trim(),
      profileSnapshot: {
        name: profile.name,
        species: profile.species,
        weightKg: profile.weightKg,
      },
    });
    reset();
    setDistance("");
    setNotes("");
    setSessions(loadWalkSessions());
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteWalkSession(id);
      setSessions(loadWalkSessions());
    }
  };

  const handleCancel = () => {
    reset();
    setDistance("");
    setNotes("");
  };

  const getStatusBadge = () => {
    switch (status) {
      case "running":
        return (
          <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#3182F6] rounded-full text-[13px] font-bold">
            <span className="w-2 h-2 bg-[#3182F6] rounded-full mr-2 animate-pulse"></span>
            진행중
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-[#4E5968] rounded-full text-[13px] font-bold">
            일시정지
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-[#8B95A1] rounded-full text-[13px] font-bold">
            준비
          </span>
        );
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] pb-24">
        <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
          <header className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
            >
              <span className="mr-1">←</span>
              <span className="text-sm">돌아가기</span>
            </Link>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors mb-4"
          >
            <span className="mr-1">←</span>
            <span className="text-sm">돌아가기</span>
          </Link>
          <h1 className="text-[26px] font-bold text-[#191F28] mb-2">산책 타이머</h1>
          <p className="text-[15px] text-[#8B95A1]">산책 시간과 거리를 기록해요</p>
        </header>

        {/* Timer Card */}
        {status !== "stopped" && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
            {/* Pet Info */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-[16px]">
                <span className="text-xl">{profile.species === "CAT" ? "🐈" : "🐕"}</span>
                <span className="text-[15px] font-bold text-[#191F28]">
                  {profile.name || "내 반려동물"}
                </span>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-6">
              <div className="text-[44px] font-bold text-[#191F28] tracking-tight font-mono">
                {formatHms(elapsedMs)}
              </div>
              <div className="mt-3">{getStatusBadge()}</div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              {status === "idle" && (
                <button
                  onClick={start}
                  className="col-span-2 py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                >
                  시작
                </button>
              )}
              {status === "running" && (
                <>
                  <button
                    onClick={pause}
                    className="py-4 bg-[#F2F4F6] text-[#4E5968] rounded-[20px] text-[17px] font-bold hover:bg-[#E5E8EB] active:scale-[0.98] transition-all"
                  >
                    일시정지
                  </button>
                  <button
                    onClick={stop}
                    className="py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                  >
                    종료
                  </button>
                </>
              )}
              {status === "paused" && (
                <>
                  <button
                    onClick={resume}
                    className="py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                  >
                    계속
                  </button>
                  <button
                    onClick={stop}
                    className="py-4 bg-[#F2F4F6] text-[#4E5968] rounded-[20px] text-[17px] font-bold hover:bg-[#E5E8EB] active:scale-[0.98] transition-all"
                  >
                    종료
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Save Form Card */}
        {status === "stopped" && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
            <h2 className="text-[18px] font-bold text-[#191F28] mb-6 text-center">
              산책 기록 저장
            </h2>

            {/* Summary */}
            <div className="space-y-3 mb-6 p-4 bg-[#F2F4F6] rounded-[16px]">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#8B95A1]">시작 시간</span>
                <span className="font-medium text-[#191F28]">
                  {formatKoDateTime(new Date(Date.now() - elapsedMs).toISOString())}
                </span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#8B95A1]">종료 시간</span>
                <span className="font-medium text-[#191F28]">
                  {formatKoDateTime(new Date().toISOString())}
                </span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#8B95A1]">총 시간</span>
                <span className="font-bold text-[#3182F6]">{formatDurationWords(elapsedMs)}</span>
              </div>
            </div>

            {/* Distance Input */}
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-[#8B95A1] mb-2">
                거리 (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[12px] text-[16px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30"
                placeholder="예: 1.5"
              />
            </div>

            {/* Notes Input */}
            <div className="mb-6">
              <label className="block text-[14px] font-medium text-[#8B95A1] mb-2">
                메모 (선택)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[12px] text-[16px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 resize-none"
                placeholder="산책 중 특이사항을 적어보세요"
              />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCancel}
                className="py-4 bg-[#F2F4F6] text-[#4E5968] rounded-[20px] text-[17px] font-bold hover:bg-[#E5E8EB] active:scale-[0.98] transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#191F28]">기록</h2>
            {sessions.length > 0 && (
              <span className="px-3 py-1 bg-blue-50 text-[#3182F6] rounded-full text-[13px] font-bold">
                {sessions.length}개
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🐾</span>
              </div>
              <p className="text-[16px] text-[#8B95A1]">아직 산책 기록이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <article
                  key={session.id}
                  className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] text-[#8B95A1] mb-1">
                        {formatKoDateTime(session.startedAtIso)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {session.profileSnapshot.species === "DOG" ? "🐕" : "🐈"}
                        </span>
                        <span className="text-[16px] font-bold text-[#191F28]">
                          {session.profileSnapshot.name || "반려동물"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-[#8B95A1] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[20px] font-bold text-[#3182F6]">
                        {formatDurationWords(session.durationMs)}
                      </span>
                    </div>
                    {session.distanceKm && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-full">
                        <span className="text-[14px] font-bold text-emerald-600">
                          {session.distanceKm}km
                        </span>
                      </div>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-[14px] text-[#4E5968] bg-[#F2F4F6] rounded-[12px] p-3">
                      {session.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
