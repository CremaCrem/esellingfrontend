import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAssetUrl } from "../services/api";
import {
  User,
  ShoppingBag,
  Search,
  Package,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useCart } from "../contexts/CartContext";
import { useLogoutModal } from "../contexts/LogoutModalContext";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

const Navbar: React.FC = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: number; name: string; seller?: string }>
  >([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestBoxRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { setShowLogoutModal, setHandleLogout } = useLogoutModal();
  const { user, logout } = useAuth();

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
    // Close dropdowns/menus
    setShowUserDropdown(false);
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Debounced search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setLoadingSuggest(true);
        // reuse products endpoint (client-side fuzzy)
        const res = await apiService.getProducts(1, 20);
        if (res.success && res.data) {
          const list = (res.data.data || []).map((p: any) => ({
            id: p.id,
            name: p.name as string,
            seller: p.seller?.shop_name,
          }));
          const q = query.toLowerCase();
          const ranked = list
            .map((p) => ({
              p,
              score:
                (p.name.toLowerCase().includes(q) ? 10 : 0) +
                (p.name.toLowerCase().startsWith(q) ? 5 : 0) +
                ((p.seller || "").toLowerCase().includes(q) ? 2 : 0),
            }))
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((r) => r.p);
          setSuggestions(ranked);
          setShowSuggest(true);
        }
      } finally {
        setLoadingSuggest(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Close suggest on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        suggestBoxRef.current &&
        !suggestBoxRef.current.contains(e.target as Node)
      ) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setShowSuggest(false);
    navigate(`/dashboard?query=${encodeURIComponent(trimmed)}`);
  };

  const initials = (() => {
    const first = user?.first_name?.[0] ?? "J";
    const last = user?.last_name?.[0] ?? "D";
    return `${first}${last}`.toUpperCase();
  })();

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="e-Selling Logo" className="w-8 h-8" />
            <Link
              to="/dashboard"
              className="text-2xl font-bold text-stone-800 hover:text-amber-600 transition-colors"
            >
              e-Selling
            </Link>
          </div>

          {/* Center - Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full" ref={suggestBoxRef}>
              <input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowSuggest(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch(query);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-stone-400 bg-stone-50"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />

              {showSuggest && (
                <div className="absolute mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg z-50">
                  <ul className="max-h-72 overflow-auto">
                    {loadingSuggest && (
                      <li className="px-4 py-2 text-sm text-stone-500">
                        Searching...
                      </li>
                    )}
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-stone-50"
                          onClick={() => submitSearch(s.name)}
                        >
                          <div className="text-sm text-stone-800">{s.name}</div>
                          {s.seller && (
                            <div className="text-xs text-stone-500">
                              {s.seller}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                    {!loadingSuggest && suggestions.length === 0 && query && (
                      <li className="px-4 py-2 text-sm text-stone-500">
                        No results
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            {/* My Purchases */}
            <Link
              to={user ? "/my-purchases" : "/login"}
              className="flex items-center space-x-2 text-stone-700 hover:text-amber-600 transition-colors"
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">My Purchases</span>
            </Link>

            {/* Cart */}
            {user ? (
              <Link
                to="/cart"
                className="relative flex items-center space-x-2 text-stone-700 hover:text-amber-600 transition-colors"
              >
                <ShoppingBag className="h-6 w-6" />
                <span className="font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="relative flex items-center space-x-2 text-stone-700 hover:text-amber-600 transition-colors"
              >
                <ShoppingBag className="h-6 w-6" />
                <span className="font-medium">Cart</span>
              </Link>
            )}

            {/* User Dropdown */}
            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 text-stone-700 hover:text-amber-600 transition-colors"
                  >
                    {user.profile_picture_url ? (
                      <img
                        src={getAssetUrl(user.profile_picture_url)}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-stone-200"
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
                      className={`w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center ${
                        user.profile_picture_url ? "hidden" : ""
                      }`}
                    >
                      <span className="text-white text-sm font-semibold">
                        {initials}
                      </span>
                    </div>
                    <span className="font-medium">
                      {user.first_name} {user.last_name}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-30 border border-stone-200">
                      <Link
                        to="/my-account"
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        to="/my-purchases"
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        My Purchases
                      </Link>
                      <button
                        onClick={handleLogoutClick}
                        className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-stone-700 hover:text-amber-600 transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-stone-700 hover:text-amber-600 transition-colors"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-stone-200 py-4">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-stone-400 bg-stone-50"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {user ? (
                <>
                  <Link
                    to="/my-purchases"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Purchases
                  </Link>
                  <Link
                    to="/cart"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <Link
                    to="/my-account"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Cart
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
