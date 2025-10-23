import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Star, Truck, Shield, Heart } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import Button from "../components/Button";
import Card from "../components/Card";
import Footer from "../components/Footer";
import { apiService } from "../services/api";
import type { Product } from "../services/api";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await apiService.getProducts();
        if (isMounted && res.success && res.data) {
          setProducts(res.data.data || []);
        }
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCartAction = () => {
    navigate("/login");
  };

  const handleViewAction = () => {
    // Quick view functionality can be implemented here
    console.log("Quick view clicked");
  };

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Fast Delivery",
      description: "Quick and reliable shipping across the region",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Payment",
      description: "Safe and protected transactions",
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Quality Products",
      description: "Curated selection of fresh, local goods",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main id="main-content" className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="mb-12">
              <Card
                variant="elevated"
                padding="lg"
                className="bg-gradient-to-br from-amber-50 to-sky-50 border-amber-200"
              >
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
                    <Star className="h-4 w-4 mr-2" />
                    Fresh & Cultural • Partido Inspired
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
                    Discover Fresh, Local Products
                  </h1>

                  <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
                    Experience the best of local craftsmanship and fresh
                    produce, curated with care from our community of trusted
                    sellers.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate("/register")}
                      rightIcon={<ArrowRight className="h-5 w-5" />}
                    >
                      Start Shopping
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowSidebar(true)}
                    >
                      Browse Categories
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Features */}
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} variant="outlined" className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-stone-600 text-sm">
                      {feature.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-800">
                  Featured Products
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/register")}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View All
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-stone-600">Loading products...</div>
                </div>
              ) : products.length === 0 ? (
                <Card variant="outlined" className="text-center py-12">
                  <div className="text-stone-600">
                    No products available yet.
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.slice(0, 8).map((product) => (
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
                      onCartAction={handleCartAction}
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
            <Sidebar isOpen={true} onClose={() => setShowSidebar(false)} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Home;
