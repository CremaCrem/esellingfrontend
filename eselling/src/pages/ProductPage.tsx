import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService, getAssetUrl } from "../services/api";
import type { Product } from "../services/api";
import Footer from "../components/Footer";

const ProductPage: React.FC = () => {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      const response = await apiService.getProduct(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Product images - use main image and additional images if available
  const productImages = product
    ? [product.main_image_url || "", ...(product.images || [])].filter(Boolean)
    : [];

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity((prev) => prev + 1);
    } else if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleAddToCart = async () => {
    // Redirect to login page for non-logged in users
    navigate("/login");
  };

  const handleBuyNow = async () => {
    // Redirect to login page for non-logged in users
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Seller Info Section */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and seller info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-stone-600" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {product.seller?.shop_name?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800">
                    {product.seller?.shop_name || "Unknown Seller"}
                  </h3>
                  <p className="text-sm text-stone-500">Verified Seller</p>
                </div>
              </div>
            </div>

            {/* Right side - Login prompt */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <span>Login to View Shop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Product Images */}
          <div>
            {/* Main Image */}
            <div className="mb-4">
              {productImages.length > 0 && productImages[currentImageIndex] ? (
                <img
                  src={getAssetUrl(productImages[currentImageIndex])}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "";
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center ${
                  productImages.length > 0 && productImages[currentImageIndex]
                    ? "hidden"
                    : ""
                }`}
              >
                <span className="text-stone-700 text-lg">Product Image</span>
              </div>
            </div>

            {/* Image Carousel */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`aspect-square rounded-lg border-2 transition-colors overflow-hidden ${
                      currentImageIndex === index
                        ? "border-amber-500 bg-amber-50"
                        : "border-stone-200 bg-stone-50/40 hover:border-stone-300"
                    }`}
                  >
                    {image ? (
                      <img
                        src={getAssetUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-stone-700">
                          Image {index + 1}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Product Details */}
          <div>
            {/* Product Name */}
            <h1 className="text-2xl font-bold text-stone-800 mb-3">
              {product.name}
            </h1>

            {/* Sold Count */}
            <p className="text-stone-600 mb-4">
              {product.sold_count.toLocaleString()} sold
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-amber-600">
                ₱{product.price.toLocaleString()}
              </span>
            </div>

            {/* Category */}
            {product.category && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  Category:
                </h3>
                <p className="text-stone-600">{product.category}</p>
              </div>
            )}

            {/* Weight */}
            {product.weight && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  Weight:
                </h3>
                <p className="text-stone-600">{product.weight}</p>
              </div>
            )}

            {/* Stock */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-emerald-800 mb-2">
                Stock:
              </h3>
              <p className="text-stone-600">{product.stock} available</p>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-emerald-800 mb-2">
                Quantity:
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(false)}
                  className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Minus className="h-4 w-4 text-stone-600" />
                </button>
                <span className="w-12 text-center text-stone-800 font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(true)}
                  className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Plus className="h-4 w-4 text-stone-600" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-stone-800 mb-4">
              Product Description
            </h2>
            <div className="bg-white p-6 rounded-lg border border-stone-200">
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductPage;
