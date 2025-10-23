import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, Package } from "lucide-react";
import { getAssetUrl } from "../services/api";
import Button from "./Button";
import Modal from "./Modal";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  sold: number;
  seller: string;
  imageUrl: string;
  description?: string;
  category?: string;
  stock?: number;
  onCartAction?: () => void;
  onViewAction?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  sold,
  seller,
  imageUrl,
  description,
  category,
  stock,
  onCartAction,
  onViewAction,
}) => {
  const navigate = useNavigate();
  const [showQuickView, setShowQuickView] = useState(false);

  const handleCardClick = () => {
    // Navigate to product page with product ID
    const currentPath = window.location.pathname;
    if (
      currentPath.includes("/dashboard") ||
      currentPath.includes("/my-account") ||
      currentPath.includes("/my-purchases")
    ) {
      navigate(`/logged-in-product/${id}`);
    } else {
      navigate(`/product/${id}`);
    }
  };

  const handleCartAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCartAction) {
      onCartAction();
    }
  };

  const handleViewAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickView(true);
    if (onViewAction) {
      onViewAction();
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 overflow-hidden group cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden">
          {imageUrl ? (
            <img
              src={getAssetUrl(imageUrl)}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 flex items-center justify-center ${
              imageUrl ? "hidden" : ""
            }`}
          >
            <Package className="h-8 w-8 text-stone-400" />
          </div>

          {/* Sold Badge */}
          {sold > 0 && (
            <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {sold} sold
            </div>
          )}

          {/* Quick View Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAction}
              className="bg-white/90 hover:bg-white text-stone-700 border-stone-300"
            >
              <Eye className="h-4 w-4 mr-1" />
              Quick View
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-stone-800 mb-2 line-clamp-2 hover:text-amber-600 transition-colors duration-200 text-sm leading-tight">
            {name}
          </h3>

          {/* Price */}
          <div className="text-lg font-bold text-stone-900 mb-2">
            ₱{price.toLocaleString()}
          </div>

          {/* Seller */}
          <div className="text-sm text-stone-500 mb-4">
            by <span className="font-medium text-stone-600">{seller}</span>
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCartAction}
            className="w-full"
            leftIcon={<ShoppingCart className="h-4 w-4" />}
          >
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Quick View Modal */}
      <Modal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        title="Quick View"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square">
            {imageUrl ? (
              <img
                src={getAssetUrl(imageUrl)}
                alt={name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 flex items-center justify-center rounded-lg ${
                imageUrl ? "hidden" : ""
              }`}
            >
              <Package className="h-16 w-16 text-stone-400" />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">{name}</h3>
              <div className="text-3xl font-bold text-amber-600 mb-2">
                ₱{price.toLocaleString()}
              </div>
              <p className="text-stone-600">by {seller}</p>
            </div>

            {category && (
              <div>
                <h4 className="font-semibold text-stone-700 mb-1">Category:</h4>
                <p className="text-stone-600">{category}</p>
              </div>
            )}

            {stock !== undefined && (
              <div>
                <h4 className="font-semibold text-stone-700 mb-1">Stock:</h4>
                <p className="text-stone-600">{stock} available</p>
              </div>
            )}

            {sold > 0 && (
              <div>
                <h4 className="font-semibold text-stone-700 mb-1">Sold:</h4>
                <p className="text-stone-600">{sold.toLocaleString()} units</p>
              </div>
            )}

            {description && (
              <div>
                <h4 className="font-semibold text-stone-700 mb-2">
                  Description:
                </h4>
                <p className="text-stone-600 text-sm leading-relaxed line-clamp-4">
                  {description}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  handleCartAction({
                    stopPropagation: () => {},
                  } as React.MouseEvent);
                  setShowQuickView(false);
                }}
                className="flex-1"
                leftIcon={<ShoppingCart className="h-4 w-4" />}
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuickView(false);
                  handleCardClick();
                }}
                className="flex-1"
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;
