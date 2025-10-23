import React, { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import Button from "../components/Button";
import Card from "../components/Card";
import Footer from "../components/Footer";
import { apiService } from "../services/api";
import { useCart } from "../contexts/CartContext";
import type { Product } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sortBy: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const productsRes = await apiService.getProducts();

        if (isMounted) {
          if (productsRes.success && productsRes.data) {
            const productsData = productsRes.data.data || [];
            setProducts(productsData);
            setFilteredProducts(productsData);
          }
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query")?.trim() || "";
    if (!q) {
      setFilteredProducts(products);
      return;
    }
    const lower = q.toLowerCase();
    // simple relevance scoring: name hits weigh more, seller and category weigh less
    const ranked = products
      .map((p) => ({
        p,
        score:
          (p.name?.toLowerCase().includes(lower) ? 10 : 0) +
          (p.name?.toLowerCase().startsWith(lower) ? 5 : 0) +
          (p.category?.toLowerCase().includes(lower) ? 2 : 0) +
          ((p.seller?.shop_name || "").toLowerCase().includes(lower) ? 2 : 0),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p);
    setFilteredProducts(ranked);
  }, [location.search, products]);

  // Filter products when filters change
  useEffect(() => {
    let filtered = [...products];

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(
        (product) => product.price >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (product) => product.price <= parseFloat(filters.maxPrice)
      );
    }

    // Sort products
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "top-sales":
        filtered.sort((a, b) => b.sold_count - a.sold_count);
        break;
      case "latest":
      default:
        if (filters.sortBy) {
          filtered.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        }
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await addToCart(productId, 1);
    } catch (e) {
      // no-op: optional toast can be added later
    }
  };

  const handleViewAction = () => {
    // Quick view functionality can be implemented here
    console.log("Quick view clicked");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      sortBy: "",
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <Sidebar
            sortBy={filters.sortBy}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onChangeSortBy={(v) => handleFilterChange("sortBy", v)}
            onChangeMinPrice={(v) => handleFilterChange("minPrice", v)}
            onChangeMaxPrice={(v) => handleFilterChange("maxPrice", v)}
            onClear={clearFilters}
          />
        </div>

        {/* Main Content */}
        <main id="main-content" className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-stone-800 mb-2">
                {user ? `Welcome back, ${user.first_name}!` : "Welcome back!"}
              </h1>
              <p className="text-stone-600">
                Discover amazing products and deals from local sellers
              </p>
            </div>

            {/* Products Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-800">
                  Products ({filteredProducts.length})
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSidebar(true)}
                    leftIcon={<Filter className="h-4 w-4" />}
                  >
                    Filters
                  </Button>
                </div>
              </div>

              {/* Filter Controls */}
              {/* Inline filter controls removed for logged-in users as filters are now in Sidebar */}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-stone-600">Loading products...</div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card variant="outlined" className="text-center py-12">
                  <div className="text-stone-600">
                    {products.length === 0
                      ? "No products available yet."
                      : "No products match your filters."}
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      sold={product.sold_count}
                      seller={product.seller?.shop_name || "Unknown Seller"}
                      imageUrl={product.main_image_url || ""}
                      description={product.description}
                      category={product.category}
                      stock={product.stock}
                      onCartAction={() => handleAddToCart(product.id)}
                      onViewAction={handleViewAction}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <Sidebar
              isOpen={true}
              onClose={() => setShowSidebar(false)}
              sortBy={filters.sortBy}
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onChangeSortBy={(v) => handleFilterChange("sortBy", v)}
              onChangeMinPrice={(v) => handleFilterChange("minPrice", v)}
              onChangeMaxPrice={(v) => handleFilterChange("maxPrice", v)}
              onClear={() => {
                clearFilters();
                setShowSidebar(false);
              }}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
