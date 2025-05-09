import React, { useState, useContext, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
  Container
} from "@mui/material";
import { EyeOff, Eye, Mail, Lock } from "react-feather";
import logo from "../../assets/img/brand/mfautos-logo.jpg"; 
import "../../assets/css/auth.css";
// Import the api service with fixed URL handling
import { authAPI } from "../../api";

const Login = () => {
  const history = useHistory();
  const { 
    setUser, 
    setIsAuthenticated, 
    setUserRole, 
    
    isAuthenticated, 
    userRole 
  } = useContext(UserContext);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log("Auth state in Login component:", { isAuthenticated, userRole });
    
    // If authentication becomes true after login success, handle redirect here
    if (isAuthenticated && loginSuccess) {
      console.log("Auth state changed to authenticated, redirecting...");
      redirectToDashboard();
    }
  }, [isAuthenticated, userRole, loginSuccess]);

  // Separate function for redirection
  const redirectToDashboard = useCallback(() => {
    console.log("Attempting redirection to dashboard...");
    
    // Use the basename from environment variable if available
    const basePath = process.env.REACT_APP_BASE_URL || '';
    const fullPath = `${basePath}/admin/dashboard`;
    
    console.log(`Redirecting to: ${fullPath}`);
    history.push('/admin/dashboard'); // Keep this simple - React Router will handle the basename
  }, [history]);
  
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the direct authAPI login method
      const response = await authAPI.login({ email, password });
      
      if (response.data && response.data.token) {
        // Save token to localStorage
        localStorage.setItem("token", response.data.token);
        
        // Update user context
        if (response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          setUserRole(response.data.user.role);
          setLoginSuccess(true);
          
          // Force redirect immediately
          const adminPath = '/admin/dashboard';
          console.log(`Redirecting to: ${adminPath}`);
          setTimeout(() => {
            history.push(adminPath);
          }, 100);
        } else {
          setError("Invalid user data received from server");
        }
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Specific error handling
      if (err.response) {
        const status = err.response.status;
        
        if (status === 401) {
          setError("Invalid credentials. Please check your email and password.");
        } else if (status === 404) {
          setError("User not found. Please check your email address.");
        } else if (status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(err.response.data?.message || "Login failed. Please try again.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container maxWidth="xs">
        <div className="logo-container">
          <div className="logo-background">
            <img src={logo} alt="MF Autos Logo" className="logo-image" />
          </div>
        </div>
        
        <Card className="auth-card">
          <CardContent>
            <div className="auth-header">
              <Typography variant="h4" className="auth-title">
                Auto Garage
              </Typography>
              <Typography variant="body1" className="auth-subtitle">
                Sign in to your account
              </Typography>
            </div>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-field">
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={20} className="input-icon" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              
              <div className="auth-form-field">
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} className="input-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              
              <Box sx={{ mt: 2, mb: 2, textAlign: "right" }}>
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => history.push("/auth/reset-password")}
                  sx={{ 
                    textDecoration: "none", 
                    color: "#5e72e4",
                    "&:hover": {
                      textDecoration: "underline"
                    }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                className="auth-button"
              >
                {loading ? <CircularProgress size={24} /> : "Login"}
              </Button>
            </form>
            
            {/* Debug info - Only visible in development */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Debug Info:</Typography>
                <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </Box>
            )}
          </CardContent>
        </Card>
        
        <div className="auth-footer">
          <Typography variant="body2">
            © {new Date().getFullYear()} MF Autos. All rights reserved.
          </Typography>
        </div>
      </Container>
    </div>
  );
};

export default Login;