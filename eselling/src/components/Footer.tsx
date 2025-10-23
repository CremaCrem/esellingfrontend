import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Heart,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";

const Footer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent) => {
    // If user is not logged in, redirect to login page
    if (!user) {
      e.preventDefault();
      navigate("/login");
    }
    // If user is logged in, let the normal Link behavior work
  };

  return (
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <img src={logo} alt="e-Selling Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold text-amber-400">
                e-Selling
              </span>
            </div>
            <p className="text-stone-300 mb-6 leading-relaxed">
              Your trusted marketplace for fresh, local products. Connect with
              local sellers and discover amazing deals in your community.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold !text-white mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/dashboard"
                  onClick={handleLinkClick}
                  className="text-stone-300 hover:text-amber-400 transition-colors duration-200"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  to="/my-purchases"
                  onClick={handleLinkClick}
                  className="text-stone-300 hover:text-amber-400 transition-colors duration-200"
                >
                  My Purchases
                </Link>
              </li>
              <li>
                <Link
                  to="/my-account"
                  onClick={handleLinkClick}
                  className="text-stone-300 hover:text-amber-400 transition-colors duration-200"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  to="/seller-center"
                  onClick={handleLinkClick}
                  className="text-stone-300 hover:text-amber-400 transition-colors duration-200"
                >
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Support removed per request */}

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold !text-white mb-6">
              Contact Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-amber-400" />
                <span className="text-stone-300">infounit@parsu.edu.ph</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-amber-400" />
                <span className="text-stone-300">(054) 871-2090</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-400 mt-1" />
                <span className="text-stone-300">
                  San Juan Bautista St., Goa Camarines Sur 4422
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-stone-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-stone-400 text-sm mb-4 md:mb-0">
              © 2024 e-Selling. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                to="/terms"
                onClick={handleLinkClick}
                className="text-stone-400 hover:text-amber-400 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                onClick={handleLinkClick}
                className="text-stone-400 hover:text-amber-400 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                to="/cookies"
                onClick={handleLinkClick}
                className="text-stone-400 hover:text-amber-400 transition-colors duration-200"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-stone-800">
            <p className="text-stone-500 text-sm flex items-center justify-center space-x-1">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for local communities</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
