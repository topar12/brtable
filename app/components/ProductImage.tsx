import { useState } from "react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  variant?: "card" | "detail";
  className?: string;
}

export function ProductImage({
  src,
  alt,
  variant = "card",
  className = "",
}: ProductImageProps) {
  const [error, setError] = useState(false);

  const aspectRatio = variant === "card" ? "aspect-square" : "aspect-[4/3]";
  const sizeClasses =
    variant === "card"
      ? "w-full h-full object-cover"
      : "w-full h-full object-contain";

  if (!src || error) {
    return (
      <div
        className={`${aspectRatio} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-gray-500">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${aspectRatio} overflow-hidden bg-gray-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={sizeClasses}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}

export function resolveProductImage(
  productImage?: string | null,
  skuImage?: string | null
): string | null {
  return productImage || skuImage || "https://placehold.co/100x100/E8F3FF/3182F6?text=Pet+Food";
}
