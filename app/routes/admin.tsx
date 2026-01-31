import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import type { Route } from "./+types/admin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "반려식탁 | 관리자" },
    { name: "description", content: "관리자 대시보드" },
  ];
}

const menuItems = [
  { path: "/admin", label: "대시보드", icon: "📊" },
  { path: "/admin/products", label: "사료 관리", icon: "🍖" },
  { path: "/admin/skus", label: "SKU 관리", icon: "📦" },
  { path: "/admin/breeds", label: "품종 관리", icon: "🐕" },
  { path: "/admin/imports", label: "데이터 입출력", icon: "📥" },
];

function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <NavLink to="/" className="admin-logo">
          <span className="admin-logo-icon">🐾</span>
          <span className="admin-logo-text">반려식탁</span>
        </NavLink>
        <span className="admin-badge">관리자</span>
      </div>
      
      <nav className="admin-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
            {location.pathname === item.path || 
             (item.path !== "/admin" && location.pathname.startsWith(item.path)) ? (
              <span className="admin-nav-indicator" />
            ) : null}
          </NavLink>
        ))}
      </nav>
      
      <div className="admin-sidebar-footer">
        <NavLink to="/" className="admin-nav-item">
          <span className="admin-nav-icon">🏠</span>
          <span className="admin-nav-label">사이트로 돌아가기</span>
        </NavLink>
      </div>
    </aside>
  );
}

function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const currentMenu = menuItems.find(item => 
    item.path === "/admin" 
      ? location.pathname === "/admin"
      : location.pathname.startsWith(item.path)
  );
  
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h1 className="admin-header-title">{currentMenu?.label || "관리자"}</h1>
      </div>
      <div className="admin-header-right">
        {user && (
          <div className="admin-user">
            <span className="admin-user-email">{user.email}</span>
            <button 
              type="button" 
              className="admin-btn-secondary"
              onClick={signOut}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function AdminLayout() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-shell">
        <div className="admin-access-denied">
          <div className="admin-access-icon">🔒</div>
          <h2>로그인이 필요합니다</h2>
          <p>관리자 페이지는 로그인 후 이용할 수 있습니다.</p>
          <NavLink to="/login" className="admin-btn-primary">
            로그인하기
          </NavLink>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-shell">
        <div className="admin-access-denied">
          <div className="admin-access-icon">🚫</div>
          <h2>접근 권한이 없습니다</h2>
          <p>관리자 권한이 필요한 페이지입니다.</p>
          <NavLink to="/" className="admin-btn-secondary">
            홈으로 돌아가기
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
