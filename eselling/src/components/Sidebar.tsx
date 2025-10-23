import React from "react";
import { Filter, TrendingUp, Clock, DollarSign, X } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  // Controlled filter values
  sortBy?: string; // "latest" | "top-sales" | "price" | ""
  minPrice?: string;
  maxPrice?: string;
  // Callbacks
  onChangeSortBy?: (value: string) => void;
  onChangeMinPrice?: (value: string) => void;
  onChangeMaxPrice?: (value: string) => void;
  onClear?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  className = "",
  sortBy = "",
  minPrice = "",
  maxPrice = "",
  onChangeSortBy,
  onChangeMinPrice,
  onChangeMaxPrice,
  onClear,
}) => {
  const sidebarContent = (
    <div className="p-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-stone-800">Filters</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Product Type Filter removed per requirements */}

      {/* Divider */}
      <hr className="my-6 border-stone-200" />

      {/* Sorting Options */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3">Sort By</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sort"
              value="latest"
              checked={sortBy === "latest"}
              onChange={(e) =>
                onChangeSortBy?.(
                  sortBy === e.target.value ? "" : e.target.value
                )
              }
              onClick={(e) => {
                const value = (e.target as HTMLInputElement).value;
                if (sortBy === value) onChangeSortBy?.("");
              }}
              className="border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-stone-600">Latest</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sort"
              value="top-sales"
              checked={sortBy === "top-sales"}
              onChange={(e) =>
                onChangeSortBy?.(
                  sortBy === e.target.value ? "" : e.target.value
                )
              }
              onClick={(e) => {
                const value = (e.target as HTMLInputElement).value;
                if (sortBy === value) onChangeSortBy?.("");
              }}
              className="border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-stone-600">Top Sales</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sort"
              value="price"
              checked={sortBy === "price"}
              onChange={(e) =>
                onChangeSortBy?.(
                  sortBy === e.target.value ? "" : e.target.value
                )
              }
              onClick={(e) => {
                const value = (e.target as HTMLInputElement).value;
                if (sortBy === value) onChangeSortBy?.("");
              }}
              className="border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <DollarSign className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-stone-600">Price</span>
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          Price Range (₱)
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Minimum</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => onChangeMinPrice?.(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Maximum</label>
            <input
              type="number"
              placeholder="10000"
              value={maxPrice}
              onChange={(e) => onChangeMaxPrice?.(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      <button
        className="w-full px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
        onClick={onClear}
      >
        Clear All Filters
      </button>
    </div>
  );

  // If sidebar is always open (desktop), render normally
  if (!onClose) {
    return (
      <div
        className={`w-64 bg-white shadow-sm border-r border-stone-200 min-h-full overflow-y-auto ${className}`}
      >
        {sidebarContent}
      </div>
    );
  }

  // If sidebar can be closed (mobile), render as overlay
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:shadow-sm lg:border-r lg:border-stone-200 lg:h-screen lg:overflow-y-auto
        ${className}
      `}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
