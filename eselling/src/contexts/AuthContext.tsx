import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiService } from "../services/api";
import type { User } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateUserMultipart: (formData: FormData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const USER_CACHE_KEY = "e-selling-user-cache";
const CACHE_EXPIRY_KEY = "e-selling-user-cache-expiry";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

        if (cachedUser && cacheExpiry) {
          const now = Date.now();
          const expiry = parseInt(cacheExpiry);

          if (now < expiry) {
            // Cache is still valid
            setUser(JSON.parse(cachedUser));
            setIsLoading(false);

            // Refresh user data in background
            refreshUserFromAPI();
            return;
          } else {
            // Cache expired, clear it
            clearUserCache();
          }
        }
      } catch (error) {
        console.error("Error loading cached user:", error);
        clearUserCache();
      }

      // No valid cache, fetch from API
      refreshUserFromAPI();
    };

    loadCachedUser();
  }, []);

  const refreshUserFromAPI = async () => {
    try {
      const response = await apiService.getUser();
      if (response.success && response.user) {
        setUser(response.user);
        cacheUser(response.user);
      } else {
        setUser(null);
        clearUserCache();
      }
    } catch (error) {
      setUser(null);
      clearUserCache();
    } finally {
      setIsLoading(false);
    }
  };

  const cacheUser = (userData: User) => {
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      localStorage.setItem(
        CACHE_EXPIRY_KEY,
        (Date.now() + CACHE_DURATION).toString()
      );
    } catch (error) {
      console.error("Error caching user:", error);
    }
  };

  const clearUserCache = () => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    } catch (error) {
      console.error("Error clearing user cache:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        cacheUser(response.user);
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: response.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, message: "Login failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      clearUserCache();
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiService.updateUser(userData);
      if (response.success && response.user) {
        setUser(response.user);
        cacheUser(response.user);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // helper for multipart updates
  const updateUserMultipart = async (form: FormData) => {
    try {
      const response = await apiService.updateUserMultipart(form);
      if (response.success && response.user) {
        setUser(response.user);
        cacheUser(response.user);
      }
    } catch (error) {
      console.error("Error updating user (multipart):", error);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await refreshUserFromAPI();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    updateUserMultipart,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
