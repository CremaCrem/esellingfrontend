const API_BASE_URL = "http://localhost:8000/api";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: "user" | "seller";
  contact_number?: string | null;
  profile_picture_url?: string | null;
}

export interface Admin {
  id: number;
  email: string;
  user_type: "admin";
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  user?: User;
  admin?: Admin;
  errors?: Record<string, string[]>;
}

export interface CreateSellerData {
  shop_name: string;
  slug: string;
  description?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  id_image_path?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  sku?: string;
  price: number;
  stock: number;
  sold_count: number;
  main_image_url?: string;
  images?: string[];
  weight?: string;
  options?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller?: {
    id: number;
    shop_name: string;
    slug: string;
  };
}

export interface CreateProductData {
  seller_id: number;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  sku?: string;
  price: number;
  stock: number;
  main_image_url?: string;
  images?: string[];
  weight?: string;
  options?: any;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product: Product;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  seller_id: number;
  order_number: string;
  status: string;
  subtotal: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_receipt_url?: string;
  payment_distributed: boolean;
  payment_distributed_at?: string;
  paid_at?: string;
  delivery_confirmed_by_customer: boolean;
  customer_delivery_confirmed_at?: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[]; // Laravel outputs snake_case in JSON
  seller?: any;
  user?: any;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  total_price: number;
  product_name: string;
  product_image?: string;
  product?: Product;
}

export interface Refund {
  id: number;
  order_id: number;
  user_id: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  seller_response?: string;
  requested_at: string;
  responded_at?: string;
  order: Order;
}

export interface GcashSettings {
  gcash_qr_url?: string;
  gcash_number?: string;
}

