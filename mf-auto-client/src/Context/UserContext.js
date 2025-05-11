import React, { createContext, useState, useEffect, useCallback } from "react";
import { decodeToken } from "react-jwt";
import { toast } from "react-toastify";
import { authAPI } from "../api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logger for state changes
  useEffect(() => {
    console.log("UserContext State Changed:", {
      isAuthenticated,
      userRole,
      user: user ? "exists" : "null",
      token: token ? "exists" : "null",
    });
  }, [isAuthenticated, userRole, user, token]);

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const validateToken = useCallback(async (storedToken) => {
    console.log("Validating token:", storedToken ? "token exists" : "no token");
    if (!storedToken) return false;

    try {
      const decodedToken = decodeToken(storedToken);
      console.log("Decoded token:", decodedToken);

      if (!decodedToken) {
        console.log("Token invalid - could not decode");
        return false;
      }

      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        console.log("Token expired");
        return false;
      }

      // If token is not expired, keep the user logged in even if server is unreachable
      setUser(decodedToken);
      setUserRole(decodedToken.role);
      setUserName(decodedToken.name || '');
      setUserEmail(decodedToken.email || '');
      return true;

    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        const isValid = await validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          // Only clear auth state if token is actually invalid/expired
          const decodedToken = decodeToken(storedToken);
          if (!decodedToken || decodedToken.exp < Date.now() / 1000) {
            setToken(null);
            setIsAuthenticated(false);
            setUser(null);
            setUserRole(null);
            setUserName(null);
            setUserEmail(null);
            localStorage.removeItem("token");
          } else {
            // If token is valid but server is unreachable, keep user logged in
            setToken(storedToken);
            setIsAuthenticated(true);
          }
        }
      } else {
        setIsAuthenticated(false);
        setToken(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [validateToken]);

  const login = async (credentials) => {
    console.log("Login function called with:", credentials.email);
    try {
      // If we're passed a response object directly (from a previous login)
      if (credentials.token && credentials.user) {
        console.log("Using pre-authenticated data");
        const token = credentials.token;
        const user = credentials.user;

        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        setUserRole(user.role);
        setUserName(`${user.firstName || ""} ${user.lastName || ""}`);
        setUserEmail(user.email);

        console.log("Authentication state updated:", {
          isAuthenticated: true,
          userRole: user.role,
        });

        return { success: true };
      }

      // Otherwise, do a regular login
      console.log("Performing API login");
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      console.log("Login response:", { token: !!token, user });

      // Set token first to trigger localStorage update
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setUserRole(user.role);
      setUserName(`${user.firstName || ""} ${user.lastName || ""}`);
      setUserEmail(user.email);

      console.log("Authentication state updated:", {
        isAuthenticated: true,
        userRole: user.role,
      });

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "An error occurred during login";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    console.log("Logging out...");
    setToken(null); // This will trigger localStorage removal via useEffect
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setUserEmail(null);
    console.log("Logged out - auth state cleared");
  };

  const resetPassword = async (email) => {
    try {
      await authAPI.resetPassword(email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred during password reset";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userRole,
        userName,
        userEmail,
        isAuthenticated,
        token,
        login,
        logout,
        resetPassword,
        isLoading,
        // Expose setter functions for direct state manipulation
        setUser,
        setUserRole,
        setIsAuthenticated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
