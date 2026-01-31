export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPrice(value: number) {
  return `${formatNumber(value)}원`;
}

export function pricePositionLabel(position: number) {
  if (position <= 15) return "최저가 근처";
  if (position <= 35) return "저렴한 편";
  if (position <= 65) return "보통";
  if (position <= 85) return "비싼 편";
  return "최고가 근처";
}
