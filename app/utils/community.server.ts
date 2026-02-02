import { prisma } from "./prisma.server";
import { type Prisma, type PostCategory } from "@prisma/client";

// Mock Data
const MOCK_POSTS: any[] = [
    // 1. Hot Today (High likes, recent)
    {
        id: "1",
        categoryId: "QUESTION",
        title: "오늘 가입했어요! 다들 반가워요 👋 (Hot Today)",
        content: "3살 말티즈 '초코'랑 같이 살고 있습니다. 잘 부탁드려요!",
        images: [],
        viewCount: 128,
        createdAt: new Date().toISOString(), // Just now
        author: { id: "a1", nickname: "초코맘" },
        pet: { breed: "MALTESE", breed_name: "말티즈", image_url: "" },
        _count: { comments: 5, likes: 45 },
        comments: []
    },
    // 2. High Likes but Yesterday (Should be in Weekly, not Today)
    {
        id: "2",
        categoryId: "TIP",
        title: "강아지 발바닥 습진 관리 꿀팁 공유합니다 (Weekly Best)",
        content: "산책 다녀와서 씻기고 꼭 드라이기로 꼼꼼히 말려주셔야 해요. 제가 쓰는 보습제는...",
        images: ["/placeholder-dog.jpg"],
        viewCount: 350,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago
        author: { id: "a2", nickname: "건강지킴이" },
        pet: { breed: "GOLDEN_RETRIEVER", breed_name: "골든리트리버", image_url: "" },
        _count: { comments: 12, likes: 120 },
        comments: []
    },
    // 3. Moderate Likes, Today
    {
        id: "3",
        categoryId: "CHAT",
        title: "날씨가 너무 춥네요 산책 가도 될까요?",
        content: "영하 10도라는데 옷 입히고 잠깐 나갔다 오는 건 괜찮을까요?",
        images: [],
        viewCount: 45,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        author: { id: "a3", nickname: "산책러" },
        pet: { breed: "POODLE", breed_name: "푸들", image_url: "" },
        _count: { comments: 8, likes: 15 },
        comments: []
    },
    // 4. Old Post (Older than a week)
    {
        id: "4",
        categoryId: "REVIEW",
        title: "지난달에 다녀온 애견 펜션 후기 (Old)",
        content: "가평에 있는 곳인데 수영장이 넓어서 좋았어요.",
        images: [],
        viewCount: 80,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
        author: { id: "a4", nickname: "여행가" },
        pet: null,
        _count: { comments: 2, likes: 5 },
        comments: []
    },
    // 5. Very High Likes, 4 Days ago (Weekly Best Candidate)
    {
        id: "5",
        categoryId: "CHAT",
        title: "우리집 고양이가 츄르를 훔쳐먹었어요 ㅋㅋㅋ",
        content: "잠깐 화장실 다녀온 사이에 식탁 위에 둔 걸...",
        images: [],
        viewCount: 500,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
        author: { id: "a5", nickname: "냥냥펀치" },
        pet: { breed: "KOREAN_SHORT_HAIR", breed_name: "코숏", image_url: "" },
        _count: { comments: 30, likes: 200 },
        comments: []
    },
    // 6. New post, low likes
    {
        id: "6",
        categoryId: "QUESTION",
        title: "사료 추천 좀 해주세요",
        content: "눈물자국 없는 사료 찾고 있어요.",
        images: [],
        viewCount: 10,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
        author: { id: "a6", nickname: "초보집사" },
        pet: { breed: "BICHON", breed_name: "비숑", image_url: "" },
        _count: { comments: 0, likes: 1 },
        comments: []
    },
    // 7. Today's Best Candidate 2
    {
        id: "7",
        categoryId: "CHAT",
        title: "퇴근하고 집에 오니 힐링되네요 (Today Hot)",
        content: "역시 반려동물이 최고입니다. 하루 피로가 싹 가시네요.",
        images: [],
        viewCount: 90,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        author: { id: "a7", nickname: "직장인" },
        pet: { breed: "SHIHTZU", breed_name: "시츄", image_url: "" },
        _count: { comments: 6, likes: 60 },
        comments: []
    }
];

type PostListItem = Prisma.PostGetPayload<{
    include: {
        author: { select: { id: true; nickname: true } };
        pet: { select: { breed_name: true; image_url: true } };
        _count: { select: { comments: true; likes: true } };
    };
}>;

