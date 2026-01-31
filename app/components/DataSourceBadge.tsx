type DataSource = "supabase" | "mock";

type DataSourceBadgeProps = {
  source: DataSource;
  loading?: boolean;
  error?: string | null;
  small?: boolean;
};

export default function DataSourceBadge({
  loading = false,
  small = false,
}: DataSourceBadgeProps) {
  const className = small
    ? "px-2.5 py-1 text-[11px] font-medium rounded-full inline-flex items-center justify-center transition-colors duration-200"
    : "px-4 py-2 text-[13px] font-medium rounded-full inline-flex items-center justify-center transition-colors duration-200";

  if (loading) {
    return <span className={`${className} bg-gray-100 text-gray-500`}>데이터 불러오는 중</span>;
  }

  return null;
}
