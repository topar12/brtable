import { NavLink } from "react-router";

export default function BottomNavigation() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <NavItem to="/" label="홈" icon={<HomeIcon />} />
                    <NavItem to="/products" label="사료" icon={<SearchIcon />} />
                    <NavItem to="/calculator" label="분석" icon={<ChartIcon />} />
                    <NavItem to="/onboarding" label="전체" icon={<MenuIcon />} />
                </div>
            </div>
        </nav>
    );
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive ? "text-[#3182F6]" : "text-[#B0B8C1] hover:text-[#8B95A1]"
                }`
            }
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}

// Icons (Inline SVG for lightweight usage)
function HomeIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.7071 2.29289C12.3166 1.90237 11.6834 1.90237 11.2929 2.29289L3.29289 10.2929C3.00688 10.5789 2.92134 11.009 3.07612 11.3827C3.2309 11.7564 3.59554 12 4 12H5V20C5 20.5523 5.44772 21 6 21H10V14H14V21H18C18.5523 21 19 20.5523 19 20V12H20C20.4045 12 20.7691 11.7564 20.9239 11.3827C21.0787 11.009 20.9931 10.5789 20.7071 10.2929L12.7071 2.29289Z" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21L16.65 16.65" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3V21H21V19H5V3H3Z" />
            <path d="M19.2929 7.29289C19.6834 6.90237 20.3166 6.90237 20.7071 7.29289C21.0976 7.68342 21.0976 8.31658 20.7071 8.70711L14 15.4142L10 11.4142L7.70711 13.7071C7.31658 14.0976 6.68342 14.0976 6.29289 13.7071C5.90237 13.3166 5.90237 12.6834 6.29289 12.2929L9.29289 9.29289C9.68342 8.90237 10.3166 8.90237 10.7071 9.29289L14.7071 13.2929L20 8L19.2929 7.29289Z" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M3 6C3 5.44772 3.44772 5 4 5H20C20.5523 5 21 5.44772 21 6C21 6.55228 20.5523 7 20 7H4C3.44772 7 3 6.55228 3 6ZM3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12ZM3 18C3 17.4477 3.44772 17 4 17H20C20.5523 17 21 17.4477 21 18C21 18.5523 20.5523 19 20 19H4C3.44772 19 3 18.5523 3 18Z" />
        </svg>
    );
}
