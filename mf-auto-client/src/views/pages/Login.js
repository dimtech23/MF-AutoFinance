import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { UserContext } from "../../Context/UserContext";
import { authAPI } from "../../api";
import logo from "../../assets/img/brand/mfautos-logo.jpg";
import "../../assets/css/auth.css";

const Login = () => {
  const history = useHistory();
  const { login } = useContext(UserContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await authAPI.checkStatus();
        if (response.data.status === 'online') {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
          setError("Server is not responding properly. Please try again later.");
        }
      } catch (err) {
        console.error("Server status check failed:", err);
        setServerStatus("offline");
        setError("Cannot connect to server. Please check your internet connection.");
      }
    };

    checkServerStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serverStatus !== "online") {
      setError("Cannot login while server is offline. Please try again later.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        history.push("/admin/dashboard");
      } else {
        setError(result.error || "Failed to login. Please check your credentials and try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to login. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-master-wrapper">
      <div className="auth-main-content">
        <div className="auth-page">
          <Container className="auth-container" maxWidth="sm">
            <div className="logo-container">
              <div className="logo-wrapper">
                <img
                  src={logo}
                  alt="MF Auto Finance"
                  className="logo-image"
                />
              </div>
            </div>

            <Card className="auth-card">
              <CardContent className="auth-card-content">
                <div className="auth-header">
                  <Typography variant="h4" className="auth-title">
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" className="auth-subtitle">
                    Sign in to access your MF Auto Finance account
                  </Typography>
                  {serverStatus === "checking" && (
                    <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="textSecondary" ml={1}>
                        Checking server status...
                      </Typography>
                    </Box>
                  )}
                </div>

                {error && (
                  <Alert severity="error" className="auth-alert">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading || serverStatus !== "online"}
                    className="auth-form-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading || serverStatus !== "online"}
                    className="auth-form-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <div className="forgot-password-container">
                    <Button
                      component="a"
                      onClick={() => history.push("/auth/forgot-password")}
                      className="forgot-password-link"
                      disabled={loading || serverStatus !== "online"}
                    >
                      Forgot Password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    className="auth-button"
                    disabled={loading || serverStatus !== "online"}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Box className="auth-footer">
              <Typography variant="body2" color="inherit">
                © {new Date().getFullYear()} MF Auto Finance. All rights reserved.
              </Typography>
            </Box>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default Login;