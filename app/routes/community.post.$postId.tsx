import { useState } from "react";
import { useParams, useNavigate, useLoaderData } from "react-router";
import type { Route } from "./+types/community.post.$postId";
import { getPost } from "../utils/community.server";

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

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [commentText, setCommentText] = useState("");

    const toggleLike = () => {
        if (liked) {
            setLiked(false);
            setLikeCount(c => c - 1);
        } else {
            setLiked(true);
            setLikeCount(c => c + 1);
        }
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
                    <button className="text-gray-400 p-2 hover:bg-gray-50 rounded-full text-xl">⋮</button>
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
                    <h2 className="text-[20px] font-bold text-gray-900 mb-3 leading-snug">{post.title}</h2>
                    <p className="text-[16px] text-gray-800 leading-relaxed whitespace-pre-line mb-8 min-h-[60px]">
                        {post.content}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center text-xs text-gray-400 gap-3 border-b border-gray-100 pb-4">
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {likeCount}</span>
                        <span>댓글 {post.comments ? post.comments.length : 0}</span>
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
                    <h3 className="font-bold text-gray-900 mb-4">댓글 {post.comments ? post.comments.length : 0}</h3>

                    {post.comments && post.comments.length > 0 ? (
                        <div className="space-y-4">
                            {post.comments.map((comment: any) => (
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
                            disabled={!commentText}
                            onClick={() => {
                                setCommentText("");
                                alert("댓글 기능은 실제 DB 연결 후 활성화됩니다. (현재는 Mock 모드)");
                            }}
                        >
                            ↑
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
