export type Species = "DOG" | "CAT";
export type KcalSource = "OFFICIAL" | "ESTIMATED";

export type Breed = {
  id: string;
  species: Species;
  name: string;
  size: "Small" | "Medium" | "Large";
  weightRangeKg: [number, number];
  activityTendency: string;
};

export type ProductSku = {
  id: string;
  sizeKg: number;
  currentPrice: number;
  priceHistory: number[];
  image?: string;
};

export type Product = {
  id: string;
  species: Species;
  brand: string;
  name: string;
  protein: number;
  fat: number;
  fiber: number;
  ash: number;
  moisture: number;
  kcalPerKg: number;
  kcalSource: KcalSource;
  ingredients: string[];
  allergens: string[];
  skus: ProductSku[];
  image?: string;
};

export type PetProfile = {
  name: string;
  species: Species;
  breedId: string;
  weightKg: number;
  isNeutered: boolean;
  activityLevel: 1 | 2 | 3 | 4 | 5;
  allergies: string[];
  birthDate: string | null;
};

export const breeds: Breed[] = [
  {
    id: "pomeranian",
    species: "DOG",
    name: "포메라니안",
    size: "Small",
    weightRangeKg: [1.8, 3.5],
    activityTendency: "집에서도 활발",
  },
  {
    id: "shiba",
    species: "DOG",
    name: "시바 이누",
    size: "Medium",
    weightRangeKg: [8, 11],
    activityTendency: "경계심 있고 독립적",
  },
  {
    id: "korean-short-hair",
    species: "CAT",
    name: "코리안 숏헤어",
    size: "Small",
    weightRangeKg: [3, 5.5],
    activityTendency: "실내 균형 활동",
  },
  {
    id: "russian-blue",
    species: "CAT",
    name: "러시안 블루",
    size: "Small",
    weightRangeKg: [3, 5],
    activityTendency: "조용하고 내성적",
  },
  {
    id: "persian",
    species: "CAT",
    name: "페르시안",
    size: "Medium",
    weightRangeKg: [4, 6],
    activityTendency: "차분하고 우아함",
  },
  {
    id: "munchkin",
    species: "CAT",
    name: "먼치킨",
    size: "Small",
    weightRangeKg: [2, 4],
    activityTendency: "호기심 많고 활발",
  },
  {
    id: "turkish-angora",
    species: "CAT",
    name: "터키시 앙고라",
    size: "Small",
    weightRangeKg: [2.5, 5],
    activityTendency: "영리하고 장난끼 많음",
  },
  {
    id: "siamese",
    species: "CAT",
    name: "샴",
    size: "Small",
    weightRangeKg: [3, 5],
    activityTendency: "수다스럽고 활동적",
  },
  {
    id: "american-shorthair",
    species: "CAT",
    name: "아메리칸 숏헤어",
    size: "Medium",
    weightRangeKg: [3.5, 7],
    activityTendency: "활발하고 온순함",
  },
  {
    id: "british-shorthair",
    species: "CAT",
    name: "브리티시 숏헤어",
    size: "Medium",
    weightRangeKg: [4, 8],
    activityTendency: "조용하고 얌전함",
  },
  {
    id: "scottish-fold",
    species: "CAT",
    name: "스코티시 폴드",
    size: "Medium",
    weightRangeKg: [3, 6],
    activityTendency: "상냥하고 적응력 좋음",
  },
  {
    id: "ragdoll",
    species: "CAT",
    name: "랙돌",
    size: "Large",
    weightRangeKg: [4.5, 9],
    activityTendency: "매우 온순하고 느긋함",
  },
  {
    id: "norwegian-forest",
    species: "CAT",
    name: "노르웨이숲",
    size: "Large",
    weightRangeKg: [5, 10],
    activityTendency: "활동적이고 등반 즐김",
  },
  {
    id: "sphynx",
    species: "CAT",
    name: "스핑크스",
    size: "Medium",
    weightRangeKg: [3, 6],
    activityTendency: "애교 많고 활발함",
  },
  {
    id: "abyssinian",
    species: "CAT",
    name: "아비시니안",
    size: "Small",
    weightRangeKg: [3, 5],
    activityTendency: "매우 활동적이고 민첩",
  },
  {
    id: "bengal",
    species: "CAT",
    name: "뱅갈",
    size: "Large",
    weightRangeKg: [4, 8],
    activityTendency: "에너지 넘치고 야성적",
  },
  {
    id: "maine-coon",
    species: "CAT",
    name: "메인쿤",
    size: "Large",
    weightRangeKg: [6, 11],
    activityTendency: "신사적이고 우호적",
  },
  {
    id: "siberian",
    species: "CAT",
    name: "시베리안",
    size: "Large",
    weightRangeKg: [4.5, 9],
    activityTendency: "강인하고 장난기 있음",
  },
  {
    id: "exotic-shorthair",
    species: "CAT",
    name: "엑조틱",
    size: "Medium",
    weightRangeKg: [3.5, 6],
    activityTendency: "조용하고 다정함",
  },
  {
    id: "birman",
    species: "CAT",
    name: "버만",
    size: "Medium",
    weightRangeKg: [3, 6],
    activityTendency: "온화하고 사교적",
  },
  {
    id: "bombay",
    species: "CAT",
    name: "봄베이",
    size: "Small",
    weightRangeKg: [2.5, 5],
    activityTendency: "관심 받기 좋아함",
  },
  {
    id: "devon-rex",
    species: "CAT",
    name: "데본 렉스",
    size: "Small",
    weightRangeKg: [2.5, 4.5],
    activityTendency: "장난기 많고 애교쟁이",
  },
  {
    id: "cornish-rex",
    species: "CAT",
    name: "코니시 렉스",
    size: "Small",
    weightRangeKg: [2.5, 4.5],
    activityTendency: "매우 활동적이고 호기심 왕성",
  },
];

