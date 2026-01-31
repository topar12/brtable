import type { Route } from "./+types/admin._index";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 관리자 대시보드" },
    { name: "description", content: "관리자 대시보드" },
  ];
}

interface Stats {
  products: number;
  skus: number;
  breeds: number;
  loading: boolean;
  error: string | null;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: number | string; 
  icon: string;
  trend?: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-content">
        <span className="admin-stat-title">{title}</span>
        <span className="admin-stat-value">{value}</span>
        {trend && <span className="admin-stat-trend">{trend}</span>}
      </div>
    </div>
  );
}



export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    skus: 0,
    breeds: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      if (!client) {
        setStats(prev => ({ ...prev, loading: false, error: "Supabase not configured" }));
        return;
      }

      try {
        const [productsRes, skusRes, breedsRes] = await Promise.all([
          client.from("Product").select("id", { count: "exact", head: true }),
          client.from("ProductSKU").select("id", { count: "exact", head: true }),
          client.from("dog_breeds").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          products: productsRes.count || 0,
          skus: skusRes.count || 0,
          breeds: breedsRes.count || 0,
          loading: false,
          error: null,
        });
      } catch (err) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: "Failed to fetch stats",
        }));
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <section className="admin-section">
        <div className="admin-section-header">
          <h2>현황</h2>

        </div>
        
        <div className="admin-stats-grid">
          <StatCard
            title="총 사료"
            value={stats.loading ? "-" : stats.products}
            icon="🍖"
            trend="등록된 사료"
          />
          <StatCard
            title="총 SKU"
            value={stats.loading ? "-" : stats.skus}
            icon="📦"
            trend="판매 단위"
          />
          <StatCard
            title="총 품종"
            value={stats.loading ? "-" : stats.breeds}
            icon="🐕"
            trend="등록된 품종"
          />
        </div>
      </section>

      <section className="admin-section">
        <h2>빠른 작업</h2>
        <div className="admin-quick-actions">
          <a href="/admin/products" className="admin-quick-action">
            <span className="admin-quick-action-icon">➕</span>
            <div className="admin-quick-action-content">
              <span className="admin-quick-action-title">새 사료 등록</span>
              <span className="admin-quick-action-desc">브랜드와 영양 정보를 입력하세요</span>
            </div>
          </a>
          
          <a href="/admin/skus" className="admin-quick-action">
            <span className="admin-quick-action-icon">💰</span>
            <div className="admin-quick-action-content">
              <span className="admin-quick-action-title">가격 업데이트</span>
              <span className="admin-quick-action-desc">SKU별 가격을 관리하세요</span>
            </div>
          </a>
          
          <a href="/admin/breeds" className="admin-quick-action">
            <span className="admin-quick-action-icon">🐾</span>
            <div className="admin-quick-action-content">
              <span className="admin-quick-action-title">품종 추가</span>
              <span className="admin-quick-action-desc">새로운 품종을 등록하세요</span>
            </div>
          </a>
          
          <a href="/admin/imports" className="admin-quick-action">
            <span className="admin-quick-action-icon">📤</span>
            <div className="admin-quick-action-content">
              <span className="admin-quick-action-title">데이터 가져오기</span>
              <span className="admin-quick-action-desc">CSV/JSON으로 대량 등록</span>
            </div>
          </a>
        </div>
      </section>

      {stats.error && (
        <section className="admin-section">
          <div className="admin-alert error">
            <span className="admin-alert-icon">⚠️</span>
            <span>{stats.error}</span>
          </div>
        </section>
      )}
    </div>
  );
}
