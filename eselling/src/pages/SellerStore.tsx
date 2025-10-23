import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  ShoppingCart,
  Package,
} from "lucide-react";
import { apiService, getAssetUrl } from "../services/api";
import type { Product } from "../services/api";
import { useCart } from "../contexts/CartContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

const SellerStore: React.FC = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState<number | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [sellerDetails, setSellerDetails] = useState<any>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });

  // Available categories from products
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  useEffect(() => {
    if (sellerId) {
      fetchSellerProducts();
      fetchSellerDetails();
    }
  }, [sellerId]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const fetchSellerProducts = async () => {
    if (!sellerId) return;

    setLoading(true);
    try {
      const response = await apiService.getProductsBySeller(parseInt(sellerId));
      if (response.success && response.data) {
        const productsData = response.data.data || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);

        // Extract seller info from first product
        if (productsData.length > 0 && productsData[0].seller) {
          setSellerInfo(productsData[0].seller);
        }
      }
    } catch (error) {
      console.error("Failed to fetch seller products:", error);
      showToast("Failed to load seller products", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerDetails = async () => {
    if (!sellerId) return;

    try {
      const response = await apiService.getSellerDetails(parseInt(sellerId));
      if (response.success && response.data) {
        setSellerDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch seller details:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(
        (product) => product.price >= parseFloat(priceRange.min)
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(
        (product) => product.price <= parseFloat(priceRange.max)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "sold":
          return b.sold_count - a.sold_count;
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: number) => {
    setIsAddingToCart(productId);
    try {
      const success = await addToCart(productId, 1);
      if (success) {
        showToast("Added to cart", "success");
      } else {
        showToast("Failed to add to cart", "error");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add to cart", "error");
    } finally {
      setIsAddingToCart(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
    setSortBy("name");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/40 flex items-center justify-center">
        <div className="text-emerald-600">Loading store...</div>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={3000}
      />

      <div className="min-h-screen bg-emerald-50/40">
        {/* Seller Banner Section */}
        {sellerDetails?.banner_url && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={getAssetUrl(sellerDetails.banner_url)}
              alt={`${sellerDetails.shop_name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Seller Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end space-x-4">
                  {/* Seller Logo */}
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    {sellerDetails.logo_url ? (
                      <img
                        src={getAssetUrl(sellerDetails.logo_url)}
                        alt={`${sellerDetails.shop_name} logo`}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        sellerDetails.logo_url ? "hidden" : ""
                      }`}
                    >
                      <span className="text-emerald-600 text-xl font-bold">
                        {sellerDetails.shop_name?.charAt(0) || "S"}
                      </span>
                    </div>
                  </div>

                  {/* Seller Details */}
                  <div className="text-white">
                    <h1 className="text-3xl font-bold mb-2">
                      {sellerDetails.shop_name || "Seller Store"}
                    </h1>
                    {sellerDetails.description && (
                      <p className="text-lg opacity-90 mb-2 line-clamp-2">
                        {sellerDetails.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm opacity-80">
                      <span>{filteredProducts.length} products</span>
                      <span>•</span>
                      <span className="capitalize">
                        {sellerDetails.verification_status}
                      </span>
                      {sellerDetails.rating_count > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            ⭐ {sellerDetails.rating_average} (
                            {sellerDetails.rating_count} reviews)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b border-emerald-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Back button and seller info */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>

                {!sellerDetails?.banner_url && (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                      {sellerDetails?.logo_url ? (
                        <img
                          src={getAssetUrl(sellerDetails.logo_url)}
                          alt={`${sellerDetails.shop_name} logo`}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-white text-sm font-semibold ${
                          sellerDetails?.logo_url ? "hidden" : ""
                        }`}
                      >
                        {sellerDetails?.shop_name?.charAt(0) ||
                          sellerInfo?.shop_name?.charAt(0) ||
                          "S"}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {sellerDetails?.shop_name ||
                          sellerInfo?.shop_name ||
                          "Seller Store"}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {filteredProducts.length} products available
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - View mode toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-emerald-100 text-emerald-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-emerald-100 text-emerald-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-emerald-100 mb-6">
            <div className="p-4 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-emerald-900">
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Search Products
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      placeholder="₱0"
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      placeholder="₱1000"
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="price-low">Price (Low to High)</option>
                    <option value="price-high">Price (High to Low)</option>
                    <option value="sold">Most Sold</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-medium text-emerald-900 mb-2">
                No products found
              </h3>
              <p className="text-emerald-900/70 mb-6">
                {searchTerm ||
                selectedCategory ||
                priceRange.min ||
                priceRange.max
                  ? "Try adjusting your filters to see more products."
                  : "This seller hasn't added any products yet."}
              </p>
              {(searchTerm ||
                selectedCategory ||
                priceRange.min ||
                priceRange.max) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden hover:shadow-md transition-shadow ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Product Image */}
                  <div
                    className={`bg-emerald-100 ${
                      viewMode === "grid"
                        ? "aspect-square"
                        : "w-32 h-32 flex-shrink-0"
                    }`}
                  >
                    {product.main_image_url ? (
                      <img
                        src={getAssetUrl(product.main_image_url)}
                        alt={product.name}
                        className={`w-full h-full object-cover ${
                          viewMode === "list" ? "rounded-l-lg" : ""
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        product.main_image_url ? "hidden" : ""
                      }`}
                    >
                      <span className="text-emerald-700 text-sm">No Image</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <h3 className="font-semibold text-emerald-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {product.category && (
                      <p className="text-xs text-emerald-600 mb-2">
                        {product.category}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-emerald-700">
                        ₱{product.price.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        <span>{product.sold_count} sold</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={
                          isAddingToCart === product.id || product.stock === 0
                        }
                        className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        <span>
                          {isAddingToCart === product.id ? "Adding..." : "Add"}
                        </span>
                      </button>
                    </div>

                    {/* View Product Button */}
                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-full mt-2 px-3 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default SellerStore;
