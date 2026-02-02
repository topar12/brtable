import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/auth.callback";
import { getSupabaseClient } from "../utils/supabase";
import { isNewUser } from "../utils/auth";
import { checkProfileExists } from "../utils/userProfiles";

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
    client.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("로그인 세션을 가져오는데 실패했습니다.");
        return;
      }

      if (session) {
        // Already logged in, redirect appropriately
        const user = session.user;
        if (isNewUser(user)) {
          navigate("/welcome");
          return;
        }
        const hasProfile = await checkProfileExists(user.id);
        navigate(hasProfile ? "/" : "/welcome");
        return;
      }

      // Listen for auth state changes
      const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event);
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          const isNew = isNewUser(user);
          if (isNew) {
            navigate("/welcome");
          } else {
            const hasProfile = await checkProfileExists(user.id);
            navigate(hasProfile ? "/" : "/welcome");
          }
        } else if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      });

      // Timeout fallback - if no event after 10 seconds, check session again
      const timeout = setTimeout(async () => {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          const user = session.user;
          const isNew = isNewUser(user);
          if (isNew) {
            navigate("/welcome");
          } else {
            const hasProfile = await checkProfileExists(user.id);
            navigate(hasProfile ? "/" : "/welcome");
          }
        } else {
          setError("로그인 처리 시간이 초과되었습니다. 다시 시도해주세요.");
        }
      }, 10000);

      return () => {
        clearTimeout(timeout);
        listener.subscription.unsubscribe();
      };
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] pb-24">
        <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
              <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#191F28] mb-3">
                로그인 실패
              </h2>
              <p className="text-[15px] text-[#8B95A1] mb-8">
                {error}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-[#3182F6] text-white rounded-[20px] text-[17px] font-bold hover:bg-blue-600 active:scale-[0.98] transition-all"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center w-full">
            <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <h2 className="text-[20px] font-bold text-[#191F28] mb-3">
              로그인 처리 중...
            </h2>
            <p className="text-[15px] text-[#8B95A1]">
              잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
