import { useEffect, useState } from "react";
import { useNavigate, useLoaderData } from "react-router";
import type { Route } from "./+types/community.post.$postId";
import { getPost } from "../utils/community.server";
import { createRow, deleteRow, updateRow } from "../utils/adminData";
import { fetchMyUserProfile } from "../utils/userProfiles";
import { getSupabaseClient } from "../utils/supabase";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "게시글 상세" },
    ];
}

export async function loader({ params }: Route.LoaderArgs) {
    const post = await getPost(params.postId);
    if (!post) {
        throw new Response("Post not found", { status: 404 });
    }
    return { post };
}

export default function PostDetail() {
    const { post } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    type UiComment = {
        id: string;
        author: string;
        content: string;
        createdAt: string;
    };

    type LooseResult = { data: unknown; error: { message: string } | null };
    type LooseQuery = {
        select: (columns?: string) => LooseQuery;
        insert: (values: Record<string, unknown>) => LooseQuery;
        delete: () => LooseQuery;
        eq: (column: string, value: string) => LooseQuery;
        maybeSingle: () => Promise<LooseResult>;
    } & PromiseLike<LooseResult>;
    type LooseClient = { from: (table: string) => LooseQuery };
    type SupabaseClientType = NonNullable<ReturnType<typeof getSupabaseClient>>;

    const initialLikeCount = typeof post.likes === "number" ? post.likes : 0;
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<UiComment[]>(() => {
        const base = Array.isArray(post.comments) ? post.comments : [];
        return base.map((comment) => ({
            id: String(comment.id ?? ""),
            author: String(comment.author ?? "Unknown"),
            content: String(comment.content ?? ""),
            createdAt: String(comment.createdAt ?? new Date().toISOString()),
        }));
    });
    const [postTitle, setPostTitle] = useState(post.title);
    const [postContent, setPostContent] = useState(post.content);
    const [isEditing, setIsEditing] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userNickname, setUserNickname] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [likeLoading, setLikeLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const isOwner = userId === post.author.id;

    useEffect(() => {
        let alive = true;
        const supabase = getSupabaseClient();
        if (!supabase) return;

        async function loadUserState(client: SupabaseClientType) {
            const { data } = await client.auth.getUser();
            if (!data.user || !alive) return;
            setUserId(data.user.id);

            const profile = await fetchMyUserProfile(data.user.id);
            if (alive && profile.data?.nickname) {
                setUserNickname(profile.data.nickname);
            }

            const looseClient = client as unknown as LooseClient;
            const { data: likeData, error } = await looseClient
                .from("post_likes")
                .select("post_id")
                .eq("post_id", post.id)
                .eq("user_id", data.user.id)
                .maybeSingle();

            if (!alive) return;
            if (!error && likeData) {
                setLiked(true);
            }
        }

        loadUserState(supabase);

        return () => {
            alive = false;
        };
    }, [post.id]);

    const toggleLike = async () => {
        if (!userId) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        const client = getSupabaseClient();
        if (!client || likeLoading) return;

        setLikeLoading(true);
        setActionError(null);

        if (liked) {
            const looseClient = client as unknown as LooseClient;
            const { error } = await looseClient
                .from("post_likes")
                .delete()
                .eq("post_id", post.id)
                .eq("user_id", userId);

            if (error) {
                setActionError(error.message ?? "좋아요 취소에 실패했어요.");
                setLikeLoading(false);
                return;
            }

            setLiked(false);
            setLikeCount((count) => Math.max(0, count - 1));
            setLikeLoading(false);
            return;
        }

        const likeResult = await createRow("post_likes", {
            post_id: post.id,
            user_id: userId,
        });

        if (!likeResult.ok) {
            setActionError(likeResult.error ?? "좋아요 등록에 실패했어요.");
            setLikeLoading(false);
            return;
        }

        setLiked(true);
        setLikeCount((count) => count + 1);
        setLikeLoading(false);
    };

    const handleSubmitComment = async () => {
        const trimmed = commentText.trim();
        if (!trimmed) return;
        if (!userId) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        if (commentLoading) return;
        setCommentLoading(true);
        setActionError(null);

        const result = await createRow<{
            id: string;
            content: string;
            created_at: string;
        }>("comments", {
            post_id: post.id,
            author_id: userId,
            content: trimmed,
        });

        if (!result.ok) {
            setActionError(result.error ?? "댓글 등록에 실패했어요.");
            setCommentLoading(false);
            return;
        }

        setComments((prev) => [
            ...prev,
            {
                id: result.data.id,
                author: userNickname ?? "익명",
                content: result.data.content,
                createdAt: result.data.created_at ?? new Date().toISOString(),
            },
        ]);
        setCommentText("");
        setCommentLoading(false);
    };

    const handleDeletePost = async () => {
        if (!isOwner) return;
        const confirmed = window.confirm("이 글을 삭제할까요?");
        if (!confirmed) return;

        setActionError(null);
        const result = await deleteRow("posts", post.id);
        if (!result.ok) {
            setActionError(result.error ?? "삭제에 실패했어요.");
            return;
        }
        navigate("/community");
    };

    const handleSavePost = async () => {
        if (!isOwner || savingPost) return;
        const trimmedTitle = postTitle.trim();
        const trimmedContent = postContent.trim();
        if (!trimmedTitle || !trimmedContent) {
            setActionError("제목과 내용을 입력해주세요.");
            return;
        }

        setSavingPost(true);
        setActionError(null);

        const result = await updateRow("posts", post.id, {
            title: trimmedTitle,
            content: trimmedContent,
            updated_at: new Date().toISOString(),
        });

        if (!result.ok) {
            setActionError(result.error ?? "수정에 실패했어요.");
            setSavingPost(false);
            return;
        }

        setIsEditing(false);
        setSavingPost(false);
    };

    return (
        <div className="min-h-screen bg-white pb-24 relative">
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
                {/* Header */}
                {/* Header */}
                <header className="px-4 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-20 flex items-center justify-between border-b border-gray-50">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors gap-2 pl-1 pr-4 py-2 rounded-lg hover:bg-gray-50">
                        <span className="text-2xl">←</span>
                        <span className="text-base font-medium">돌아가기</span>
                    </button>
                    <div className="font-bold text-gray-900 truncate flex-1 text-center pr-12 text-lg">
                        {post.categoryId === "QUESTION" ? "질문" :
                            post.categoryId === "TIP" ? "정보" :
                                post.categoryId === "REVIEW" ? "후기" : "수다"}
                    </div>
                    {isOwner ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setPostTitle(postTitle);
                                    setPostContent(postContent);
                                    setIsEditing(true);
                                }}
                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                disabled={isEditing}
                            >
                                수정
                            </button>
                            <button
                                onClick={handleDeletePost}
                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                            >
                                삭제
                            </button>
                        </div>
                    ) : (
                        <button className="text-gray-400 p-2 hover:bg-gray-50 rounded-full text-xl">⋮</button>
                    )}
                </header>

                {/* Content */}
                <article className="px-5 py-4">
                    {/* Author & Pet */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div>
                            <div className="font-bold text-gray-900 text-[15px]">{post.author.nickname}</div>
                            {post.pet && (
                                <div className="text-xs text-blue-500 bg-blue-50 px-1.5 rounded inline-block mt-0.5">
                                    {post.pet.breed_name} 키우는 중
                                </div>
                            )}
                        </div>
                        <div className="ml-auto text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Body */}
                    {isEditing ? (
                        <div className="space-y-4 mb-6">
                            <input
                                value={postTitle}
                                onChange={(event) => setPostTitle(event.target.value)}
                                className="w-full text-[20px] font-bold text-gray-900 outline-none border-b border-gray-200 pb-2"
                                placeholder="제목"
                            />
                            <textarea
                                value={postContent}
                                onChange={(event) => setPostContent(event.target.value)}
                                className="w-full min-h-[140px] text-[16px] text-gray-800 leading-relaxed outline-none border border-gray-200 rounded-2xl p-4"
                                placeholder="내용"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setPostTitle(post.title);
                                        setPostContent(post.content);
                                        setIsEditing(false);
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSavePost}
                                    disabled={savingPost}
                                    className="flex-1 py-3 rounded-xl bg-[#3182F6] text-white font-bold disabled:bg-blue-200"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-[20px] font-bold text-gray-900 mb-3 leading-snug">{postTitle}</h2>
                            <p className="text-[16px] text-gray-800 leading-relaxed whitespace-pre-line mb-8 min-h-[60px]">
                                {postContent}
                            </p>
                        </>
                    )}

                    {/* Stats */}
                    <div className="flex items-center text-xs text-gray-400 gap-3 border-b border-gray-100 pb-4">
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {likeCount}</span>
                        <span>댓글 {comments.length}</span>
                    </div>
                </article>

                {/* Action Buttons (Like) */}
                <div className="px-5 flex gap-4 mb-6">
                    <button
                        onClick={toggleLike}
                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-[15px] ${liked
                            ? "bg-rose-50 text-rose-500"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <span className="text-xl">{liked ? "♥" : "♡"}</span>
                        <span>도움돼요</span>
                    </button>
                    <button className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center gap-2 active:scale-95 text-[15px]">
                        <span className="text-lg">🔗</span>
                        <span>공유하기</span>
                    </button>
                </div>

                {/* Comments Section */}
                <div className="bg-gray-50 min-h-[200px] px-5 py-6 pb-24">
                    <h3 className="font-bold text-gray-900 mb-4">댓글 {comments.length}</h3>

                    {comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm">{comment.author}</span>
                                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            아직 댓글이 없어요.<br />
                            첫 번째 댓글을 남겨보세요!
                        </div>
                    )}
                </div>

                {/* Comment Input (Fixed Bottom) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 max-w-md mx-auto z-30">
                    {actionError && (
                        <div className="mb-3 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-2">
                            ⚠️ {actionError}
                        </div>
                    )}
                    <div className="flex gap-3 items-center">
                        <input
                            type="text"
                            className="flex-1 bg-gray-100 rounded-full px-5 py-3.5 text-base outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                            placeholder="따뜻한 댓글을 남겨주세요"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                        />
                        <button
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-xl ${commentText ? "bg-[#3182F6] text-white hover:bg-[#2B76D9]" : "bg-gray-200 text-gray-400"
                                }`}
                            disabled={!commentText || commentLoading}
                            onClick={handleSubmitComment}
                        >
                            ↑
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
