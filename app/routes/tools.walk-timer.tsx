import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tools.walk-timer";
import { useWalkTimer } from "../hooks/useWalkTimer";
import { formatHms, formatKoDateTime, formatDurationWords } from "../utils/time";
import {
  fetchWalkSessions,
  createWalkSession,
  deleteWalkSession,
  type WalkSession,
} from "../utils/walkSessions";
import { useAuth } from "../hooks/useAuth";
import { fetchPetProfiles, type DbPetProfile } from "../utils/petProfiles";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "산책 타이머 - 반려식탁" },
    { name: "description", content: "산책 시간과 거리 기록" },
  ];
}

// Guest pet info interface
interface GuestPetInfo {
  name: string;
  species: "DOG" | "CAT";
}

const GUEST_PET_STORAGE_KEY = "walktimer-guest-pet";

export default function WalkTimer() {
  const { status, elapsedMs, start, pause, resume, stop, reset } = useWalkTimer();
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [pets, setPets] = useState<DbPetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Guest mode states
  const [guestPetName, setGuestPetName] = useState("");
  const [guestPetSpecies, setGuestPetSpecies] = useState<"DOG" | "CAT">("DOG");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isGuestPetSet, setIsGuestPetSet] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Load guest pet info from localStorage
    if (typeof window !== "undefined") {
      const savedGuestPet = localStorage.getItem(GUEST_PET_STORAGE_KEY);
      if (savedGuestPet) {
        try {
          const parsed: GuestPetInfo = JSON.parse(savedGuestPet);
          setGuestPetName(parsed.name);
          setGuestPetSpecies(parsed.species);
          setIsGuestPetSet(true);
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, []);

  // Update guest pet in pets array when guest info changes
  useEffect(() => {
    if (!isAuthenticated && isGuestPetSet && guestPetName) {
      setPets([{
        id: "guest-pet",
        user_id: "guest",
        name: guestPetName,
        species: guestPetSpecies,
        breed_id: null,
        breed_name: null,
        weight_kg: 5,
        is_neutered: false,
        activity_level: 3,
        allergies: [],
        birth_date: null,
        image_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      setSelectedPetId("guest-pet");
    }
  }, [isAuthenticated, isGuestPetSet, guestPetName, guestPetSpecies]);

  const handleGuestPetSubmit = () => {
    if (!guestPetName.trim()) {
      alert("반려동물 이름을 입력해주세요.");
      return;
    }
    // Save to localStorage
    const guestPetInfo: GuestPetInfo = {
      name: guestPetName.trim(),
      species: guestPetSpecies,
    };
    localStorage.setItem(GUEST_PET_STORAGE_KEY, JSON.stringify(guestPetInfo));
    setIsGuestPetSet(true);
    setShowGuestForm(false);
  };

  const handleEditGuestPet = () => {
    setShowGuestForm(true);
  };

  const handleResetGuestPet = () => {
    localStorage.removeItem(GUEST_PET_STORAGE_KEY);
    setGuestPetName("");
    setGuestPetSpecies("DOG");
    setIsGuestPetSet(false);
    setPets([]);
    setShowGuestForm(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Guest Mode: check if guest pet info exists
      if (!isGuestPetSet) {
        setPets([]);
      }
      setSessions([]);
      setSessionsLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setSessionsLoading(true);
      setSessionsError(null);

      try {
        const petData = await fetchPetProfiles(user.id);
        if (!mounted) return;
        setPets(petData);
        if (petData.length > 0) {
          setSelectedPetId((prev) => prev || petData[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        setPets([]);
        setSessionsError(
          error instanceof Error ? error.message : "반려동물 정보를 불러오지 못했어요."
        );
      }

      try {
        const sessionData = await fetchWalkSessions(user.id);
        if (!mounted) return;
        setSessions(sessionData);
      } catch (error) {
        if (!mounted) return;
        setSessions([]);
        setSessionsError(
          error instanceof Error ? error.message : "산책 기록을 불러오지 못했어요."
        );
      } finally {
        if (mounted) setSessionsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Set selectedPetId for guest initially if not set
  useEffect(() => {
    if (!isAuthenticated && pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [isAuthenticated, pets, selectedPetId]);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const filteredSessions = useMemo(() => {
    if (!selectedPet) return [];
    return sessions.filter((session) => session.pet_id === selectedPet.id);
  }, [sessions, selectedPet]);

  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const weeklyTotalMs = useMemo(() => {
    return filteredSessions
      .filter((session) => new Date(session.started_at) >= weekStart)
      .reduce((sum, session) => sum + session.duration_ms, 0);
  }, [filteredSessions, weekStart]);

  const monthlyTotalMs = useMemo(() => {
    return filteredSessions
      .filter((session) => new Date(session.started_at) >= monthStart)
      .reduce((sum, session) => sum + session.duration_ms, 0);
  }, [filteredSessions, monthStart]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      if (confirm("산책 기록을 저장하려면 로그인이 필요해요.\n로그인 페이지로 이동할까요?")) {
        // Redirect to login handled by Link or programmatic nav in real app, simply alert for now or use window.location
        window.location.href = "/login";
      }
      return;
    }

    if (!user?.id || !selectedPet) return;
    const distanceNum = distance ? parseFloat(distance) : null;
    try {
      await createWalkSession({
        user_id: user.id,
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
        pet_species: selectedPet.species,
        started_at: new Date(Date.now() - elapsedMs).toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: elapsedMs,
        distance_km: distanceNum,
        notes: notes.trim() ? notes.trim() : null,
      });
      const updatedSessions = await fetchWalkSessions(user.id);
      setSessions(updatedSessions);
      reset();
      setDistance("");
      setNotes("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;
    if (!user?.id) return;
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteWalkSession(id);
      const updatedSessions = await fetchWalkSessions(user.id);
      setSessions(updatedSessions);
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

  // Removed blocking check for !isAuthenticated

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

        {sessionsError && (
          <div className="mb-6 p-4 bg-red-50 rounded-[20px]">
            <p className="text-[14px] text-red-600 text-center">⚠️ {sessionsError}</p>
          </div>
        )}

        {/* Pet Selection */}
        <section className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[#191F28]">산책할 반려동물</h2>
            {isAuthenticated && pets.length > 0 && (
              <span className="text-[12px] text-[#8B95A1]">{pets.length}마리</span>
            )}
            {!isAuthenticated && isGuestPetSet && (
              <button
                onClick={handleEditGuestPet}
                className="text-[12px] text-[#3182F6] hover:underline"
              >
                수정
              </button>
            )}
          </div>

          {/* 비회원 모드: 반려동물 정보 입력 폼 */}
          {!isAuthenticated && (!isGuestPetSet || showGuestForm) && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-[14px] text-[#8B95A1] mb-4">
                  산책 타이머를 사용하려면 반려동물 정보를 입력해주세요
                </p>
              </div>

              {/* 이름 입력 */}
              <div>
                <label className="block text-[13px] font-medium text-[#8B95A1] mb-2">
                  반려동물 이름
                </label>
                <input
                  type="text"
                  value={guestPetName}
                  onChange={(e) => setGuestPetName(e.target.value)}
                  placeholder="예: 초코, 나비"
                  className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[14px] text-[15px] text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30"
                />
              </div>

              {/* 종류 선택 */}
              <div>
                <label className="block text-[13px] font-medium text-[#8B95A1] mb-2">
                  종류
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestPetSpecies("DOG")}
                    className={`py-3 rounded-[14px] text-[15px] font-medium transition-all ${guestPetSpecies === "DOG"
                        ? "bg-[#3182F6] text-white shadow-lg shadow-blue-500/20"
                        : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                      }`}
                  >
                    🐕 강아지
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestPetSpecies("CAT")}
                    className={`py-3 rounded-[14px] text-[15px] font-medium transition-all ${guestPetSpecies === "CAT"
                        ? "bg-[#3182F6] text-white shadow-lg shadow-blue-500/20"
                        : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                      }`}
                  >
                    🐈 고양이
                  </button>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                {showGuestForm && isGuestPetSet && (
                  <button
                    onClick={() => setShowGuestForm(false)}
                    className="flex-1 py-3 bg-[#F2F4F6] text-[#4E5968] rounded-[14px] text-[15px] font-bold hover:bg-[#E5E8EB] transition-all"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleGuestPetSubmit}
                  className={`${showGuestForm && isGuestPetSet ? "flex-1" : "w-full"} py-3 bg-[#3182F6] text-white rounded-[14px] text-[15px] font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20`}
                >
                  {isGuestPetSet ? "수정 완료" : "시작하기"}
                </button>
              </div>

              {/* 로그인 유도 */}
              <div className="text-center pt-2">
                <p className="text-[12px] text-[#8B95A1]">
                  산책 기록을 저장하려면{" "}
                  <Link to="/login" className="text-[#3182F6] hover:underline font-medium">
                    로그인
                  </Link>
                  이 필요해요
                </p>
              </div>
            </div>
          )}

          {/* 비회원 모드: 설정된 반려동물 표시 */}
          {!isAuthenticated && isGuestPetSet && !showGuestForm && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-2xl">
                  {guestPetSpecies === "CAT" ? "🐈" : "🐕"}
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[#191F28]">{guestPetName}</p>
                  <p className="text-[13px] text-[#8B95A1]">
                    {guestPetSpecies === "DOG" ? "강아지" : "고양이"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetGuestPet}
                className="text-[12px] text-[#8B95A1] hover:text-red-500 px-2 py-1"
              >
                초기화
              </button>
            </div>
          )}

          {/* 로그인 사용자 모드 */}
          {isAuthenticated && pets.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[14px] text-[#8B95A1] mb-3">등록된 반려동물이 없어요.</p>
              <Link
                to="/onboarding"
                className="inline-flex items-center justify-center px-4 py-2 bg-[#3182F6] text-white rounded-[14px] text-[14px] font-bold"
              >
                반려동물 등록하기
              </Link>
            </div>
          )}

          {isAuthenticated && pets.length > 0 && (
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[14px] text-[15px] text-[#191F28]"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} · {pet.species === "DOG" ? "강아지" : "고양이"}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* Timer Card */}
        {selectedPet && status !== "stopped" && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
            {/* Pet Info */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-[16px]">
                <span className="text-xl">
                  {selectedPet?.species === "CAT" ? "🐈" : "🐕"}
                </span>
                <span className="text-[15px] font-bold text-[#191F28]">
                  {selectedPet?.name || "내 반려동물"}
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
                  disabled={!selectedPet}
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
        {status === "stopped" && selectedPet && (
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
                disabled={!selectedPet}
                className="py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {selectedPet && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
            <h2 className="text-[18px] font-bold text-[#191F28] mb-4">산책 요약</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                <p className="text-[13px] text-[#8B95A1] mb-2">이번주</p>
                <p className="text-[16px] font-bold text-[#191F28]">
                  {weeklyTotalMs > 0 ? formatDurationWords(weeklyTotalMs) : "0분"}
                </p>
              </div>
              <div className="bg-[#F2F4F6] rounded-[16px] p-4">
                <p className="text-[13px] text-[#8B95A1] mb-2">이번달</p>
                <p className="text-[16px] font-bold text-[#191F28]">
                  {monthlyTotalMs > 0 ? formatDurationWords(monthlyTotalMs) : "0분"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#191F28]">기록</h2>
            {filteredSessions.length > 0 && (
              <span className="px-3 py-1 bg-blue-50 text-[#3182F6] rounded-full text-[13px] font-bold">
                {filteredSessions.length}개
              </span>
            )}
          </div>

          {sessionsLoading ? (
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[15px] text-[#8B95A1]">불러오는 중...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🐾</span>
              </div>
              <p className="text-[16px] text-[#8B95A1]">
                {isAuthenticated
                  ? "아직 산책 기록이 없어요."
                  : "산책 기록을 관리하려면 로그인해주세요."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <article
                  key={session.id}
                  className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] text-[#8B95A1] mb-1">
                        {formatKoDateTime(session.started_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {session.pet_species === "DOG" ? "🐕" : "🐈"}
                        </span>
                        <span className="text-[16px] font-bold text-[#191F28]">
                          {session.pet_name || "반려동물"}
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
                        {formatDurationWords(session.duration_ms)}
                      </span>
                    </div>
                    {session.distance_km && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-full">
                        <span className="text-[14px] font-bold text-emerald-600">
                          {session.distance_km}km
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