export const products: Product[] = [
  {
    id: "harbor-lamb",
    species: "DOG",
    brand: "하버",
    name: "램앤라이스 밸런스",
    protein: 26,
    fat: 14,
    fiber: 3,
    ash: 7,
    moisture: 10,
    kcalPerKg: 3680,
    kcalSource: "OFFICIAL",
    ingredients: ["양고기", "쌀", "보리", "연어오일", "해조류"],
    allergens: ["양", "생선"],
    skus: [
      {
        id: "harbor-lamb-2",
        sizeKg: 2,
        currentPrice: 28000,
        priceHistory: [24000, 25500, 26000, 27500, 28000],
      },
      {
        id: "harbor-lamb-6",
        sizeKg: 6,
        currentPrice: 72000,
        priceHistory: [68000, 69000, 70000, 73000, 72000],
      },
    ],
  },
  {
    id: "citrus-duck",
    species: "DOG",
    brand: "시트러스",
    name: "덕 하베스트",
    protein: 28,
    fat: 16,
    fiber: 4,
    ash: 6.5,
    moisture: 9,
    kcalPerKg: 3820,
    kcalSource: "ESTIMATED",
    ingredients: ["오리", "고구마", "완두", "호박", "아마씨"],
    allergens: ["오리"],
    skus: [
      {
        id: "citrus-duck-2",
        sizeKg: 2,
        currentPrice: 32000,
        priceHistory: [30000, 30500, 32000, 33500, 32000],
      },
    ],
  },
  {
    id: "noon-salmon",
    species: "CAT",
    brand: "눈",
    name: "연어 인도어 케어",
    protein: 32,
    fat: 14,
    fiber: 3,
    ash: 7,
    moisture: 9,
    kcalPerKg: 3920,
    kcalSource: "OFFICIAL",
    ingredients: ["연어", "치킨밀", "호박", "크랜베리"],
    allergens: ["생선", "닭"],
    skus: [
      {
        id: "noon-salmon-1.5",
        sizeKg: 1.5,
        currentPrice: 26000,
        priceHistory: [23000, 25000, 26000, 27000, 26500],
      },
    ],
  },
];

export const defaultPet: PetProfile = {
  name: "보리",
  species: "DOG",
  breedId: "pomeranian",
  weightKg: 3.2,
  isNeutered: true,
  activityLevel: 3,
  allergies: ["닭"],
  birthDate: null,
};

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getBreedById(id: string) {
  return breeds.find((breed) => breed.id === id);
}
