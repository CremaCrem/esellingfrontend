import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiService, getAssetUrl } from "../services/api";
import type { Product, CreateProductData, Order } from "../services/api";
import Footer from "../components/Footer";
import {
  Plus,
  Package,
  Store,
  X,
  Upload,
  Trash2,
  HelpCircle,
  Tag,
  Leaf,
  ShoppingCart,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import Toast from "../components/Toast";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";

const SellerCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [seller, setSeller] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<CreateProductData>({
    seller_id: 0,
    name: "",
    slug: "",
    description: "",
    category: "",
    sku: "",
    price: 0,
    stock: 0,
    weight: "",
    main_image_url: "",
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Order management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");

  // Store settings state
  const [showStoreSettings, setShowStoreSettings] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    shop_name: "",
    slug: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    address_line: "",
    postal_code: "",
  });
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [storeBannerFile, setStoreBannerFile] = useState<File | null>(null);
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);

  // PSU-specific categories (canteen items, school merch & supplies)
  const foodCategories = [
    // Canteen food & drinks
    "Filipino Dishes",
    "Rice Meals",
    "Noodles & Pasta",
    "Snacks (Chips, Bread, Pastries)",
    "Desserts & Sweets",
    "Beverages (Water, Juice, Coffee)",

    // School supplies
    "Notebooks & Pads",
    "Pens, Pencils & Markers",
    "Paper & Bond Paper",
    "Art & Craft Materials",
    "Calculators & Tools",

    // Bags & accessories
    "Bags & Backpacks",
    "Pouches & Cases",

    // Uniforms & apparel
    "School Uniforms",
    "PE Uniform",
    "Intramurals Shirts",
    "Event Apparel",

    // University merchandise
    "Lanyards & ID Holders",
    "Keychains",
    "Pins & Buttons",
    "Stickers & Decals",
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiService.getMySeller();
        if (!mounted) return;
        if (res.success && res.data) {
          setSeller(res.data);
          setIsSeller(true);
          setFormData((prev) => ({ ...prev, seller_id: res.data.id }));
          fetchProducts(res.data.id);
        } else {
          setIsSeller(false);
        }
      } catch (e) {
        setIsSeller(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (seller?.id) {
      fetchProducts(seller.id);
      fetchOrders();
      // Initialize store form data
      setStoreFormData({
        shop_name: seller.shop_name || "",
        slug: seller.slug || "",
        description: seller.description || "",
        contact_email: seller.contact_email || "",
        contact_phone: seller.contact_phone || "",
        region: seller.region || "",
        province: seller.province || "",
        city: seller.city || "",
        barangay: seller.barangay || "",
        address_line: seller.address_line || "",
        postal_code: seller.postal_code || "",
      });
    }
  }, [seller?.id]);

  const fetchProducts = async (sellerId: number) => {
    try {
      const res = await apiService.getProductsBySeller(sellerId);
      if (res.success && res.data) {
        const productsData = res.data.data || [];
        console.log("Fetched products:", productsData);
        console.log(
          "First product image URL:",
          productsData[0]?.main_image_url
        );
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiService.getSellerOrders(
        orderStatusFilter === "all" ? undefined : orderStatusFilter
      );
      if (res.success && res.data) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    if (seller?.id) {
      fetchOrders();
    }
  }, [orderStatusFilter, seller?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));

    // Auto-generate URL-friendly name from product name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (imageFiles.length === 0) {
        showToast("Please upload at least one product photo", "error");
        setIsSubmitting(false);
        return;
      }

      if (!selectedCategory) {
        showToast("Please select a product category", "error");
        setIsSubmitting(false);
        return;
      }

      // Build multipart form
      const form = new FormData();
      form.append("seller_id", String(formData.seller_id));
      form.append("name", formData.name);
      form.append("slug", formData.slug);
      if (formData.description)
        form.append("description", formData.description);
      form.append("category", selectedCategory);
      if (formData.sku) form.append("sku", formData.sku);
      form.append("price", String(formData.price));
      form.append("stock", String(formData.stock));
      if (formData.weight) form.append("weight", formData.weight);

      // Files: first is main_image, rest are images[]
      form.append("main_image", imageFiles[0]);
      imageFiles.slice(1).forEach((file) => form.append("images[]", file));

      const response = await apiService.createProductMultipart(form);
      if (response.success) {
        showToast("Product created successfully!", "success");
        setFormData({
          seller_id: seller.id,
          name: "",
          slug: "",
          description: "",
          category: "",
          sku: "",
          price: 0,
          stock: 0,
          weight: "",
          main_image_url: "",
          images: [],
        });
        setSelectedCategory("");
        setImagePreviews([]);
        setImageFiles([]);
        setShowProductForm(false);
        fetchProducts(seller.id);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to create product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Order management functions
  const handleOrderStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await apiService.updateOrderStatus(orderId, status);
      if (res.success) {
        showToast(`Order status updated to ${status}`, "success");
        fetchOrders();
        setShowStatusModal(false);
        setOrderToUpdate(null);
      } else {
        showToast("Failed to update order status", "error");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status", "error");
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const openStatusModal = (order: Order) => {
    setOrderToUpdate(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "payment_verified":
        return <CheckCircle className="h-4 w-4" />;
      case "ready_for_pickup":
        return <Truck className="h-4 w-4" />;
      case "picked_up":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      case "refunded":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-sky-100 text-sky-800";
      case "payment_verified":
        return "bg-emerald-100 text-emerald-800";
      case "ready_for_pickup":
        return "bg-purple-100 text-purple-800";
      case "picked_up":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter === "all") return true;
    return order.status === orderStatusFilter;
  });

  // Image handling functions
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (newFiles.length === 0) {
      showToast("Please select valid image files", "error");
      return;
    }

    // Create previews
    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files);
  };

  // Store settings functions
  const handleStoreInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setStoreFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from shop name
    if (name === "shop_name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setStoreFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStore(true);

    try {
      const formData = new FormData();

      // Add form fields
      Object.entries(storeFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      // Add files if selected
      if (storeLogoFile) formData.append("logo", storeLogoFile);
      if (storeBannerFile) formData.append("banner", storeBannerFile);

      const response = await apiService.updateSellerMultipart(formData);
      if (response.success) {
        showToast("Store settings updated successfully!", "success");
        setShowStoreSettings(false);
        setStoreLogoFile(null);
        setStoreBannerFile(null);
        // Refresh seller data
        const res = await apiService.getMySeller();
        if (res.success && res.data) {
          setSeller(res.data);
        }
      }
    } catch (error: any) {
      showToast(error.message || "Failed to update store settings", "error");
    } finally {
      setIsUpdatingStore(false);
    }
  };

  // Tooltip component
  const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({
    content,
    children,
  }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="inline-flex items-center"
        >
          {children}
          <HelpCircle className="w-4 h-4 ml-1 text-stone-600 cursor-help" />
        </div>
        {isVisible && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-800">Loading...</div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
            <Store className="w-10 h-10 text-stone-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-800 mb-2">
              Become a Seller
            </h1>
            <p className="text-stone-800/70 mb-4">
              Open your local shop, list products, and reach customers in your
              area.
            </p>
            <ul className="text-left max-w-md mx-auto list-disc list-inside text-stone-800/80 mb-6">
              <li>Simple product management</li>
              <li>Track orders and sales</li>
              <li>Build your shop brand with logo and banner</li>
            </ul>
            <a
              href="/my-account"
              className="inline-block px-5 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Apply as a Seller
            </a>
          </div>
        </div>
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

      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">
                {seller.shop_name}
              </h1>
              <p className="text-stone-800/70">
                Status: {seller.verification_status}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProductForm(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card variant="outlined" className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {products.length}
              </div>
              <div className="text-sm text-stone-600">Products</div>
            </Card>
            <Card variant="outlined" className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-sky-100 rounded-full text-sky-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {orders.length}
              </div>
              <div className="text-sm text-stone-600">Total Orders</div>
            </Card>
            <Card variant="outlined" className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {orders.filter((o) => o.status === "picked_up").length}
              </div>
              <div className="text-sm text-stone-600">Picked Up</div>
            </Card>
            <Card variant="outlined" className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-sky-100 rounded-full text-sky-600">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {
                  orders.filter((o) =>
                    [
                      "pending",
                      "confirmed",
                      "processing",
                      "ready_for_pickup",
                    ].includes(o.status)
                  ).length
                }
              </div>
              <div className="text-sm text-stone-600">Active Orders</div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-stone-200 rounded-lg">
            {/* Tab Navigation */}
            <div className="border-b border-stone-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "products"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-2" />
                  Products ({products.length})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "orders"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 inline mr-2" />
                  Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("store-settings")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "store-settings"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <Store className="h-4 w-4 inline mr-2" />
                  Store Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "products" ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-stone-800">
                      Products
                    </h2>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowProductForm(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Product
                    </Button>
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-stone-600 mb-2">
                        No products yet
                      </h3>
                      <p className="text-stone-500 mb-4">
                        Start by adding your first product to your store.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setShowProductForm(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <Card key={product.id} variant="outlined">
                          <div className="aspect-square bg-stone-100 rounded-lg mb-3 overflow-hidden">
                            {product.main_image_url ? (
                              <img
                                src={getAssetUrl(product.main_image_url)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  console.log(
                                    "Image failed to load:",
                                    getAssetUrl(product.main_image_url)
                                  );
                                  target.style.display = "none";
                                  target.nextElementSibling?.classList.remove(
                                    "hidden"
                                  );
                                }}
                                onLoad={() => {
                                  console.log(
                                    "Image loaded successfully:",
                                    getAssetUrl(product.main_image_url)
                                  );
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full flex items-center justify-center ${
                                product.main_image_url ? "hidden" : ""
                              }`}
                            >
                              <Package className="h-8 w-8 text-stone-400" />
                            </div>
                          </div>
                          <h3 className="font-medium text-stone-800 mb-2">
                            {product.name}
                          </h3>
                          <p className="text-lg font-bold text-stone-800 mb-2">
                            ₱{product.price.toLocaleString()}
                          </p>
                          <div className="flex justify-between text-sm text-stone-600">
                            <span>Stock: {product.stock}</span>
                            <span>Sold: {product.sold_count}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "orders" ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-stone-800">
                      Orders
                    </h2>
                    <div className="flex gap-2">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="ready_for_pickup">
                          Ready for Pickup
                        </option>
                        <option value="picked_up">Picked Up</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-stone-600 mb-2">
                        No orders yet
                      </h3>
                      <p className="text-stone-500">
                        Orders from customers will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <Card key={order.id} variant="outlined">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-stone-800">
                                  Order #{order.order_number}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1 capitalize">
                                    {formatStatusLabel(order.status)}
                                  </span>
                                </span>
                              </div>
                              <div className="text-sm text-stone-600 space-y-1">
                                <p>
                                  Customer:{" "}
                                  {order.user
                                    ? `${order.user.first_name} ${order.user.last_name}`
                                    : "Customer"}
                                </p>
                                <p>
                                  Total: ₱{order.total_amount.toLocaleString()}
                                </p>
                                <p>
                                  Payment:{" "}
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.payment_method === "gcash"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {order.payment_method === "gcash"
                                      ? "GCash"
                                      : "Cash on Pickup"}
                                  </span>
                                </p>
                                {order.payment_method === "gcash" && (
                                  <p>
                                    Payment Status:{" "}
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        order.payment_status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : order.payment_status === "pending"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {order.payment_status}
                                    </span>
                                  </p>
                                )}
                                <p>
                                  Date:{" "}
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openOrderDetails(order)}
                                leftIcon={<Eye className="h-4 w-4" />}
                              >
                                View
                              </Button>
                              {!["cancelled", "refunded", "delivered"].includes(
                                order.status
                              ) && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openStatusModal(order)}
                                >
                                  Update Status
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-stone-800">
                      Store Settings
                    </h2>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowStoreSettings(true)}
                      leftIcon={<Store className="h-4 w-4" />}
                    >
                      Edit Store
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Store Information */}
                    <Card variant="outlined">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-stone-800 mb-4">
                          Store Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Shop Name
                            </label>
                            <p className="text-stone-800">{seller.shop_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Store URL
                            </label>
                            <p className="text-stone-800">{seller.slug}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Description
                            </label>
                            <p className="text-stone-800">
                              {seller.description || "No description provided"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Verification Status
                            </label>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                seller.verification_status === "verified"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {seller.verification_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Store Images */}
                    <Card variant="outlined">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-stone-800 mb-4">
                          Store Images
                        </h3>
                        <div className="space-y-4">
                          {/* Logo */}
                          <div>
                            <label className="text-sm font-medium text-stone-600 mb-2 block">
                              Store Logo
                            </label>
                            <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden">
                              {seller.logo_url ? (
                                <img
                                  src={getAssetUrl(seller.logo_url)}
                                  alt="Store logo"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center ${
                                  seller.logo_url ? "hidden" : ""
                                }`}
                              >
                                <Store className="h-8 w-8 text-stone-400" />
                              </div>
                            </div>
                          </div>

                          {/* Banner */}
                          <div>
                            <label className="text-sm font-medium text-stone-600 mb-2 block">
                              Store Banner
                            </label>
                            <div className="w-full h-32 bg-stone-100 rounded-lg overflow-hidden">
                              {seller.banner_url ? (
                                <img
                                  src={getAssetUrl(seller.banner_url)}
                                  alt="Store banner"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center ${
                                  seller.banner_url ? "hidden" : ""
                                }`}
                              >
                                <Store className="h-12 w-12 text-stone-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Contact Information */}
                    <Card variant="outlined">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-stone-800 mb-4">
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Contact Email
                            </label>
                            <p className="text-stone-800">
                              {seller.contact_email || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Contact Phone
                            </label>
                            <p className="text-stone-800">
                              {seller.contact_phone || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Location Information */}
                    <Card variant="outlined">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-stone-800 mb-4">
                          Location Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Address
                            </label>
                            <p className="text-stone-800">
                              {seller.address_line || "Not provided"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-stone-600">
                                City
                              </label>
                              <p className="text-stone-800">
                                {seller.city || "Not provided"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-stone-600">
                                Province
                              </label>
                              <p className="text-stone-800">
                                {seller.province || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-600">
                              Postal Code
                            </label>
                            <p className="text-stone-800">
                              {seller.postal_code || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowProductForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-800">
                      🌱 Add New Product
                    </h3>
                    {/* <p className="text-sm text-stone-600">
                       List your fresh produce from Partido
                     </p> */}
                  </div>
                </div>
                <button
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200 shadow-sm"
                  onClick={() => setShowProductForm(false)}
                >
                  X{/* <X className="w-4 h-4" /> */}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-stone-600" />
                  <h3 className="text-lg font-semibold text-amber-800">
                    Product Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    <Tooltip content="The name customers will see when browsing your product">
                      Product Name *
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="Fresh Organic Mango from Partido"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    <Tooltip content="This creates a unique web address for your product (auto-generated)">
                      Product Web Address *
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-gray-50 shadow-sm"
                    placeholder="fresh-organic-mango-from-partido"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-800">
                    Pricing & Inventory
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      <Tooltip content="The price you want to sell your product for">
                        Selling Price *
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="150.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      <Tooltip content="How many pieces you have available for sale">
                        Available Quantity *
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-4 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-sky-800">
                    Product Category
                  </h3>
                </div>

                <label className="block text-sm font-medium text-sky-800 mb-2">
                  <Tooltip content="Choose the category that best describes your food/produce item">
                    Select Category *
                  </Tooltip>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {foodCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                        selectedCategory === category
                          ? "bg-sky-600 text-white border-sky-600 shadow-md"
                          : "bg-white text-sky-700 border-sky-300 hover:border-sky-400 hover:bg-sky-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {selectedCategory && (
                  <div className="mt-3 p-2 bg-sky-100 rounded-lg">
                    <p className="text-sm text-sky-800">
                      Selected:{" "}
                      <span className="font-medium">{selectedCategory}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-stone-50 to-gray-50 p-4 rounded-xl border border-stone-100">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-stone-600" />
                  <h3 className="text-lg font-semibold text-stone-800">
                    Additional Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      <Tooltip content="Your internal product code (optional)">
                        Product Code (Optional)
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="MANGO-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      <Tooltip content="Weight or size of your product">
                        Weight/Size (Optional)
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="1kg, 500g, Large"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-stone-800 mb-2">
                    <Tooltip content="Describe your product - its quality, freshness, and why customers should buy it">
                      Product Description (Optional)
                    </Tooltip>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm resize-none"
                    placeholder="Fresh, organic mangoes harvested from our farm in Partido. Sweet and juicy, perfect for eating fresh or making desserts..."
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-4 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-sky-800">
                    Product Photos
                  </h3>
                </div>

                <label className="block text-sm font-medium text-sky-800 mb-3">
                  <Tooltip content="Upload photos of your product - the first photo will be the main image">
                    Add Product Photos *
                  </Tooltip>
                </label>

                {/* Drag and Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isDragOver
                      ? "border-sky-500 bg-sky-50 scale-105"
                      : "border-sky-300 hover:border-sky-400 hover:bg-sky-25"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 left-4 w-8 h-8 border-2 border-sky-300 rounded-full"></div>
                    <div className="absolute top-8 right-6 w-6 h-6 border-2 border-sky-300 rounded-full"></div>
                    <div className="absolute bottom-6 left-8 w-4 h-4 border-2 border-sky-300 rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-10 h-10 border-2 border-sky-300 rounded-full"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-sky-600" />
                    </div>
                    <p className="text-sky-700 font-semibold mb-2 text-lg">
                      📸 Add Your Product Photos
                    </p>
                    <p className="text-sky-600 mb-4">
                      Drag & drop your photos here, or click to browse
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-full hover:from-sky-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium">Choose Photos</span>
                    </div>
                    <p className="text-sky-500 text-xs mt-3">
                      JPG, PNG, GIF • Max 5MB each • First photo will be the
                      main image
                    </p>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="image-upload"
                  />
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-sky-800">
                        📷 Your Photos ({imagePreviews.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <motion.div
                          key={index}
                          className="relative group"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-sky-200 shadow-sm group-hover:shadow-md transition-all duration-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-200 shadow-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                              ⭐ Main Photo
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">* Required fields</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setImagePreviews([]);
                      setImageFiles([]);
                      setFormData({
                        seller_id: seller.id,
                        name: "",
                        slug: "",
                        description: "",
                        category: "",
                        sku: "",
                        price: 0,
                        stock: 0,
                        weight: "",
                        main_image_url: "",
                        images: [],
                      });
                      setSelectedCategory("");
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-medium disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div>
              <h4 className="font-semibold text-stone-800 mb-3">
                Order Summary
              </h4>
              <div className="bg-stone-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Order Number:</span>
                  <span className="font-medium">
                    #{selectedOrder.order_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                {/* Tax and Shipping removed for pickup-only flow */}
                <div className="flex justify-between font-semibold text-stone-800 border-t pt-2">
                  <span>Total:</span>
                  <span>₱{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment Method:</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedOrder.payment_method === "gcash"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedOrder.payment_method === "gcash"
                      ? "GCash"
                      : "Cash on Pickup"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedOrder.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : selectedOrder.payment_status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedOrder.payment_status.toUpperCase()}
                  </span>
                </div>
                {selectedOrder.payment_method === "gcash" &&
                  selectedOrder.payment_status === "pending" && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      <strong>Note:</strong> GCash payments are verified by
                      admin. Order will proceed once payment is confirmed.
                    </div>
                  )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Order Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1 capitalize">
                      {formatStatusLabel(selectedOrder.status)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information removed for pickup-only flow */}

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-stone-800 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={index} className="bg-stone-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <img
                            src={getAssetUrl(item.product_image)}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            item.product_image ? "hidden" : ""
                          }`}
                        >
                          <Package className="h-6 w-6 text-stone-400" />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h5 className="font-medium text-stone-800 mb-1">
                          {item.product_name}
                        </h5>
                        <div className="flex justify-between items-end">
                          <div className="text-sm text-stone-600">
                            <p>Quantity: {item.quantity}</p>
                            <p>Price: ₱{item.price.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-stone-800">
                              ₱{item.total_price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="font-semibold text-stone-800 mb-3">
                  Order Notes
                </h4>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-stone-600">{selectedOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Order Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setOrderToUpdate(null);
        }}
        title="Update Order Status"
        size="md"
      >
        {orderToUpdate && (
          <div className="space-y-6">
            <div className="bg-stone-50 p-4 rounded-lg">
              <p className="text-sm text-stone-600 mb-2">
                Order #{orderToUpdate.order_number}
              </p>
              <p className="font-medium text-stone-800">
                Customer:{" "}
                {orderToUpdate.user
                  ? `${orderToUpdate.user.first_name} ${orderToUpdate.user.last_name}`
                  : "Customer"}
              </p>
              <p className="text-sm text-stone-600">
                Current Status:{" "}
                <span className="capitalize">{orderToUpdate.status}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                Select New Status
              </label>
              <div className="space-y-2">
                {(() => {
                  const isGcashPaid =
                    orderToUpdate.payment_method === "gcash" &&
                    orderToUpdate.payment_status === "paid";
                  const statuses = isGcashPaid
                    ? ["processing", "ready_for_pickup", "picked_up"]
                    : [
                        "pending",
                        "confirmed",
                        "processing",
                        "ready_for_pickup",
                        "picked_up",
                      ];
                  return statuses;
                })().map((status) => (
                  <label
                    key={status}
                    className="flex items-center space-x-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={newStatus === status}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        status
                      )}`}
                    >
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">
                        {formatStatusLabel(status)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setOrderToUpdate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  handleOrderStatusChange(orderToUpdate.id, newStatus)
                }
                disabled={newStatus === orderToUpdate.status}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Store Settings Modal */}
      {showStoreSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowStoreSettings(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-800">
                      🏪 Edit Store Settings
                    </h3>
                    <p className="text-sm text-stone-600">
                      Update your store information and images
                    </p>
                  </div>
                </div>
                <button
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200 shadow-sm"
                  onClick={() => setShowStoreSettings(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStoreUpdate} className="p-6 space-y-6">
              {/* Store Information */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-5 h-5 text-stone-600" />
                  <h3 className="text-lg font-semibold text-amber-800">
                    Store Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      name="shop_name"
                      value={storeFormData.shop_name}
                      onChange={handleStoreInputChange}
                      required
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="My Amazing Store"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      Store URL *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={storeFormData.slug}
                      onChange={handleStoreInputChange}
                      required
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-gray-50 shadow-sm"
                      placeholder="my-amazing-store"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Store Description
                  </label>
                  <textarea
                    name="description"
                    value={storeFormData.description}
                    onChange={handleStoreInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm resize-none"
                    placeholder="Tell customers about your store..."
                  />
                </div>
              </div>

              {/* Store Images */}
              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-4 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-sky-800">
                    Store Images
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sky-800 mb-2">
                      Store Logo
                    </label>
                    <div className="border-2 border-dashed border-sky-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setStoreLogoFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id="store-logo-upload"
                      />
                      <label
                        htmlFor="store-logo-upload"
                        className="cursor-pointer block"
                      >
                        {storeLogoFile ? (
                          <div className="space-y-2">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-green-600">
                              {storeLogoFile.name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center">
                              <Upload className="w-8 h-8 text-sky-400" />
                            </div>
                            <p className="text-sm font-medium text-sky-700">
                              Upload Logo
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sky-800 mb-2">
                      Store Banner
                    </label>
                    <div className="border-2 border-dashed border-sky-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setStoreBannerFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id="store-banner-upload"
                      />
                      <label
                        htmlFor="store-banner-upload"
                        className="cursor-pointer block"
                      >
                        {storeBannerFile ? (
                          <div className="space-y-2">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-green-600">
                              {storeBannerFile.name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center">
                              <Upload className="w-8 h-8 text-sky-400" />
                            </div>
                            <p className="text-sm font-medium text-sky-700">
                              Upload Banner
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-stone-50 to-gray-50 p-4 rounded-xl border border-stone-100">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-stone-600" />
                  <h3 className="text-lg font-semibold text-stone-800">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      value={storeFormData.contact_email}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="contact@mystore.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={storeFormData.contact_phone}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="+63 123 456 7890"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-emerald-800">
                    Location Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Region
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={storeFormData.region}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Region V"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={storeFormData.province}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Camarines Sur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      City/Municipality
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={storeFormData.city}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Naga City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Barangay
                    </label>
                    <input
                      type="text"
                      name="barangay"
                      value={storeFormData.barangay}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Barangay Name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Address Line
                    </label>
                    <input
                      type="text"
                      name="address_line"
                      value={storeFormData.address_line}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={storeFormData.postal_code}
                      onChange={handleStoreInputChange}
                      className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="4400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">* Required fields</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowStoreSettings(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStore}
                    className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl font-medium disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {isUpdatingStore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4" />
                        Update Store
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default SellerCenter;
