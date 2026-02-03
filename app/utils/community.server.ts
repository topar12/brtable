import { prisma } from "./prisma.server";
import { type Prisma, type PostCategory } from "@prisma/client";

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
    sorting: "latest" | "popular" = "latest",
    timeRange?: "day" | "week",
) {
    try {
        const where: Prisma.PostWhereInput = {};

        if (categoryId) {
            where.categoryId = categoryId as PostCategory;
        }

        if (query) {
            where.OR = [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
            ];
        }

        // Time Range Filter
        if (timeRange) {
            const now = new Date();
            const past = new Date();
            if (timeRange === "day") past.setDate(now.getDate() - 1);
            if (timeRange === "week") past.setDate(now.getDate() - 7);

            where.createdAt = {
                gte: past,
            };
        }

        // Sorting Logic
        let orderBy:
            | Prisma.PostOrderByWithRelationInput
            | Prisma.PostOrderByWithRelationInput[] = { createdAt: "desc" };

        if (sorting === "popular") {
            // Sort by likes count descending, then newness
            orderBy = [{ likes: { _count: "desc" } }, { createdAt: "desc" }];
        }

        const posts = (await prisma.post.findMany({
            where,
            orderBy,
            include: {
                author: { select: { id: true, nickname: true } },
                pet: { select: { breed_name: true, image_url: true } },
                _count: {
                    select: { comments: true, likes: true },
                },
            },
        })) as PostListItem[];

        return posts.map((post) => ({
            ...post,
            pet: post.pet ? { ...post.pet } : null,
        }));
    } catch (error) {
        console.error("Failed to fetch posts from DB:", error);
        return [];
    }
}

export async function getPost(postId: string) {
    try {
        const post = (await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { id: true, nickname: true } },
                pet: { select: { breed_name: true, image_url: true } },
                comments: {
                    include: { author: { select: { nickname: true } } },
                    orderBy: { createdAt: "asc" },
                },
                _count: { select: { likes: true } },
            },
        })) as PostDetailItem | null;

        if (!post) {
            return null;
        }

        return {
            ...post,
            pet: post.pet ? { ...post.pet } : null,
            comments: post.comments.map((comment: CommentWithAuthor) => ({
                id: comment.id,
                author: comment.author?.nickname || "Unknown",
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
            })),
            likes: post._count.likes,
        };
    } catch (error) {
        console.error("Failed to fetch post from DB:", error);
        return null;
    }
}

export async function createPost(data: {
    title: string;
    content: string;
    categoryId: PostCategory;
    authorId: string;
    petId?: string | null;
}) {
    try {
        return await prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                categoryId: data.categoryId,
                authorId: data.authorId,
                petId: data.petId ?? null,
            },
        });
    } catch (error) {
        console.error("Failed to create post in DB:", error);
        throw error;
    }
}
