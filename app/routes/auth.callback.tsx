import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/auth.callback";
import { getSupabaseClient } from "../utils/supabase";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 로그인 처리" },
    { name: "description", content: "소셜 로그인 콜백 처리." },
  ];
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      navigate("/login?error=supabase_not_configured");
      return;
    }

    // Check for existing session first
    client.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("로그인 세션을 가져오는데 실패했습니다.");
        return;
      }

      if (session) {
        // Already logged in, redirect to home
        navigate("/");
        return;
      }

      // Listen for auth state changes
      const { data: listener } = client.auth.onAuthStateChange((event) => {
        console.log("Auth event:", event);
        if (event === "SIGNED_IN") {
          navigate("/");
        } else if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      });

      // Timeout fallback - if no event after 10 seconds, check session again
      const timeout = setTimeout(() => {
        client.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            navigate("/");
          } else {
            setError("로그인 처리 시간이 초과되었습니다. 다시 시도해주세요.");
          }
        });
      }, 10000);

      return () => {
        clearTimeout(timeout);
        listener.subscription.unsubscribe();
      };
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="container">
        <section className="hero">
          <h2>로그인 실패</h2>
          <p>{error}</p>
          <div className="button-row">
            <button onClick={() => navigate("/login")} className="button">
              다시 시도
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="hero">
        <h2>로그인 처리 중...</h2>
        <p>잠시만 기다려 주세요.</p>
      </section>
    </div>
  );
}
