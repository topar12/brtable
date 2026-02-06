import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams, useLoaderData, Form, useSubmit } from "react-router";
import type { Route } from "./+types/community";
import { PostCard } from "../components/community/PostCard";
import { getPosts } from "../utils/community.server";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "멍냥커뮤 | 반려식탁" },
        { name: "description", content: "반려인들의 따뜻한 소통 공간" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const query = url.searchParams.get("q");
    const sort = url.searchParams.get("sort") as 'latest' | 'popular' | null;
    const range = url.searchParams.get("range") as 'day' | 'week' | null;

    // Robust data fetching with rollback
    const posts = await getPosts(
        category || undefined,
        query || undefined,
        sort || 'latest',
        range || undefined
    );
    return { posts, category, query, sort, range };
}

export default function Community() {
    const { posts, query, sort, range } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("category") || "ALL";

    // Determine active filter state
    const currentFilter = sort === 'popular' ? (range === 'week' ? 'WEEKLY' : 'TODAY') : 'LATEST';

    const [isSearchOpen, setIsSearchOpen] = useState(!!query);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const categories = [
        { id: "ALL", label: "전체" },
        { id: "CHAT", label: "수다" },
        { id: "QUESTION", label: "질문" },
        { id: "TIP", label: "정보" },
        { id: "REVIEW", label: "후기" },
    ];

    const handleCategoryClick = (catId: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (catId === "ALL") {
            newParams.delete("category");
        } else {
            newParams.set("category", catId);
        }
        setSearchParams(newParams, { preventScrollReset: true });
    };

    const handleFilterClick = (filter: 'LATEST' | 'TODAY' | 'WEEKLY') => {
        const newParams = new URLSearchParams(searchParams);
        if (filter === 'LATEST') {
            newParams.delete("sort");
            newParams.delete("range");
        } else if (filter === 'TODAY') {
            newParams.set("sort", "popular");
            newParams.set("range", "day");
        } else if (filter === 'WEEKLY') {
            newParams.set("sort", "popular");
            newParams.set("range", "week");
        }
        setSearchParams(newParams, { preventScrollReset: true });
    };

    const handleSearchToggle = () => {
        if (isSearchOpen && query) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("q");
            setSearchParams(newParams);
            setIsSearchOpen(false);
        } else if (isSearchOpen) {
            setIsSearchOpen(false);
        } else {
            setIsSearchOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F4F6] pb-24 relative">
            <div className="max-w-md mx-auto min-h-screen flex flex-col bg-[#F2F4F6]">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-[#F2F4F6]/95 backdrop-blur-md pt-5 pb-2 border-b border-gray-200/50">
                    {/* Top Row: Back & Title */}
                    <div className="px-5 flex items-center justify-between mb-4 h-8 relative">
                        <Link to="/" className="inline-flex items-center text-[#8B95A1] hover:text-[#191F28] transition-colors -ml-1 gap-1 py-1 px-2 rounded-lg hover:bg-black/5 z-10">
                            <span className="text-xl">←</span>
                            <span className="text-[15px] font-medium">돌아가기</span>
                        </Link>

                        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <h1 className="text-[18px] font-bold text-[#191F28]">멍냥커뮤</h1>
                        </div>
                        <div className="w-16"></div>
                    </div>

                    {/* Action Row: Search & Write */}
                    <div className="px-5 mb-3">
                        {isSearchOpen ? (
                            <Form
                                className="flex items-center gap-2 animate-fadeIn"
                                role="search"
                            >
                                <div className="flex-1 relative">
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        name="q"
                                        defaultValue={query || ""}
                                        placeholder="검색어를 입력해보세요"
                                        className="w-full bg-white rounded-xl px-4 py-2.5 text-[15px] outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-500 shadow-sm border border-gray-200 placeholder:text-gray-400 transition-all"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        🔍
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSearchToggle}
                                    className="px-3 py-2.5 text-gray-500 font-medium text-[14px] hover:text-gray-800 transition-colors whitespace-nowrap"
                                >
                                    취소
                                </button>
                            </Form>
                        ) : (
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="flex-[1.2] py-2.5 bg-white text-gray-400 text-[14px] font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all shadow-sm border border-gray-200 flex items-center px-4 gap-2"
                                >
                                    <span className="text-base">🔍</span>
                                    <span>관심있는 내용을 검색해보세요</span>
                                </button>
                                <Link
                                    to="/community/write"
                                    className="flex-none py-2.5 px-4 bg-[#3182F6] text-white text-[14px] font-bold rounded-xl hover:bg-[#2B76D9] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <span className="text-base">✏️</span>
                                    <span>글쓰기</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Categories */}
                    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 transition-all ${isSearchOpen ? "opacity-30 pointer-events-none" : ""}`}>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all border first:ml-5 last:mr-5 ${activeTab === cat.id
                                        ? "bg-[#333D4B] border-[#333D4B] text-white shadow-sm"
                                        : "bg-white border-gray-200 text-[#6B7684] hover:bg-gray-50"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Feed */}
                <main className="px-5 py-2 space-y-3">
                    {/* Filter Tabs (Latest / Best) - NEW */}
                    <div className="flex items-center gap-1 mb-2">
                        <button
                            onClick={() => handleFilterClick('LATEST')}
                            className={`text-[13px] font-bold px-2 py-1 rounded transition-colors ${currentFilter === 'LATEST' ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                        >
                            최신순
                        </button>
                        <div className="w-[1px] h-3 bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => handleFilterClick('TODAY')}
                            className={`text-[13px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${currentFilter === 'TODAY' ? "text-[#F04452]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                        >
                            <span>🔥</span>
                            <span>투데이</span>
                        </button>
                        <button
                            onClick={() => handleFilterClick('WEEKLY')}
                            className={`text-[13px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${currentFilter === 'WEEKLY' ? "text-[#3182F6]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                        >
                            <span>🏆</span>
                            <span>위클리</span>
                        </button>
                    </div>

                    {posts.length > 0 ? (
                        posts.map((post: any) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            {query ? (
                                <div className="text-gray-500">
                                    <div className="text-4xl mb-3 opacity-50">🧐</div>
                                    <p className="font-medium text-[15px]">"{query}" 검색 결과가 없어요</p>
                                    <p className="text-[13px] mt-1 text-gray-400">다른 키워드로 검색해보세요</p>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <div className="text-4xl mb-3 opacity-50">📝</div>
                                    <p className="font-medium text-[15px]">
                                        {currentFilter === 'TODAY' ? "오늘의 베스트 글이 없어요" :
                                            currentFilter === 'WEEKLY' ? "이번 주 베스트 글이 없어요" :
                                                "아직 작성된 글이 없어요"}
                                    </p>
                                    <p className="text-[13px] mt-1 text-gray-400">
                                        {currentFilter === 'LATEST' ? "첫 번째 이야기를 들려주세요!" : "지금 바로 글을 써서 베스트에 도전해보세요!"}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!query && (
                        <div className="h-10 text-center flex items-center justify-center text-gray-300 text-xs">
                            마지막 글입니다
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
