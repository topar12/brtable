import { useState, useMemo, useEffect } from "react";
import type { Product } from "../data/mock";
import { ProductImage, resolveProductImage } from "./ProductImage";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    products: Product[];
    title?: string;
};

export default function ProductSelectionModal({
    isOpen,
    onClose,
    onSelect,
    products,
    title = "사료 선택",
}: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation state
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // 300ms duration
            document.body.style.overflow = "";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.brand.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [products, searchTerm]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`bg-white w-full max-w-md h-[90vh] sm:h-[600px] sm:rounded-2xl rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-transform duration-300 ease-out transform ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-full opacity-50 scale-95"
                    }`}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#F2F4F6] flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-[18px] font-bold text-[#191F28]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="p-5 pb-2">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A1]">🔍</span>
                        <input
                            type="text"
                            placeholder="브랜드 또는 제품명 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] rounded-[16px] text-[15px] font-bold text-[#191F28] placeholder:text-[#CED4DA] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    onSelect(product);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 p-3 rounded-[20px] hover:bg-[#F2F4F6] transition-colors text-left group"
                            >
                                <div className="w-14 h-14 rounded-xl border border-[#F2F4F6] bg-white p-1 flex items-center justify-center shrink-0">
                                    <ProductImage
                                        src={resolveProductImage(product.image, product.skus[0]?.image)}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] text-[#8B95A1] mb-0.5">{product.brand}</div>
                                    <div className="text-[15px] font-bold text-[#191F28] truncate">{product.name}</div>
                                </div>
                                <div className="text-[13px] font-medium text-[#3182F6] shrink-0 bg-[#E8F3FF] px-2.5 py-1 rounded-lg group-hover:bg-[#D6E6FF] transition-colors">
                                    {Math.round(product.kcalPerKg / 10)} kcal/100g
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-20 text-center text-[#8B95A1]">
                            검색 결과가 없어요 😢
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
