import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, Mail, ArrowLeft } from "lucide-react";
import { apiService } from "../services/api";
import type { RegisterData } from "../services/api";
import Toast from "./Toast";
import Button from "./Button";
import Input from "./Input";
import logo from "../assets/logo.png";
import esellingBg from "../assets/eselling-bg.png";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleBackNavigation = () => {
    navigate(-1); // Go back to previous page in browser history
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // If no errors, proceed with registration
    if (!Object.values(newErrors).some((error) => error)) {
      setIsLoading(true);

      try {
        const registerData: RegisterData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        };

        const response = await apiService.register(registerData);

        if (response.success) {
          // Show success message and redirect to login
          setToast({
            message: "Account created successfully! Please login to continue.",
            type: "success",
            isVisible: true,
          });

          // Redirect after a short delay to show the toast
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Registration error:", error);

        if (error.message) {
          setToast({
            message: `Registration failed: ${error.message}`,
            type: "error",
            isVisible: true,
          });
        } else {
          setToast({
            message: "Registration failed. Please try again.",
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
          className="w-full max-w-5xl relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col lg:flex-row min-h-[700px] rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Side - Branding */}
            <motion.div
              className="lg:w-1/2 bg-gradient-to-br from-sky-500 to-amber-500 relative overflow-hidden flex items-center justify-center p-8 lg:p-12"
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

            {/* Right Side - Registration Form */}
            <motion.div
              className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="w-full max-w-md">
                <motion.div
                  variants={itemVariants}
                  className="text-center mb-6"
                >
                  <h2 className="text-3xl font-bold text-stone-800 mb-2">
                    Create Account
                  </h2>
                  <p className="text-stone-600">
                    Complete the form to get started
                  </p>
                </motion.div>

                <motion.form
                  onSubmit={handleSubmit}
                  variants={itemVariants}
                  className="space-y-5"
                >
                  {/* Name Fields Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* First Name */}
                    <Input
                      label="First Name"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      error={errors.firstName}
                      placeholder="John"
                      leftIcon={<User className="h-5 w-5" />}
                      isRequired
                    />

                    {/* Last Name */}
                    <Input
                      label="Last Name"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      error={errors.lastName}
                      placeholder="Doe"
                      leftIcon={<User className="h-5 w-5" />}
                      isRequired
                    />
                  </div>

                  {/* Email Field */}
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    placeholder="john.doe@example.com"
                    leftIcon={<Mail className="h-5 w-5" />}
                    isRequired
                  />

                  {/* Password Field */}
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

                  {/* Confirm Password Field */}
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={errors.confirmPassword}
                    placeholder="Confirm your password"
                    leftIcon={<Lock className="h-5 w-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="text-stone-400 hover:text-stone-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                    isRequired
                  />

                  {/* Sign Up Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>

                  {/* Terms and Conditions */}
                  <div className="text-center">
                    <p className="text-xs text-stone-500 leading-relaxed">
                      By signing up, you agree to e-Selling's{" "}
                      <Link
                        to="/terms"
                        className="text-amber-600 hover:text-amber-700 transition-colors duration-200"
                      >
                        Terms of Service
                      </Link>{" "}
                      &{" "}
                      <Link
                        to="/privacy"
                        className="text-amber-600 hover:text-amber-700 transition-colors duration-200"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </div>

                  {/* Login Link */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-stone-600">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-medium text-amber-600 hover:text-amber-700 transition-colors duration-200"
                      >
                        Sign In
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

export default Register;
