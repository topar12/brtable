import { Link } from "react-router";

// Helper for relative time (e.g. "2 hours ago")
function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "방금 전";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
}

interface PostCardProps {
    post: {
        id: string;
        title: string;
        content: string;
        images: string[];
        viewCount: number;
        createdAt: string;
        categoryId: string;
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            nickname: string;
            id: string;
        };
        pet?: {
            breed_name: string;
            image_url?: string;
        } | null;
    };
}

export function PostCard({ post }: PostCardProps) {
    const categoryLabels: Record<string, string> = {
        CHAT: "수다",
        QUESTION: "질문",
        TIP: "정보",
        REVIEW: "후기",
    };

    return (
        <Link
            to={`/community/post/${post.id}`}
            className="block bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform border border-gray-100"
        >
            {/* Header: Category & Pet Context */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${post.categoryId === 'QUESTION' ? 'bg-orange-50 text-orange-600' :
                            post.categoryId === 'TIP' ? 'bg-blue-50 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {categoryLabels[post.categoryId] || post.categoryId}
                    </span>

                    {post.pet && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            🐾 {post.pet.breed_name}
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
            </div>

            {/* Content */}
            <div className="mb-3">
                <h3 className="text-[17px] font-bold text-gray-900 leading-tight mb-1 truncate">
                    {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {post.content}
                </p>
            </div>

            {/* Images Preview (if any) */}
            {post.images && post.images.length > 0 && (
                <div className="mb-4 aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                    {/* Placeholder for real image rendering (assuming simple string URL for now) */}
                    <img src={post.images[0]} alt="Post attachment" className="w-full h-full object-cover" />
                    {post.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            +{post.images.length - 1}
                        </div>
                    )}
                </div>
            )}

            {/* Footer: Stats */}
            <div className="flex items-center text-xs text-gray-400 font-medium space-x-4">
                <div className="flex items-center gap-1">
                    <span className="text-gray-600">{post.author.nickname}</span>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1">
                        👁️ {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                        ♥ {post._count.likes}
                    </span>
                    <span className="flex items-center gap-1 text-blue-500">
                        💬 {post._count.comments}
                    </span>
                </div>
            </div>
        </Link>
    );
}
