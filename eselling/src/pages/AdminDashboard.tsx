import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  LogOut,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  CreditCard,
  QrCode,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { apiService, getAssetUrl } from "../services/api";
import type { Order, GcashSettings } from "../services/api";

interface Admin {
  id: number;
  email: string;
  user_type: string;
}

interface DashboardStats {
  total_sellers: number;
  pending_verifications: number;
  verified_sellers: number;
  active_sellers: number;
}

interface SellerApplication {
  id: number;
  shop_name: string;
  slug: string;
  description: string;
  verification_status: string;
  created_at: string;
  id_image_path?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<SellerApplication | null>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });

  // Payment verification state
  const [activeTab, setActiveTab] = useState("applications");
  const [gcashSettings, setGcashSettings] = useState<GcashSettings>({});
  const [pendingPayments, setPendingPayments] = useState<Order[]>([]);
  const [allPayments, setAllPayments] = useState<Order[]>([]);
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashQrFile, setGcashQrFile] = useState<File | null>(null);
  const [isUpdatingGcash, setIsUpdatingGcash] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
    if (activeTab === "payments") {
      fetchPaymentData();
    }
  }, [activeTab]);

  const checkAuth = async () => {
    try {
      const data = await apiService.getAdminUser();
      if (data.success && data.admin) {
        setAdmin(data.admin);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/login");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsData, applicationsData] = await Promise.all([
        apiService.getAdminDashboard(),
        apiService.getAdminPendingApplications(),
      ]);

      if (statsData.success && statsData.data) {
        // statsData.data.stats from controller shape
        // fallback to statsData.data if already flat
        setStats((statsData as any).data.stats || (statsData as any).data);
      }

      if (applicationsData.success) {
        // Laravel paginator shape => { data: [...], ... }
        const list =
          (applicationsData.data as any)?.data ?? applicationsData.data ?? [];
        setApplications(list as any);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentData = async () => {
    try {
      const [gcashData, pendingData, allData] = await Promise.all([
        apiService.getGcashSettings(),
        apiService.getPendingPayments(),
        apiService.getAllPayments(),
      ]);

      if (gcashData.success && gcashData.data) {
        setGcashSettings(gcashData.data);
        setGcashNumber(gcashData.data.gcash_number || "");
      }

      if (pendingData.success && pendingData.data) {
        setPendingPayments(pendingData.data.data || []);
      }

      if (allData.success && allData.data) {
        setAllPayments(allData.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment data:", error);
      showToast("Failed to load payment data", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.adminLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const processApplication = async (
    sellerId: number,
    action: "approve" | "reject"
  ) => {
    try {
      const data = await apiService.adminProcessApplication(sellerId, action);

      if (data.success) {
        showToast(data.message, "success");
        fetchDashboardData(); // Refresh data
        setSelected(null);
      } else {
        showToast(data.message || "Failed to process application", "error");
      }
    } catch (error) {
      console.error("Failed to process application:", error);
      showToast("Failed to process application", "error");
    }
  };

  // Payment verification functions
  const handleUpdateGcashSettings = async () => {
    setIsUpdatingGcash(true);
    try {
      const form = new FormData();
      if (gcashNumber) form.append("gcash_number", gcashNumber);
      if (gcashQrFile) form.append("gcash_qr", gcashQrFile);

      const data = await apiService.updateGcashSettings(form);
      if (data.success) {
        showToast("GCash settings updated successfully", "success");
        setShowGcashModal(false);
        setGcashQrFile(null);
        fetchPaymentData();
      } else {
        showToast(data.message || "Failed to update GCash settings", "error");
      }
    } catch (error) {
      console.error("Failed to update GCash settings:", error);
      showToast("Failed to update GCash settings", "error");
    } finally {
      setIsUpdatingGcash(false);
    }
  };

  const handleVerifyPayment = async (orderId: number) => {
    try {
      const data = await apiService.verifyPayment(orderId);
      if (data.success) {
        showToast("Payment verified successfully", "success");
        fetchPaymentData();
      } else {
        showToast(data.message || "Failed to verify payment", "error");
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
      showToast("Failed to verify payment", "error");
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;

    try {
      const data = await apiService.rejectPayment(
        selectedPayment.id,
        rejectReason
      );
      if (data.success) {
        showToast("Payment rejected successfully", "success");
        setShowRejectModal(false);
        setSelectedPayment(null);
        setRejectReason("");
        fetchPaymentData();
      } else {
        showToast(data.message || "Failed to reject payment", "error");
      }
    } catch (error) {
      console.error("Failed to reject payment:", error);
      showToast("Failed to reject payment", "error");
    }
  };

  const handleMarkDistributed = async (orderId: number) => {
    try {
      const data = await apiService.markPaymentDistributed(orderId);
      if (data.success) {
        showToast("Payment marked as distributed", "success");
        fetchPaymentData();
      } else {
        showToast(
          data.message || "Failed to mark payment as distributed",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to mark payment as distributed:", error);
      showToast("Failed to mark payment as distributed", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-stone-300 border-t-amber-600 rounded-full"
        />
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
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-800">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-stone-600">
                    Welcome back, {admin?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-stone-700 hover:text-stone-800 hover:bg-stone-50 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">
                    Total Sellers
                  </p>
                  <p className="text-3xl font-bold text-stone-800">
                    {stats?.total_sellers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">
                    Pending Verifications
                  </p>
                  <p className="text-3xl font-bold text-stone-800">
                    {stats?.pending_verifications || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-600">
                    Verified Sellers
                  </p>
                  <p className="text-3xl font-bold text-stone-800">
                    {stats?.verified_sellers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-600">
                    Active Sellers
                  </p>
                  <p className="text-3xl font-bold text-stone-800">
                    {stats?.active_sellers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-8">
            <div className="border-b border-stone-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "applications"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Seller Applications
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "payments"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  Payment Verification
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "applications" ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-stone-800">
                      Pending Seller Applications
                    </h2>
                    <button
                      onClick={fetchDashboardData}
                      className="flex items-center space-x-2 px-3 py-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Refresh</span>
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200">
                    {applications.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-600">
                          No pending applications
                        </p>
                      </div>
                    ) : (
                      applications.map((application, index) => (
                        <motion.div
                          key={application.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 hover:bg-stone-50/50 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-stone-800">
                                  {application.shop_name}
                                </h3>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                  Pending
                                </span>
                                {application.id_image_path && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    ID Verified
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-sm text-stone-600">
                                <p>
                                  <span className="font-medium">Owner:</span>{" "}
                                  {application.user.name}
                                </p>
                                <p>
                                  <span className="font-medium">Email:</span>{" "}
                                  {application.user.email}
                                </p>
                                <p>
                                  <span className="font-medium">Applied:</span>{" "}
                                  {formatDate(application.created_at)}
                                </p>
                                {application.description && (
                                  <p>
                                    <span className="font-medium">
                                      Description:
                                    </span>{" "}
                                    {application.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-6">
                              <button
                                onClick={() => setSelected(application)}
                                className="flex items-center space-x-2 px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors duration-200"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() =>
                                  processApplication(application.id, "approve")
                                }
                                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors duration-200"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() =>
                                  processApplication(application.id, "reject")
                                }
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* GCash Settings */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-stone-800">
                        GCash Settings
                      </h3>
                      <button
                        onClick={() => setShowGcashModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors duration-200"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Update QR Code</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-stone-50 p-4 rounded-lg">
                        <h4 className="font-medium text-stone-800 mb-2">
                          GCash Number
                        </h4>
                        <p className="text-stone-700">
                          {gcashSettings.gcash_number || "Not set"}
                        </p>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-lg">
                        <h4 className="font-medium text-stone-800 mb-2">
                          QR Code
                        </h4>
                        {gcashSettings.gcash_qr_url ? (
                          <img
                            src={getAssetUrl(gcashSettings.gcash_qr_url)}
                            alt="GCash QR Code"
                            className="w-32 h-32 object-contain border border-stone-200 rounded"
                          />
                        ) : (
                          <p className="text-stone-600">No QR code uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pending Payments */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-stone-800">
                        Pending Payments ({pendingPayments.length})
                      </h3>
                      <button
                        onClick={fetchPaymentData}
                        className="flex items-center space-x-2 px-3 py-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Refresh</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {pendingPayments.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                          <p className="text-stone-600">No pending payments</p>
                        </div>
                      ) : (
                        pendingPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="bg-stone-50 p-4 rounded-lg border border-stone-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-stone-800">
                                    Order #{payment.order_number}
                                  </h4>
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                    ₱{payment.total_amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-sm text-stone-600 space-y-1">
                                  <p>
                                    <span className="font-medium">
                                      Customer:
                                    </span>{" "}
                                    {payment.user
                                      ? `${payment.user.first_name} ${payment.user.last_name}`
                                      : "Unknown"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Seller:</span>{" "}
                                    {payment.seller
                                      ? payment.seller.shop_name
                                      : "Unknown"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Date:</span>{" "}
                                    {formatDate(payment.created_at)}
                                  </p>
                                </div>
                                {payment.payment_receipt_url && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-stone-800 mb-2">
                                      Payment Receipt:
                                    </p>
                                    <img
                                      src={getAssetUrl(
                                        payment.payment_receipt_url
                                      )}
                                      alt="Payment Receipt"
                                      className="w-32 h-32 object-cover border border-stone-200 rounded cursor-pointer"
                                      onClick={() =>
                                        window.open(
                                          getAssetUrl(
                                            payment.payment_receipt_url
                                          ),
                                          "_blank"
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() =>
                                    handleVerifyPayment(payment.id)
                                  }
                                  className="flex items-center space-x-1 px-3 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors duration-200"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Verify</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setShowRejectModal(true);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* All Payments */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-stone-800">
                        All Payments ({allPayments.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-stone-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Order #
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Customer
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Seller
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Method
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Distributed
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-stone-800">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {allPayments.map((payment) => (
                            <tr
                              key={payment.id}
                              className="hover:bg-stone-50/50"
                            >
                              <td className="px-4 py-3 font-medium text-stone-800">
                                #{payment.order_number}
                              </td>
                              <td className="px-4 py-3 text-stone-700">
                                {payment.user
                                  ? `${payment.user.first_name} ${payment.user.last_name}`
                                  : "Unknown"}
                              </td>
                              <td className="px-4 py-3 text-stone-700">
                                {payment.seller
                                  ? payment.seller.shop_name
                                  : "Unknown"}
                              </td>
                              <td className="px-4 py-3 font-medium text-stone-800">
                                ₱{payment.total_amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    payment.payment_method === "gcash"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {payment.payment_method === "gcash"
                                    ? "GCash"
                                    : "Cash on Pickup"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    payment.payment_status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : payment.payment_status === "pending"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {payment.payment_status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    payment.payment_distributed
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {payment.payment_distributed ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {!payment.payment_distributed &&
                                  payment.payment_status === "paid" && (
                                    <button
                                      onClick={() =>
                                        handleMarkDistributed(payment.id)
                                      }
                                      className="flex items-center space-x-1 px-2 py-1 bg-amber-600 text-white hover:bg-amber-700 rounded text-xs transition-colors duration-200"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      <span>Mark Distributed</span>
                                    </button>
                                  )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl mx-4"
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">
                Application Details
              </h3>
              <button
                className="text-stone-600 hover:text-stone-800"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-stone-600">Shop Name</p>
                <p className="text-stone-800 font-medium">
                  {selected.shop_name}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-600">Owner</p>
                  <p className="text-stone-800 font-medium">
                    {selected.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Email</p>
                  <p className="text-stone-800 font-medium">
                    {selected.user.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-600">Slug</p>
                  <p className="text-stone-800 font-medium">{selected.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Applied</p>
                  <p className="text-stone-800 font-medium">
                    {formatDate(selected.created_at)}
                  </p>
                </div>
              </div>
              {selected.description && (
                <div>
                  <p className="text-sm text-stone-600">Description</p>
                  <p className="text-stone-800">{selected.description}</p>
                </div>
              )}
              {/* Seller ID Image */}
              {selected.id_image_path && (
                <div>
                  <p className="text-sm text-stone-600 mb-2">Valid ID</p>
                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <img
                      src={getAssetUrl(selected.id_image_path)}
                      alt="Seller ID"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        window.open(
                          getAssetUrl(selected.id_image_path),
                          "_blank"
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    Click to view full size
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => processApplication(selected.id, "reject")}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={() => processApplication(selected.id, "approve")}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg"
              >
                Approve
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* GCash Settings Modal */}
      {showGcashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowGcashModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md mx-4"
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">
                Update GCash Settings
              </h3>
              <button
                className="text-stone-600 hover:text-stone-800"
                onClick={() => setShowGcashModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-2">
                  GCash Number
                </label>
                <input
                  type="text"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-2">
                  GCash QR Code
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGcashQrFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowGcashModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGcashSettings}
                  disabled={isUpdatingGcash}
                  className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  {isUpdatingGcash ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRejectModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md mx-4"
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">
                Reject Payment
              </h3>
              <button
                className="text-stone-600 hover:text-stone-800"
                onClick={() => setShowRejectModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this payment..."
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectPayment}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  Reject Payment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
