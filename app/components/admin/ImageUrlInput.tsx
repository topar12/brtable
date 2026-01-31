import { useState } from "react";
import { FormField } from "./FormField";

interface ImageUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function ImageUrlInput({
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  label = "이미지 URL",
  required,
}: ImageUrlInputProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasValue = value.trim().length > 0;

  function handleImageLoad() {
    setLoading(false);
    setError(false);
  }

  function handleImageError() {
    setLoading(false);
    setError(true);
  }

  function handleImageLoadStart() {
    if (hasValue) {
      setLoading(true);
      setError(false);
    }
  }

  return (
    <FormField label={label} required={required}>
      <div className="space-y-3">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleImageLoadStart();
          }}
          placeholder={placeholder}
          className="admin-input"
        />

        <div className="relative w-full h-48 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
          {!hasValue ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <svg
                className="w-12 h-12 mb-2"
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
              <span className="text-sm">이미지 URL을 입력하세요</span>
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm">이미지를 불러올 수 없습니다</span>
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
      </div>
    </FormField>
  );
}