class ApiService {
  private async getCsrfToken(): Promise<void> {
    try {
      await fetch("http://localhost:8000/sanctum/csrf-cookie", {
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(
      new RegExp("(^|; )" + name + "=([^;]*)")
    );
    return match ? match[2] : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const method = (options.method || "GET").toUpperCase();
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (isWrite) {
      await this.getCsrfToken();
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers as Record<string, string>),
    };

    if (isWrite) {
      const xsrf = this.getCookie("XSRF-TOKEN");
      if (xsrf) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Important for cookies/sessions
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  private async requestMultipart<T>(
    endpoint: string,
    formData: FormData,
    method: string = "POST"
  ): Promise<ApiResponse<T>> {
    await this.getCsrfToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    const xsrf = this.getCookie("XSRF-TOKEN");
    if (xsrf) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    return this.request<User>("/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<ApiResponse<User>> {
    return this.request<User>("/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request("/logout", {
      method: "POST",
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request("/user", {
      method: "DELETE",
    });
  }

  async getUser(): Promise<ApiResponse<User>> {
    return this.request<User>("/user");
  }

  async getMySeller(): Promise<ApiResponse> {
    return this.request("/sellers/me");
  }

  async updateUser(
    data: Partial<Pick<User, "email" | "contact_number">>
  ): Promise<ApiResponse<User>> {
    return this.request<User>("/user", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateUserMultipart(form: FormData): Promise<ApiResponse<User>> {
    // Use POST with _method override to ensure multipart is handled consistently across servers
    form.set("_method", "PUT");
    return this.requestMultipart<User>("/user", form, "POST");
  }

  async createSeller(data: CreateSellerData): Promise<ApiResponse> {
    return this.request("/sellers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createSellerMultipart(form: FormData): Promise<ApiResponse> {
    return this.requestMultipart("/sellers", form, "POST");
  }

  async updateSeller(data: Partial<CreateSellerData>): Promise<ApiResponse> {
    return this.request("/sellers/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateSellerMultipart(form: FormData): Promise<ApiResponse> {
    return this.requestMultipart("/sellers/me", form, "PUT");
  }

  async getSellerDetails(sellerId: number): Promise<ApiResponse> {
    return this.request(`/sellers/${sellerId}`);
  }

  // Admin methods
  async adminLogin(data: LoginData): Promise<ApiResponse<Admin>> {
    return this.request<Admin>("/admin/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async adminLogout(): Promise<ApiResponse> {
    return this.request("/admin/logout", {
      method: "POST",
    });
  }

  async getAdminUser(): Promise<ApiResponse<Admin>> {
    return this.request<Admin>("/admin/user");
  }

  // Admin dashboard endpoints
  async getAdminDashboard(): Promise<ApiResponse<{ stats: any }>> {
    return this.request<{ stats: any }>("/admin/dashboard");
  }

  async getAdminPendingApplications(
    page: number = 1
  ): Promise<ApiResponse<{ data: any[] }>> {
    return this.request<{ data: any[] }>(
      `/admin/pending-applications?page=${page}`
    );
  }

  async adminProcessApplication(
    sellerId: number,
    action: "approve" | "reject"
  ): Promise<ApiResponse> {
    return this.request(`/admin/process-application/${sellerId}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  // Product methods
  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return this.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createProductMultipart(form: FormData): Promise<ApiResponse<Product>> {
    return this.requestMultipart<Product>("/products", form, "POST");
  }

  async getProducts(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ data: Product[] }>> {
    return this.request<{ data: Product[] }>(
      `/products?page=${page}&limit=${limit}`
    );
  }

  async getProductsBySeller(
    sellerId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ data: Product[] }>> {
    return this.request<{ data: Product[] }>(
      `/sellers/${sellerId}/products?page=${page}&limit=${limit}`
    );
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`);
  }

  async updateProduct(
    id: number,
    data: Partial<CreateProductData>
  ): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateProductMultipart(
    id: number,
    form: FormData
  ): Promise<ApiResponse<Product>> {
    return this.requestMultipart<Product>(`/products/${id}`, form, "PUT");
  }

  async deleteProduct(id: number): Promise<ApiResponse> {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  async restoreProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}/restore`, {
      method: "POST",
    });
  }

  // Cart methods
  async getCart(): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>("/cart");
  }

  async addToCart(
    productId: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> {
    return this.request<CartItem>("/cart", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(
    id: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> {
    return this.request<CartItem>(`/cart/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(id: number): Promise<ApiResponse> {
    return this.request(`/cart/${id}`, {
      method: "DELETE",
    });
  }

  async clearCart(): Promise<ApiResponse> {
    return this.request("/cart/clear", {
      method: "POST",
    });
  }

  // Order methods
  // Backward-compatible createOrder: supports old signature with shipping info (ignored by backend now)
  async createOrder(
    items: { product_id: number; quantity: number }[],
    paymentOrShipping:
      | string
      | {
          shipping_name: string;
          shipping_phone: string;
          shipping_address: string;
          shipping_city: string;
          shipping_province: string;
          shipping_postal_code: string;
        },
    paymentMethodOrNotes?: string,
    maybeNotes?: string
  ): Promise<
    ApiResponse<{ orders: Order[]; total_orders: number; message: string }>
  > {
    let payment_method: string;
    let notes: string | undefined;
    let extra: Record<string, any> = {};

    if (typeof paymentOrShipping === "string") {
      payment_method = paymentOrShipping;
      notes = paymentMethodOrNotes;
    } else {
      // Old signature: (items, shippingInfo, paymentMethod, notes)
      extra = paymentOrShipping || {};
      payment_method = paymentMethodOrNotes as string;
      notes = maybeNotes;
    }

    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify({
        items,
        ...extra, // harmless; backend ignores shipping fields now
        payment_method,
        notes,
      }),
    });
  }

  async getOrders(status?: string): Promise<ApiResponse<{ data: Order[] }>> {
    const url = status ? `/orders?status=${status}` : "/orders";
    return this.request<{ data: Order[] }>(url);
  }

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}`);
  }

  async cancelOrder(id: number): Promise<ApiResponse> {
    return this.request(`/orders/${id}/cancel`, {
      method: "POST",
    });
  }

  async confirmDelivery(id: number): Promise<ApiResponse> {
    return this.request(`/orders/${id}/confirm-delivery`, {
      method: "POST",
    });
  }

  // Seller order methods
  async getSellerOrders(
    status?: string
  ): Promise<ApiResponse<{ data: Order[] }>> {
    const url = status ? `/seller/orders?status=${status}` : "/seller/orders";
    return this.request<{ data: Order[] }>(url);
  }

  // Backward-compatible: third positional once was trackingNumber; we now use adminNotes
  async updateOrderStatus(
    id: number,
    status: string,
    thirdArg?: string
  ): Promise<ApiResponse<Order>> {
    const body: any = { status };
    if (thirdArg) body.admin_notes = thirdArg;
    return this.request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  // Refund methods - DEPRECATED: System now uses order rejection instead
  // These methods are kept for backward compatibility but should not be used
  /**
   * @deprecated System now uses order rejection instead of refunds
   */
  async requestRefund(
    orderId: number,
    reason: string
  ): Promise<ApiResponse<Refund>> {
    console.warn("requestRefund is deprecated. Use order rejection instead.");
    return this.request<Refund>(`/orders/${orderId}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * @deprecated System now uses order rejection instead of refunds
   */
  async getRefunds(): Promise<ApiResponse<Refund[]>> {
    console.warn("getRefunds is deprecated. Use order rejection instead.");
    return this.request<Refund[]>("/refunds");
  }

  /**
   * @deprecated System now uses order rejection instead of refunds
   */
  async getSellerRefunds(): Promise<ApiResponse<Refund[]>> {
    console.warn(
      "getSellerRefunds is deprecated. Use order rejection instead."
    );
    return this.request<Refund[]>("/seller/refunds");
  }

  /**
   * @deprecated System now uses order rejection instead of refunds
   */
  async updateRefundStatus(
    refundId: number,
    status: string,
    response?: string
  ): Promise<ApiResponse<Refund>> {
    console.warn(
      "updateRefundStatus is deprecated. Use order rejection instead."
    );
    return this.request<Refund>(`/refunds/${refundId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, seller_response: response }),
    });
  }

  // Admin GCash settings
  async getGcashSettings(): Promise<ApiResponse<GcashSettings>> {
    const response = await this.request<GcashSettings>("/admin/gcash-settings");
    return response;
  }

  async updateGcashSettings(form: FormData): Promise<ApiResponse> {
    return this.requestMultipart("/admin/gcash-settings", form, "POST");
  }

  // Admin payment verification
  async getPendingPayments(): Promise<ApiResponse<{ data: Order[] }>> {
    const response = await this.request<{ data: Order[] }>(
      "/admin/pending-payments"
    );
    return response;
  }

  async verifyPayment(orderId: number): Promise<ApiResponse> {
    const response = await this.request(`/admin/verify-payment/${orderId}`, {
      method: "POST",
    });
    return response;
  }

  async rejectPayment(orderId: number, reason: string): Promise<ApiResponse> {
    const response = await this.request(`/admin/reject-payment/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return response;
  }

  async getAllPayments(): Promise<ApiResponse<{ data: Order[] }>> {
    const response = await this.request<{ data: Order[] }>(
      "/admin/all-payments"
    );
    return response;
  }

  async markPaymentDistributed(orderId: number): Promise<ApiResponse> {
    const response = await this.request(`/admin/mark-distributed/${orderId}`, {
      method: "POST",
    });
    return response;
  }

  // Order creation with receipt
  async createOrderWithReceipt(
    items: Array<{ product_id: number; quantity: number }>,
    paymentMethod: string,
    notes?: string,
    receiptFile?: File
  ): Promise<ApiResponse> {
    const form = new FormData();

    // Add items
    items.forEach((item, index) => {
      form.append(`items[${index}][product_id]`, item.product_id.toString());
      form.append(`items[${index}][quantity]`, item.quantity.toString());
    });

    form.append("payment_method", paymentMethod);
    if (notes) form.append("notes", notes);
    if (receiptFile) form.append("payment_receipt", receiptFile);

    return this.requestMultipart("/orders", form, "POST");
  }
}

export const apiService = new ApiService();

// Helper to resolve backend-hosted asset URLs
export function getAssetUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  // Convert relative Laravel storage path to absolute
  const backendBase = API_BASE_URL.replace(/\/?api\/?$/, "");
  return `${backendBase}${path}`;
}
