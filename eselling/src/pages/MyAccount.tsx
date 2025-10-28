import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Camera,
  Store,
} from "lucide-react";
import { apiService, getAssetUrl } from "../services/api";
import type { CreateSellerData } from "../services/api";
import Toast from "../components/Toast";
import { useLogoutModal } from "../contexts/LogoutModalContext";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/Footer";
import ConfirmationModal from "../components/ConfirmationModal";

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showKebabDropdown, setShowKebabDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user, logout, refreshUser } = useAuth();
  const [sellerForm, setSellerForm] = useState<CreateSellerData>({
    shop_name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
    id_image_path: "",
    contact_email: "",
    contact_phone: "",
  });
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerMessage, setSellerMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });
  const [sellerApplication, setSellerApplication] = useState<any>(null);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const { setShowLogoutModal, setHandleLogout } = useLogoutModal();

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setContactNumber(user.contact_number ?? "");
    }
  }, [user]);

  // Check for existing seller application
  useEffect(() => {
    const checkSellerApplication = async () => {
      if (!user) return;

      setLoadingSeller(true);
      try {
        const response = await apiService.getMySeller();
        if (response.success && response.data) {
          setSellerApplication(response.data);
        }
      } catch (error) {
        // Seller profile doesn't exist yet - user can apply
        setSellerApplication(null);
      } finally {
        setLoadingSeller(false);
      }
    };

    checkSellerApplication();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append("contact_number", contactNumber);
      if (currentPassword || newPassword || newPasswordConfirm) {
        form.append("current_password", currentPassword);
        form.append("password", newPassword);
        form.append("password_confirmation", newPasswordConfirm);
      }
      if (profilePicFile) form.append("profile_picture", profilePicFile);

      const res = await apiService.updateUserMultipart(form);
      if (!res.success)
        throw new Error(res.message || "Failed to update profile");
      await refreshUser();
      setToast({
        message: "Profile updated successfully!",
        type: "success",
        isVisible: true,
      });
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setProfilePicFile(null);
      setShowConfirm(false);
    } catch (e: any) {
      setToast({
        message: e?.message || "Failed to update profile. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Close the modal after successful logout
      setShowLogoutModal(false);
      navigate("/");
    } catch (e) {
      // ignore
    }
  };

  const handleLogoutClick = () => {
    // Set the logout handler function in the context
    setHandleLogout(() => handleLogout);
    // Show the modal
    setShowLogoutModal(true);
  };

  const handleSellerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSellerForm((prev) => ({ ...prev, [name]: value }));
    if (name === "shop_name" && !sellerForm.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSellerForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required ID image
    if (!idImageFile) {
      setSellerMessage(
        "Please upload a valid ID image before submitting your application."
      );
      setToast({
        message: "ID image is required for seller verification.",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setSellerSubmitting(true);
    setSellerMessage(null);
    try {
      const formData = new FormData();
      Object.entries(sellerForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      if (logoFile) formData.append("logo", logoFile);
      if (bannerFile) formData.append("banner", bannerFile);
      if (idImageFile) formData.append("id_image", idImageFile);

      await apiService.createSellerMultipart(formData);
      setSellerMessage("Your seller application has been submitted.");
      setToast({
        message: "Seller application submitted successfully!",
        type: "success",
        isVisible: true,
      });

      // Refresh seller application status
      const response = await apiService.getMySeller();
      if (response.success && response.data) {
        setSellerApplication(response.data);
      }

      // Reset form
      setSellerForm({
        shop_name: "",
        slug: "",
        description: "",
        logo_url: "",
        banner_url: "",
        id_image_path: "",
        contact_email: "",
        contact_phone: "",
      });
      setLogoFile(null);
      setBannerFile(null);
      setIdImageFile(null);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to submit application.";
      setSellerMessage(errorMessage);
      setToast({
        message: errorMessage,
        type: "error",
        isVisible: true,
      });
    } finally {
      setSellerSubmitting(false);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="p-6">
            {/* Header with Kebab Menu */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-stone-800">My Profile</h1>
              <div className="relative">
                <button
                  onClick={() => setShowKebabDropdown(!showKebabDropdown)}
                  className="p-2 hover:bg-stone-50 rounded-full"
                >
                  <MoreVertical className="h-5 w-5 text-stone-600" />
                </button>
                {/* Kebab Menu Dropdown */}
                {showKebabDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-stone-200">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editing mode indicator */}
            {isEditing && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                You are currently editing your profile. Changes are not saved
                until you apply them.
              </div>
            )}

            <hr className="mb-6" />

            {/* Profile Picture Section */}
            <div className="mb-6">
              <div className="relative inline-block">
                {user?.profile_picture_url ? (
                  <img
                    src={getAssetUrl(user.profile_picture_url)}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border border-stone-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      (
                        target.nextElementSibling as HTMLElement
                      )?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center ${
                    user?.profile_picture_url ? "hidden" : ""
                  }`}
                >
                  <span className="text-stone-600 text-lg">Profile Pic</span>
                </div>
                <label
                  className={`absolute bottom-0 right-0 ${
                    isEditing ? "" : "hidden"
                  } bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 transition-colors cursor-pointer`}
                >
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setProfilePicFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
            </div>

            {/* Username Section - Centered below profile picture */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-stone-800">
                {user ? `${user.first_name} ${user.last_name}` : ""}
              </h2>
            </div>

            {/* Editable Profile */}
            <div
              className={`space-y-4 ${
                isEditing
                  ? "rounded-lg border border-amber-200 bg-amber-50/20 p-4"
                  : ""
              }`}
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    isEditing
                      ? "bg-stone-500 hover:bg-stone-600"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>
              {/* Email and Phone in the same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`flex-1 px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        !isEditing ? "bg-stone-50 opacity-75" : "bg-white"
                      }`}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className={`flex-1 px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        !isEditing ? "bg-stone-50 opacity-75" : "bg-white"
                      }`}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Password change fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                      !isEditing ? "bg-stone-50 opacity-75" : "bg-white"
                    }`}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                      !isEditing ? "bg-stone-50 opacity-75" : "bg-white"
                    }`}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className={`w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                      !isEditing ? "bg-stone-50 opacity-75" : "bg-white"
                    }`}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Apply Changes with confirmation */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isEditing || isSaving}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    isSaving ? "bg-gray-400" : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {isSaving ? "Saving..." : "Apply Changes"}
                </button>
              </div>
              <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleSave}
                title="Apply Changes?"
                message="Please confirm you want to apply these changes to your profile."
                confirmText={isSaving ? "Saving..." : "Apply Changes"}
                isLoading={isSaving}
                variant="warning"
              />

              <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={async () => {
                  try {
                    setDeleting(true);
                    const res = await apiService.deleteAccount();
                    if (!res.success)
                      throw new Error(
                        res.message || "Failed to delete account"
                      );
                    navigate("/");
                    window.location.reload();
                  } catch (e: any) {
                    setToast({
                      message: e?.message || "Failed to delete account.",
                      type: "error",
                      isVisible: true,
                    });
                  } finally {
                    setDeleting(false);
                  }
                }}
                title="Delete Account?"
                message="This action is permanent. All your data will be removed and you will be logged out."
                confirmText={deleting ? "Deleting..." : "Delete"}
                isLoading={deleting}
                variant="danger"
              />
            </div>
          </div>
        );
      // Removed notifications & password sections; handled within Profile
      case "seller":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Seller Center
            </h1>
            <p className="text-gray-600">Seller center content will go here.</p>
          </div>
        );
      case "seller-signup":
        // Check seller application status
        const canApply =
          !sellerApplication ||
          sellerApplication.verification_status === "rejected";

        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-stone-800 mb-2">
              Become a Seller
            </h1>
            <p className="text-stone-800/70 mb-6">
              Fill out the details below to apply as a seller.
            </p>

            {/* Seller application status messages */}
            {loadingSeller ? (
              <div className="mb-6 px-4 py-3 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-center">
                Loading seller status...
              </div>
            ) : sellerApplication?.verification_status === "unverified" ? (
              <div className="mb-6 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800">
                <p className="font-medium">Application Pending</p>
                <p className="text-sm mt-1">
                  Your seller application is currently under review. Please wait
                  for admin approval.
                </p>
              </div>
            ) : sellerApplication?.verification_status === "verified" ? (
              <div className="mb-6 px-4 py-3 rounded-lg border border-green-300 bg-green-50 text-green-800">
                <p className="font-medium">Application Accepted</p>
                <p className="text-sm mt-1">
                  Your seller account has been verified. You can now manage your
                  store from the Seller Center.
                </p>
                <button
                  onClick={() => navigate("/seller-center")}
                  className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Go to Seller Center
                </button>
              </div>
            ) : sellerApplication?.verification_status === "rejected" ? (
              <div className="mb-6 px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-800">
                <p className="font-medium">Application Rejected</p>
                <p className="text-sm mt-1">
                  Your previous seller application was rejected. You can submit
                  a new application below.
                </p>
              </div>
            ) : null}

            {sellerMessage && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-stone-200 bg-stone-50 text-stone-700">
                {sellerMessage}
              </div>
            )}
            <form onSubmit={handleSellerSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Shop Name
                  </label>
                  <input
                    name="shop_name"
                    value={sellerForm.shop_name}
                    onChange={handleSellerChange}
                    required
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Shop URL
                  </label>
                  <input
                    name="slug"
                    value={sellerForm.slug}
                    onChange={handleSellerChange}
                    required
                    placeholder="my-shop-name"
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={sellerForm.description}
                  onChange={handleSellerChange}
                  rows={3}
                  disabled={!canApply}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Logo Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* ID Image Upload - Required */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Valid ID Image <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-stone-600 mb-2">
                  Upload a clear photo of your valid government-issued ID for
                  verification purposes.
                </p>
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setIdImageFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                    id="id-image-upload"
                    required
                    disabled={!canApply}
                  />
                  <label
                    htmlFor="id-image-upload"
                    className={`block ${
                      canApply
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {idImageFile ? (
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
                          {idImageFile.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-stone-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-stone-700">
                          Click to upload ID image
                        </p>
                        <p className="text-xs text-stone-500">
                          or drag and drop
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={sellerForm.contact_email || ""}
                    onChange={handleSellerChange}
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    name="contact_phone"
                    value={sellerForm.contact_phone || ""}
                    onChange={handleSellerChange}
                    disabled={!canApply}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canApply || sellerSubmitting}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    !canApply || sellerSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {sellerSubmitting
                    ? "Submitting..."
                    : canApply
                    ? "Submit Application"
                    : "Application Submitted"}
                </button>
              </div>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        duration={3000}
      />

      <div className="min-h-screen bg-stone-50">
        <Navbar />

        <div className="flex">
          {/* Static Sidebar - Non-collapsible */}
          <div className="w-72 bg-white/90 backdrop-blur sticky top-32 h-screen overflow-y-auto border-r border-stone-200">
            <div className="p-5">
              {/* User Info */}
              <div className="mb-6 border border-stone-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  {/* Removed sidebar profile picture placeholder per request */}
                  <div>
                    <h3 className="font-semibold text-stone-800">
                      {user ? `${user.first_name} ${user.last_name}` : ""}
                    </h3>
                    <p className="text-xs text-stone-600">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="mb-5 border-stone-200" />

              {/* My Account Dropdown */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-white" />
                    <span className="text-white">My Account</span>
                  </div>
                  {showAccountDropdown ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Account Options */}
                {showAccountDropdown && (
                  <div className="ml-4 mt-3 space-y-2">
                    <button
                      onClick={() => setActiveSection("profile")}
                      className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md transition-colors ${
                        activeSection === "profile"
                          ? "bg-white text-amber-700 border border-amber-200 shadow-sm"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    {/* Removed Notification Settings and Change Password links */}
                    <button
                      onClick={() => navigate("/seller-center")}
                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-md bg-amber-600 transition-colors text-white hover:bg-amber-700"
                    >
                      <Store className="h-4 w-4 text-white" />
                      <span>Seller Center</span>
                    </button>
                    <button
                      onClick={() => setActiveSection("seller-signup")}
                      className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md transition-colors ${
                        activeSection === "seller-signup"
                          ? "bg-white text-amber-700 border border-amber-200 shadow-sm"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Store className="h-4 w-4" />
                      <span>Become a Seller</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="space-y-2">
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-stone-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">{renderMainContent()}</main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyAccount;
