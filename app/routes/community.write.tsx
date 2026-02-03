import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/community.write";
import { createRow } from "../utils/adminData";
import { fetchPetProfiles, type DbPetProfile } from "../utils/petProfiles";
import { getSupabaseClient } from "../utils/supabase";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "글쓰기 | 멍냥커뮤" },
    ];
}

export default function CommunityWrite() {
    const navigate = useNavigate();
    const [category, setCategory] = useState("CHAT");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [pets, setPets] = useState<DbPetProfile[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        const client = getSupabaseClient();

        async function loadPets() {
            if (!client) {
                if (alive) {
                    setError("Supabase 설정이 없어 글을 작성할 수 없어요.");
                    setLoading(false);
                }
                return;
            }

            const { data, error: authError } = await client.auth.getUser();
            if (authError || !data.user) {
                if (alive) {
                    setError("로그인이 필요합니다.");
                    setLoading(false);
                }
                return;
            }

            if (!alive) return;
            setUserId(data.user.id);

            try {
                const profiles = await fetchPetProfiles(data.user.id);
                if (!alive) return;
                setPets(profiles);
                setSelectedPetId(profiles[0]?.id ?? null);
                setLoading(false);
            } catch (fetchError) {
                if (!alive) return;
                setError(fetchError instanceof Error ? fetchError.message : "펫 정보를 불러오지 못했어요.");
                setLoading(false);
            }
        }

        loadPets();

        return () => {
            alive = false;
        };
    }, []);

    const categories = [
        { id: "CHAT", label: "수다" },
        { id: "QUESTION", label: "질문" },
        { id: "TIP", label: "정보" },
        { id: "REVIEW", label: "후기" },
    ];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;

        const client = getSupabaseClient();
        if (!client || !userId) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await createRow<{ id: string }>("posts", {
            title,
            content,
            category_id: category,
            author_id: userId,
            pet_id: selectedPetId,
        });

        if (!result.ok) {
            setError(result.error ?? "게시글 등록에 실패했어요.");
            setSubmitting(false);
            return;
        }

        navigate(`/community/post/${result.data.id}`);
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="max-w-md mx-auto min-h-screen flex flex-col">
                {/* Header */}
                <header className="px-5 py-5 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                    <button onClick={() => navigate(-1)} className="text-gray-500 text-2xl p-2 hover:bg-gray-50 rounded-full -ml-2">
                        ✕
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">글쓰기</h1>
                    <button
                        type="submit"
                        form="write-form"
                        className="text-[#3182F6] font-bold text-[17px] px-3 py-1 hover:bg-blue-50 rounded-lg disabled:text-gray-300 transition-colors"
                        disabled={!title || !content || submitting || loading}
                    >
                        완료
                    </button>
                </header>

                <form id="write-form" onSubmit={handleSubmit} className="px-5 py-6 flex flex-col gap-6 flex-1">
                    {error && (
                        <div className="rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Pet Context Selector */}
                    <section>
                        <label className="block text-sm font-bold text-gray-500 mb-3">어떤 아이의 이야기인가요?</label>
                        {loading ? (
                            <div className="text-sm text-gray-400">펫 정보를 불러오는 중...</div>
                        ) : pets.length > 0 ? (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {pets.map((pet) => (
                                    <button
                                        key={pet.id}
                                        type="button"
                                        onClick={() => setSelectedPetId(pet.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${selectedPetId === pet.id
                                            ? "border-[#3182F6] bg-blue-50 text-[#3182F6]"
                                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                        <span className="text-base font-semibold">{pet.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400">등록된 반려동물이 없습니다.</div>
                        )}
                    </section>

                    {/* Category Selector */}
                    <section>
                        <label className="block text-sm font-bold text-gray-500 mb-3">주제</label>
                        <div className="flex flex-wrap gap-2.5">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all ${category === cat.id
                                        ? "bg-gray-800 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-lg font-bold placeholder-gray-300 outline-none"
                        />
                        <textarea
                            placeholder="내용을 입력하세요 (예: 사료 추천해주세요, 오늘 산책 다녀왔어요 등)"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full h-40 text-[16px] leading-relaxed placeholder-gray-300 outline-none resize-none"
                        />
                    </div>

                    {/* Image Upload Placeholder */}
                    <div className="mt-auto pt-5 border-t border-gray-50">
                        <button type="button" className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-50">
                            <span className="text-xl">📷</span>
                            <span className="text-base">사진 추가</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
