import { useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/admin.community";
import { bulkDelete, deleteRow, fetchAll } from "../utils/adminData";
import { Button, FormField } from "../components/admin";
import type { UserProfile } from "../utils/userProfiles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 커뮤니티 관리" },
    { name: "description", content: "커뮤니티 게시글 관리" },
  ];
}

type PostRow = {
  id: string;
  category_id: string;
  title: string;
  author_id: string;
  view_count: number;
  created_at: string;
};

export default function AdminCommunity() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selection, setSelection] = useState<string[]>([]);

  async function loadPosts() {
    setLoading(true);
    setError(null);

    const [postsResult, usersResult] = await Promise.all([
      fetchAll<PostRow>("posts", { orderBy: "created_at", ascending: false }),
      fetchAll<UserProfile>("user_profiles"),
    ]);

    if (!postsResult.ok) {
      setError(postsResult.error);
      setPosts([]);
    } else {
      setPosts(postsResult.data);
    }

    if (usersResult.ok) {
      setUsers(usersResult.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.user_id, user.nickname);
    });
    return map;
  }, [users]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === "ALL" || post.category_id === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, searchTerm, selectedCategory]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const categoryLabels: Record<string, string> = {
    CHAT: "수다",
    QUESTION: "질문",
    TIP: "정보",
    REVIEW: "후기",
  };

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const result = await deleteRow("posts", id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelection((prev) => prev.filter((item) => item !== id));
    await loadPosts();
  }

  async function handleBulkDelete() {
    if (!selection.length) return;
    if (!confirm(`선택한 ${selection.length}개 글을 삭제하시겠습니까?`)) return;
    const result = await bulkDelete("posts", selection);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelection([]);
    await loadPosts();
  }

  function toggleSelection(id: string) {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#191F28] mb-2">커뮤니티 관리</h1>
        <p className="text-[#8B95A1]">총 {posts.length}개의 글</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">⚠️ {error}</div>
      )}

      <div className="bg-white rounded-[16px] p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <FormField label="검색">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제목 검색"
                className="admin-input w-full"
              />
            </FormField>
          </div>
          <div>
            <FormField label="카테고리">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="admin-select"
              >
                <option value="ALL">전체</option>
                <option value="CHAT">수다</option>
                <option value="QUESTION">질문</option>
                <option value="TIP">정보</option>
                <option value="REVIEW">후기</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      {selection.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 p-4 bg-white shadow-sm rounded-xl border border-blue-100">
          <span className="text-sm font-medium text-slate-700 px-2">{selection.length}개 선택됨</span>
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            선택 삭제
          </Button>
        </div>
      )}

      <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F2F4F6]">
            <tr>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]"></th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">제목</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">작성자</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">카테고리</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">조회수</th>
              <th className="px-4 py-3 text-left text-[14px] font-bold text-[#4E5968]">작성일</th>
              <th className="px-4 py-3 text-center text-[14px] font-bold text-[#4E5968]">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id} className="border-t border-[#E5E8EB] hover:bg-[#F8F9FA]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selection.includes(post.id)}
                    onChange={() => toggleSelection(post.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[#191F28] line-clamp-1">{post.title}</div>
                </td>
                <td className="px-4 py-3 text-[#4E5968]">
                  {userMap.get(post.author_id) || post.author_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-[12px] font-bold bg-slate-100 text-slate-600">
                    {categoryLabels[post.category_id] || post.category_id}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4E5968]">{post.view_count}</td>
                <td className="px-4 py-3 text-[#4E5968]">{formatDate(post.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <Button variant="danger" size="sm" onClick={() => handleDelete(post.id)}>
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-[#8B95A1]">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
