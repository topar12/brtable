import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { signInWithGoogle } from "../utils/supabase";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 로그인" },
    { name: "description", content: "소셜 로그인으로 시작하세요." },
  ];
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result.error) {
      alert("로그인에 실패했습니다: " + result.error);
    }
  };

  return (
    <div className="container">
      <section className="hero">
        <h2>로그인</h2>
        <p>소셜 계정으로 간편하게 시작하세요.</p>
      </section>

      {error && (
        <section className="card" style={{ backgroundColor: "#fee2e2", borderColor: "#ef4444" }}>
          <p style={{ color: "#dc2626", margin: 0 }}>
            {error === "supabase_not_configured"
              ? "서비스 설정 오류가 발생했습니다. 관리자에게 문의해주세요."
              : "로그인 중 오류가 발생했습니다. 다시 시도해주세요."}
          </p>
        </section>
      )}

      <section className="card">
        <h3>구글로 시작</h3>
        <p>Google 계정으로 로그인</p>
        <button
          type="button"
          className="button"
          onClick={handleGoogleLogin}
        >
          구글 로그인
        </button>
      </section>

      <section className="card">
        <h3>또는 둘러보기</h3>
        <p>로그인 없이 계산기와 사료 목록을 둘러볼 수 있어요.</p>
        <div className="button-row">
          <Link to="/calculator" className="button ghost">
            계산기 체험
          </Link>
          <Link to="/products" className="button ghost">
            사료 목록
          </Link>
        </div>
      </section>
    </div>
  );
}
