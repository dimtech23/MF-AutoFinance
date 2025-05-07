import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
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

const Login = () => {
  const history = useHistory();
  // Extract everything we need from context
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
  const redirectToDashboard = () => {
    console.log("Attempting redirection to dashboard...");
    setTimeout(() => {
      // Use the full path with the basename
      const fullPath = "/admin/dashboard"; // Do not include basename, React Router handles it
      console.log(`Redirecting to: ${fullPath}`);
      history.push(fullPath);
    }, 500); // Small delay to ensure state updates are processed
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Submitting login with email:", email);
      
      const response = await axios.post('https://mfautosfinance.com/auth/login', { email, password });
            
      console.log("Login response:", response.data);

      if (response.data && response.data.token) {
        // Save token to localStorage
        localStorage.setItem("token", response.data.token);
        console.log("Token saved to localStorage");
        
        // Update all the state in UserContext
        setUser(response.data.user);
        console.log("User set in context:", response.data.user);
        
        setIsAuthenticated(true);
        console.log("isAuthenticated set to true");
        
        setUserRole(response.data.user.role);
        console.log("userRole set to:", response.data.user.role);
        
        // Mark login as successful
        setLoginSuccess(true);
        
        // Instead of redirecting immediately, let the useEffect handle it
        // This ensures state updates have time to propagate
        console.log("Login successful, redirection will be handled by useEffect");
      } else {
        console.log("Invalid credentials");
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "An error occurred during login. Please try again.");
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