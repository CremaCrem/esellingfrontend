import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyAccount from "./pages/MyAccount";
import MyPurchases from "./pages/MyPurchases";
import ProductPage from "./pages/ProductPage";
import LoggedInProductPage from "./pages/LoggedInProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SellerCenter from "./pages/SellerCenter";
import SellerStore from "./pages/SellerStore";
import { CartProvider } from "./contexts/CartContext";
import {
  LogoutModalProvider,
  useLogoutModal,
} from "./contexts/LogoutModalContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ConfirmationModal from "./components/ConfirmationModal";
import LoadingScreen from "./components/LoadingScreen";
import "./App.css";

// Component that renders the logout modal at the App level
const AppContent: React.FC = () => {
  const { showLogoutModal, setShowLogoutModal, handleLogout } =
    useLogoutModal();
  const { isLoading } = useAuth();

  // Show loading screen only on initial app load
  if (isLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/my-purchases" element={<MyPurchases />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route
            path="/logged-in-product/:id"
            element={<LoggedInProductPage />}
          />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/seller-center" element={<SellerCenter />} />
          <Route path="/seller/:sellerId" element={<SellerStore />} />
          {/* Placeholder routes for future pages */}
          <Route
            path="/forgot-password"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Forgot Password
                  </h1>
                  <p className="text-gray-600">
                    This page is under construction.
                  </p>
                </div>
              </div>
            }
          />
          <Route
            path="/terms"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Terms of Service
                  </h1>
                  <p className="text-gray-600">
                    This page is under construction.
                  </p>
                </div>
              </div>
            }
          />
          <Route
            path="/privacy"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Privacy Policy
                  </h1>
                  <p className="text-gray-600">
                    This page is under construction.
                  </p>
                </div>
              </div>
            }
          />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LogoutModalProvider>
          <Router>
            <AppContent />
          </Router>
        </LogoutModalProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