type PostDetailItem = Prisma.PostGetPayload<{
    include: {
        author: { select: { id: true; nickname: true } };
        pet: { select: { breed_name: true; image_url: true } };
        comments: { include: { author: { select: { nickname: true } } } };
        _count: { select: { likes: true } };
    };
}>;

type CommentWithAuthor = Prisma.CommentGetPayload<{
    include: { author: { select: { nickname: true } } };
}>;

export async function getPosts(
    categoryId?: string,
    query?: string,
    sorting: 'latest' | 'popular' = 'latest',
    timeRange?: 'day' | 'week'
) {
    try {
        const where: Prisma.PostWhereInput = {};

        if (categoryId) {
            where.categoryId = categoryId as PostCategory;
        }

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } }
            ];
        }

        // Time Range Filter
        if (timeRange) {
            const now = new Date();
            let past = new Date();
            if (timeRange === 'day') past.setDate(now.getDate() - 1);
            if (timeRange === 'week') past.setDate(now.getDate() - 7);

            where.createdAt = {
                gte: past
            };
        }

        // Sorting Logic
        let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = { createdAt: "desc" };

        if (sorting === 'popular') {
            // Sort by likes count descending, then newness
            orderBy = [
                { likes: { _count: "desc" } },
                { createdAt: "desc" }
            ];
        }

        // Try to fetch from DB
        const posts = await prisma.post.findMany({
            where,
            orderBy,
            include: {
                author: { select: { id: true, nickname: true } },
                pet: { select: { breed_name: true, image_url: true } },
                _count: {
                    select: { comments: true, likes: true }
                }
            }
        }) as PostListItem[];

        return posts.map(p => ({
            ...p,
            pet: p.pet ? { ...p.pet } : null
        }));

    } catch (error) {
        console.error("Failed to fetch posts from DB, using mock data:", error);

        // Fallback to mock
        let filteredMocks = [...MOCK_POSTS];

        // 1. Filter by Category
        if (categoryId) {
            filteredMocks = filteredMocks.filter(p => p.categoryId === categoryId);
        }

        // 2. Filter by Query
        if (query) {
            const lowerQuery = query.toLowerCase();
            filteredMocks = filteredMocks.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.content.toLowerCase().includes(lowerQuery)
            );
        }

        // 3. Filter by Time Range
        if (timeRange) {
            const now = new Date().getTime();
            const oneDay = 24 * 60 * 60 * 1000;
            const oneWeek = 7 * oneDay;

            filteredMocks = filteredMocks.filter(p => {
                const postTime = new Date(p.createdAt).getTime();
                if (timeRange === 'day') return (now - postTime) < oneDay;
                if (timeRange === 'week') return (now - postTime) < oneWeek;
                return true;
            });
        }

        // 4. Sort
        if (sorting === 'popular') {
            filteredMocks.sort((a, b) => {
                const diff = b._count.likes - a._count.likes;
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else {
            // Latest
            filteredMocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return filteredMocks;
    }
}

export async function getPost(postId: string) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { id: true, nickname: true } },
                pet: { select: { breed_name: true, image_url: true } },
                comments: {
                    include: { author: { select: { nickname: true } } }, // User relation
                    orderBy: { createdAt: 'asc' }
                },
                _count: { select: { likes: true } }
            }
        }) as PostDetailItem | null;

        if (!post) {
            // Check mock if not in DB (or if DB failed)
            const mock = MOCK_POSTS.find(p => p.id === postId);
            if (mock) return mock;
            return null;
        }

        return {
            ...post,
            pet: post.pet ? { ...post.pet } : null,
            comments: post.comments.map((c: CommentWithAuthor) => ({
                id: c.id,
                author: c.author?.nickname || "Unknown",
                content: c.content,
                createdAt: c.createdAt.toISOString() // consistent formatting
            })),
            likes: post._count.likes
        };

    } catch (error) {
        console.error("Failed to fetch post from DB:", error);
        const mock = MOCK_POSTS.find(p => p.id === postId);
        return mock || null;
    }
}

export async function createPost(data: any) {
    try {
        return await prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                categoryId: data.categoryId as PostCategory,
                authorId: data.authorId, // In real app comes from auth
                petId: data.petId
            }
        });
    } catch (error) {
        console.error("Failed to create post in DB:", error);
        // Fallback: Just return a mock success object
        return { id: "mock-" + Date.now(), ...data };
    }
}
