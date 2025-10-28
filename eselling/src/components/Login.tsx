import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react";
import { apiService } from "../services/api";
import Toast from "./Toast";
import Button from "./Button";
import Input from "./Input";
import logo from "../assets/logo.png";
import esellingBg from "../assets/eselling-bg.png";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleBackNavigation = () => {
    navigate("/"); // Navigate to Dashboard
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {
      email: "",
      password: "",
    };

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    // If no errors, proceed with login
    if (!newErrors.email && !newErrors.password) {
      setIsLoading(true);

      try {
        if (isAdminLogin) {
          // Admin login still uses API service directly since it's separate from user auth
          const response = await apiService.adminLogin({
            email: formData.email,
            password: formData.password,
          });
          if (response.success) {
            navigate("/admin-dashboard");
          }
        } else {
          // Use AuthContext login function for regular users
          const result = await login(formData.email, formData.password);
          if (result.success) {
            navigate("/dashboard");
          } else {
            setToast({
              message: result.message,
              type: "error",
              isVisible: true,
            });
          }
        }
      } catch (error: any) {
        console.error("Login error:", error);

        if (error.message) {
          setToast({
            message: `Login failed: ${error.message}`,
            type: "error",
            isVisible: true,
          });
        } else {
          setToast({
            message: "Login failed. Please check your credentials.",
            type: "error",
            isVisible: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={3000}
      />
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative"
        style={{
          backgroundImage: `url(${esellingBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Blur Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        {/* Back Navigation Button */}
        <button
          onClick={handleBackNavigation}
          className="absolute top-6 left-6 z-10 flex items-center space-x-2 px-4 py-2 bg-white/90 hover:bg-white text-stone-700 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <motion.div
          className="w-full max-w-4xl relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col lg:flex-row min-h-[600px] rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Side - Branding */}
            <motion.div
              className="lg:w-1/2 bg-gradient-to-br from-amber-500 to-sky-500 relative overflow-hidden flex items-center justify-center p-8 lg:p-12"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-white/10 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
              </div>

              <div className="relative z-10 text-center lg:text-left text-white">
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center lg:items-start"
                >
                  {/* Logo */}
                  <div className="flex justify-center lg:justify-start mb-8">
                    <img
                      src={logo}
                      alt="e-Selling Logo"
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  {/* Website Name */}
                  <h1 className="text-5xl font-bold text-white">e-Selling</h1>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="w-full max-w-md">
                <motion.div
                  variants={itemVariants}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl font-bold text-stone-800 mb-2">
                    {isAdminLogin ? "Admin Login" : "Welcome Back"}
                  </h2>
                  <p className="text-stone-600">
                    Enter your credentials to continue
                  </p>

                  {/* Login Type Selection */}
                  <div className="mt-6">
                    <div className="flex bg-stone-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminLogin(false);
                          setErrors({ email: "", password: "" });
                          setToast((prev) => ({ ...prev, isVisible: false }));
                        }}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          !isAdminLogin
                            ? "bg-white text-stone-900 shadow-sm"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        User Login
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminLogin(true);
                          setErrors({ email: "", password: "" });
                          setToast((prev) => ({ ...prev, isVisible: false }));
                        }}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          isAdminLogin
                            ? "bg-white text-stone-900 shadow-sm"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        Admin Login
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.form
                  onSubmit={handleSubmit}
                  variants={itemVariants}
                  className="space-y-6"
                >
                  {/* Email Field */}
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    placeholder="Enter your email"
                    leftIcon={<User className="h-5 w-5" />}
                    isRequired
                  />

                  {/* Password Field */}
                  <div>
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={errors.password}
                      placeholder="Enter your password"
                      leftIcon={<Lock className="h-5 w-5" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-stone-400 hover:text-stone-600 transition-colors duration-200"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      }
                      isRequired
                    />
                    <div className="mt-2 text-right">
                      <Link
                        to="/forgot-password"
                        className="text-sm text-amber-600 hover:text-amber-700 transition-colors duration-200"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-stone-300 rounded transition-all duration-200"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-stone-700"
                    >
                      Remember me
                    </label>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  {/* Sign Up Link */}
                  <div className="text-center">
                    <p className="text-sm text-stone-600">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className="font-medium text-amber-600 hover:text-amber-700 transition-colors duration-200"
                      >
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </motion.form>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
