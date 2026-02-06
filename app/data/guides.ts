export type PetType = "dog" | "cat";

export type GuideLevel = "초급" | "중급" | "고급";

export type Guide = {
  id: string;
  petType: PetType;
  title: string;
  category: string;
  summary: string;
  level: GuideLevel;
  readTime: string;
  updatedAt: string;
  tags: string[];
};

export const petTypeLabels: Record<PetType, string> = {
  dog: "강아지",
  cat: "고양이",
};

export const guideItems: Guide[] = [
  {
    id: "dog-walk-routine",
    petType: "dog",
    title: "첫 산책 루틴 만들기",
    category: "생활",
    summary: "하네스 적응부터 산책 동선까지, 초보 보호자를 위한 기본 루틴을 정리했어요.",
    level: "초급",
    readTime: "6분",
    updatedAt: "2025-12-12",
    tags: ["산책", "사회화"],
  },
  {
    id: "dog-toilet-plan",
    petType: "dog",
    title: "배변 훈련 7일 플랜",
    category: "훈련",
    summary: "실패를 줄이는 타이밍과 보상 루틴을 7일 커리큘럼으로 제공해요.",
    level: "초급",
    readTime: "8분",
    updatedAt: "2025-11-28",
    tags: ["배변", "보상"],
  },
  {
    id: "dog-vaccine-check",
    petType: "dog",
    title: "예방접종 체크리스트",
    category: "건강",
    summary: "연령대별 기본 접종과 추가 접종 타이밍을 한눈에 확인하세요.",
    level: "중급",
    readTime: "5분",
    updatedAt: "2025-12-02",
    tags: ["건강", "병원"],
  },
  {
    id: "dog-senior-joint",
    petType: "dog",
    title: "노령견 관절 케어 루틴",
    category: "케어",
    summary: "관절 부담을 줄이는 산책 강도와 홈 스트레칭 루틴을 정리했어요.",
    level: "중급",
    readTime: "7분",
    updatedAt: "2025-12-18",
    tags: ["노령", "관절"],
  },
  {
    id: "cat-space-layout",
    petType: "cat",
    title: "캣타워 배치로 스트레스 줄이기",
    category: "환경",
    summary: "높이와 동선 중심으로 공간을 재배치해 숨숨집 만족도를 높여요.",
    level: "초급",
    readTime: "6분",
    updatedAt: "2025-12-08",
    tags: ["공간", "안정"],
  },
  {
    id: "cat-hairball-care",
    petType: "cat",
    title: "헤어볼 예방 식습관",
    category: "건강",
    summary: "수분 섭취와 급여 루틴을 조정해 헤어볼 스트레스를 줄여요.",
    level: "중급",
    readTime: "5분",
    updatedAt: "2025-11-30",
    tags: ["영양", "헤어볼"],
  },
  {
    id: "cat-scratcher",
    petType: "cat",
    title: "스크래처 사용 습관 만들기",
    category: "행동",
    summary: "잘못 긁는 행동을 줄이고 스크래처 정착을 돕는 단계별 팁입니다.",
    level: "초급",
    readTime: "7분",
    updatedAt: "2025-12-05",
    tags: ["스크래칭", "습관"],
  },
  {
    id: "cat-play-bite",
    petType: "cat",
    title: "입질 줄이는 놀이 루틴",
    category: "훈련",
    summary: "사냥 놀이 흐름을 정리해 과격한 입질을 자연스럽게 줄여요.",
    level: "중급",
    readTime: "6분",
    updatedAt: "2025-12-15",
    tags: ["놀이", "입질"],
  },
];
