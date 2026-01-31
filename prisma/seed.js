import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed dog breeds
  const breedSeeds = [
    {
      slug: "pomeranian",
      name_ko: "포메라니안",
      name_en: "Pomeranian",
      aliases: ["폼"],
      popularity_rank: 1,
    },
    {
      slug: "shiba",
      name_ko: "시바 이누",
      name_en: "Shiba Inu",
      aliases: ["시바견"],
      popularity_rank: 2,
    },
    {
      slug: "golden-retriever",
      name_ko: "골든 리트리버",
      name_en: "Golden Retriever",
      aliases: ["골댕"],
      popularity_rank: 3,
    },
    {
      slug: "maltese",
      name_ko: "말티즈",
      name_en: "Maltese",
      aliases: [],
      popularity_rank: 4,
    },
    {
      slug: "poodle",
      name_ko: "푸들",
      name_en: "Poodle",
      aliases: [],
      popularity_rank: 5,
    },
    {
      slug: "korean-short-hair",
      name_ko: "코리안 숏헤어",
      name_en: "Korean Short Hair",
      aliases: ["코숏"],
      popularity_rank: 1,
    },
    {
      slug: "persian",
      name_ko: "페르시안",
      name_en: "Persian",
      aliases: [],
      popularity_rank: 2,
    },
  ];

  for (const breed of breedSeeds) {
    await prisma.dog_breeds.upsert({
      where: { slug: breed.slug },
      update: { ...breed },
      create: { ...breed },
    });
  }
  console.log(`✓ Seeded ${breedSeeds.length} breeds`);

  // Seed products with sample images
  const products = [
    {
      id: "harbor-lamb",
      brand: "하버",
      name: "램앤라이스 밸런스",
      lifestage: "ADULT",
      foodtype: "DRY",
      mainprotein: "양",
      isgrainfree: false,
      crudeprotein: 26,
      crudefat: 14,
      crudefiber: 3,
      crudeash: 7,
      crudemoisture: 10,
      caloriesper100g: 368,
      caloriessource: "OFFICIAL",
      hasaafco: true,
      hasfediaf: false,
      targetconditions: ["피부/피모", "소화기"],
      image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop",
    },
    {
      id: "citrus-duck",
      brand: "시트러스",
      name: "덕 하베스트",
      lifestage: "ADULT",
      foodtype: "DRY",
      mainprotein: "오리",
      isgrainfree: true,
      crudeprotein: 28,
      crudefat: 16,
      crudefiber: 4,
      crudeash: 6.5,
      crudemoisture: 9,
      caloriesper100g: 382,
      caloriessource: "ESTIMATED",
      hasaafco: true,
      hasfediaf: true,
      targetconditions: ["알러지", "소화기"],
      image: "https://images.unsplash.com/photo-1608408843596-b311965e0469?w=400&h=400&fit=crop",
    },
    {
      id: "noon-salmon",
      brand: "눈",
      name: "연어 인도어 케어",
      lifestage: "ADULT",
      foodtype: "DRY",
      mainprotein: "연어",
      isgrainfree: false,
      crudeprotein: 32,
      crudefat: 14,
      crudefiber: 3,
      crudeash: 7,
      crudemoisture: 9,
      caloriesper100g: 392,
      caloriessource: "OFFICIAL",
      hasaafco: true,
      hasfediaf: true,
      targetconditions: ["피부/피모", "실내생활"],
      image: "https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?w=400&h=400&fit=crop",
    },
    {
      id: "royal-canin-puppy",
      brand: "로얄캐닌",
      name: "미니 퍼피",
      lifestage: "PUPPY",
      foodtype: "DRY",
      mainprotein: "닭",
      isgrainfree: false,
      crudeprotein: 31,
      crudefat: 17,
      crudefiber: 2.8,
      crudeash: 7.2,
      crudemoisture: 8,
      caloriesper100g: 386,
      caloriessource: "OFFICIAL",
      hasaafco: true,
      hasfediaf: true,
      targetconditions: ["성장기", "면역력"],
      image: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=400&fit=crop",
    },
    {
      id: "orijen-original",
      brand: "오리젠",
      name: "오리지널",
      lifestage: "ADULT",
      foodtype: "DRY",
      mainprotein: "닭",
      isgrainfree: true,
      crudeprotein: 38,
      crudefat: 18,
      crudefiber: 4,
      crudeash: 8,
      crudemoisture: 10,
      caloriesper100g: 390,
      caloriessource: "OFFICIAL",
      hasaafco: true,
      hasfediaf: true,
      targetconditions: ["근육", "활동량"],
      image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { ...product },
      create: { ...product },
    });
  }
  console.log(`✓ Seeded ${products.length} products`);

  // Seed SKUs
  const skus = [
    { id: "harbor-lamb-2kg", productid: "harbor-lamb", weight: 2, price: 28000, clickcount: 15 },
    { id: "harbor-lamb-5kg", productid: "harbor-lamb", weight: 5, price: 62000, clickcount: 8 },
    { id: "citrus-duck-2kg", productid: "citrus-duck", weight: 2, price: 32000, clickcount: 12 },
    { id: "citrus-duck-5kg", productid: "citrus-duck", weight: 5, price: 72000, clickcount: 5 },
    { id: "noon-salmon-1.5kg", productid: "noon-salmon", weight: 1.5, price: 26000, clickcount: 20 },
    { id: "noon-salmon-4kg", productid: "noon-salmon", weight: 4, price: 58000, clickcount: 10 },
    { id: "royal-puppy-2kg", productid: "royal-canin-puppy", weight: 2, price: 35000, clickcount: 25 },
    { id: "royal-puppy-4kg", productid: "royal-canin-puppy", weight: 4, price: 65000, clickcount: 18 },
    { id: "orijen-original-2kg", productid: "orijen-original", weight: 2, price: 45000, clickcount: 30 },
    { id: "orijen-original-6kg", productid: "orijen-original", weight: 6, price: 115000, clickcount: 15 },
  ];

  for (const sku of skus) {
    await prisma.productSKU.upsert({
      where: { id: sku.id },
      update: { ...sku },
      create: { ...sku },
    });
  }
  console.log(`✓ Seeded ${skus.length} SKUs`);

  console.log("\n✅ Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
