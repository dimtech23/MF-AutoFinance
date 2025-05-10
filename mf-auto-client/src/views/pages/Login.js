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

// Hardcoded test users for emergency access when the backend is down
const EMERGENCY_USERS = [
  {
    email: "admin@mfautosfinance.com",
    password: "admin123", // Use stronger passwords in real implementation
    user: {
      id: "admin123",
      role: "Admin",
      email: "admin@mfautosfinance.com",
      firstName: "Admin",
      lastName: "User"
    }
  },
  {
    email: "manager@mfautosfinance.com",
    password: "manager123",
    user: {
      id: "manager123",
      role: "Manager",
      email: "manager@mfautosfinance.com",
      firstName: "Manager",
      lastName: "User"
    }
  },
  {
    email: "accountant@mfautosfinance.com",
    password: "accountant123",
    user: {
      id: "accountant123",
      role: "Accountant",
      email: "accountant@mfautosfinance.com",
      firstName: "Accountant",
      lastName: "User"
    }
  }
];

const Login = () => {
  const history = useHistory();
  const { 
    setUser, 
    setIsAuthenticated, 
    setUserRole, 
    isAuthenticated, 
    userRole,
    login 
  } = useContext(UserContext);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [useEmergencyLogin, setUseEmergencyLogin] = useState(false);

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
    history.push('/admin/dashboard');
  }, [history]);
  
  // Enable emergency login mode after multiple failed attempts
  useEffect(() => {
    const failedAttempts = localStorage.getItem('failedLoginAttempts');
    if (failedAttempts && parseInt(failedAttempts) >= 3) {
      setUseEmergencyLogin(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      // EMERGENCY MODE: Check against hardcoded credentials if backend is unreachable
      if (useEmergencyLogin) {
        const matchingUser = EMERGENCY_USERS.find(
          user => user.email === email && user.password === password
        );
        
        if (matchingUser) {
          // Create a fake token
          const token = `emergency-token-${Date.now()}`;
          
          // Save emergency token
          localStorage.setItem("token", token);
          
          // Update user context
          setUser(matchingUser.user);
          setIsAuthenticated(true);
          setUserRole(matchingUser.user.role);
          setLoginSuccess(true);
          
          // Redirect to dashboard
          setTimeout(() => {
            history.push('/admin/dashboard');
          }, 100);
          
          return;
        } else {
          setError("Invalid credentials");
          setLoading(false);
          return;
        }
      }
      
      // NORMAL MODE: Try using Context's login function first
      const loginResult = await login({ email, password });
      
      if (loginResult.success) {
        // Login was successful through the context
        setLoginSuccess(true);
      } else {
        // If context login fails, increment failed attempts counter
        const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0');
        localStorage.setItem('failedLoginAttempts', (failedAttempts + 1).toString());
        
        // After multiple failures, offer emergency login option
        if (failedAttempts + 1 >= 3) {
          setUseEmergencyLogin(true);
          setError("Server connection issues detected. Using emergency login mode.");
        } else {
          setError(loginResult.error || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Increment failed attempts counter
      const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0');
      localStorage.setItem('failedLoginAttempts', (failedAttempts + 1).toString());
      
      // After multiple failures, offer emergency login option
      if (failedAttempts + 1 >= 3) {
        setUseEmergencyLogin(true);
        setError("Server connection issues detected. Using emergency login mode.");
      } else {
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
                {useEmergencyLogin && " (Emergency Mode)"}
              </Typography>
            </div>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            {useEmergencyLogin && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Backend connection issues detected. Using emergency mode.
                <br />
                Available test accounts: admin@mfautosfinance.com, manager@mfautosfinance.com, accountant@mfautosfinance.com
                <br />
                Password format: [role]123 (e.g., admin123)
              </Alert>
            )}
            
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
              
              {!useEmergencyLogin && (
                <Button
                  fullWidth
                  variant="text"
                  color="secondary"
                  size="small"
                  onClick={() => setUseEmergencyLogin(true)}
                  sx={{ mt: 1 }}
                >
                  Use Emergency Login
                </Button>
              )}
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