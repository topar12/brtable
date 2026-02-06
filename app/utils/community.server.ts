import { getServerSupabaseClient } from "./supabase-ssr";

export type PostCategory = "QUESTION" | "TIP" | "REVIEW" | "CHAT";

type PostListItem = {
    id: string;
    title: string;
    content: string;
    categoryId: PostCategory;
    createdAt: string;
    viewCount: number;
    author: { id: string; user_id: string; nickname: string };
    pet: { breed_name: string; image_url: string | null } | null;
    _count: { comments: number; likes: number };
};

type PostDetailItem = {
    id: string;
    title: string;
    content: string;
    categoryId: PostCategory;
    createdAt: string;
    viewCount: number;
    author: { id: string; user_id: string; nickname: string };
    pet: { breed_name: string; image_url: string | null } | null;
    comments: { id: string; author: string; content: string; createdAt: string }[];
    likes: number;
};

export async function getPosts(
    categoryId?: string,
    query?: string,
    sorting: "latest" | "popular" = "latest",
    timeRange?: "day" | "week",
): Promise<PostListItem[]> {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
        console.error("Supabase client not configured");
        return [];
    }

    try {
        // First, fetch posts only (no joins)
        let postsQuery = supabase
            .from("posts")
            .select("id, title, content, category_id, created_at, view_count, author_id, pet_id");

        // Category filter
        if (categoryId) {
            postsQuery = postsQuery.eq("category_id", categoryId);
        }

        // Search query  
        if (query) {
            postsQuery = postsQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
        }

        // Time range filter
        if (timeRange) {
            const now = new Date();
            const past = new Date();
            if (timeRange === "day") past.setDate(now.getDate() - 1);
            if (timeRange === "week") past.setDate(now.getDate() - 7);
            postsQuery = postsQuery.gte("created_at", past.toISOString());
        }

        postsQuery = postsQuery.order("created_at", { ascending: false });

        const { data: posts, error } = await postsQuery;

        if (error) {
            console.error("Failed to fetch posts:", error);
            return [];
        }

        if (!posts || posts.length === 0) return [];

        // Fetch authors separately
        const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
        const { data: authors } = await supabase
            .from("user_profiles")
            .select("user_id, id, nickname")
            .in("user_id", authorIds);

        const authorMap = new Map((authors ?? []).map((a: any) => [a.user_id, a]));

        // Fetch pets separately
        const petIds = [...new Set(posts.map((p: any) => p.pet_id).filter(Boolean))];
        let petMap = new Map();
        if (petIds.length > 0) {
            const { data: pets } = await supabase
                .from("pet_profiles")
                .select("id, breed_name, image_url")
                .in("id", petIds);
            petMap = new Map((pets ?? []).map((p: any) => [p.id, p]));
        }

        // Fetch comment counts
        const postIds = posts.map((p: any) => p.id);
        const { data: commentCounts } = await supabase
            .from("comments")
            .select("post_id")
            .in("post_id", postIds);

        const { data: likeCounts } = await supabase
            .from("post_likes")
            .select("post_id")
            .in("post_id", postIds);

        const commentCountMap = new Map<string, number>();
        const likeCountMap = new Map<string, number>();

        (commentCounts ?? []).forEach((c: any) => {
            commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1);
        });

        (likeCounts ?? []).forEach((l: any) => {
            likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
        });

        let result = posts.map((post: any) => {
            const author = authorMap.get(post.author_id);
            const pet = post.pet_id ? petMap.get(post.pet_id) : null;
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                categoryId: post.category_id as PostCategory,
                createdAt: post.created_at,
                viewCount: post.view_count ?? 0,
                author: author ? { id: author.id, user_id: author.user_id, nickname: author.nickname } : { id: "", user_id: "", nickname: "Unknown" },
                pet: pet ? { breed_name: pet.breed_name, image_url: pet.image_url } : null,
                _count: {
                    comments: commentCountMap.get(post.id) ?? 0,
                    likes: likeCountMap.get(post.id) ?? 0,
                },
            };
        });

        // Sort by popularity if requested
        if (sorting === "popular") {
            result = result.sort((a: any, b: any) => b._count.likes - a._count.likes);
        }

        return result;
    } catch (error) {
        console.error("Failed to fetch posts from DB:", error);
        return [];
    }
}

export async function getPost(postId: string): Promise<PostDetailItem | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
        console.error("Supabase client not configured");
        return null;
    }

    try {
        // Fetch post
        const { data: post, error: postError } = await supabase
            .from("posts")
            .select("id, title, content, category_id, created_at, view_count, author_id, pet_id")
            .eq("id", postId)
            .maybeSingle();

        if (postError || !post) {
            console.error("Failed to fetch post:", postError);
            return null;
        }

        // Fetch author
        const { data: author } = await supabase
            .from("user_profiles")
            .select("id, user_id, nickname")
            .eq("user_id", post.author_id)
            .maybeSingle();

        // Fetch pet if exists
        let pet = null;
        if (post.pet_id) {
            const { data: petData } = await supabase
                .from("pet_profiles")
                .select("breed_name, image_url")
                .eq("id", post.pet_id)
                .maybeSingle();
            pet = petData;
        }

        // Fetch comments
        const { data: comments } = await supabase
            .from("comments")
            .select("id, content, created_at, author_id")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        // Fetch comment author nicknames
        const commentAuthorIds = [...new Set((comments ?? []).map((c: any) => c.author_id).filter(Boolean))];
        let commentAuthorMap = new Map();
        if (commentAuthorIds.length > 0) {
            const { data: commentAuthors } = await supabase
                .from("user_profiles")
                .select("user_id, nickname")
                .in("user_id", commentAuthorIds);
            commentAuthorMap = new Map((commentAuthors ?? []).map((a: any) => [a.user_id, a.nickname]));
        }

        // Fetch like count
        const { count: likeCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

        return {
            id: post.id,
            title: post.title,
            content: post.content,
            categoryId: post.category_id as PostCategory,
            createdAt: post.created_at,
            viewCount: post.view_count ?? 0,
            author: author ? { id: author.id, user_id: author.user_id, nickname: author.nickname } : { id: "", user_id: "", nickname: "Unknown" },
            pet: pet ? { breed_name: pet.breed_name, image_url: pet.image_url } : null,
            comments: (comments ?? []).map((c: any) => ({
                id: c.id,
                author: commentAuthorMap.get(c.author_id) ?? "Unknown",
                content: c.content,
                createdAt: c.created_at,
            })),
            likes: likeCount ?? 0,
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
    const supabase = getServerSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client not configured");
    }

    const { data: post, error } = await supabase
        .from("posts")
        .insert({
            title: data.title,
            content: data.content,
            category_id: data.categoryId,
            author_id: data.authorId,
            pet_id: data.petId ?? null,
            images: [],
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create post:", error);
        throw error;
    }

    return post;
}
