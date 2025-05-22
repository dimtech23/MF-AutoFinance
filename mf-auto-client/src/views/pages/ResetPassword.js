// ResetPassword.js
import React, { useState, useContext } from "react";
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
  InputAdornment,
  CircularProgress,
  Link,
  Container
} from "@mui/material";
import { Mail, ArrowLeft } from "lucide-react";
import logo from "../../assets/img/brand/mfautos-logo.png"; // Update the path to your logo
import "../../assets/css/auth.css"; // Import the custom auth styles

const ResetPassword = () => {
  const history = useHistory();
  const { resetPassword } = useContext(UserContext);
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess("Password reset instructions have been sent to your email.");
      } else {
        setError(result.error || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An error occurred. Please try again later.");
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
                Reset Password
              </Typography>
              <Typography variant="body1" className="auth-subtitle">
                Enter your email to receive reset instructions
              </Typography>
            </div>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            
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
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                className="auth-button"
              >
                {loading ? <CircularProgress size={24} /> : "Send Reset Instructions"}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => history.push("/auth/login")}
                  sx={{ 
                    textDecoration: "none", 
                    color: "#5e72e4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    '&:hover': {
                      textDecoration: "underline"
                    }
                  }}
                >
                  <ArrowLeft size={16} style={{ marginRight: 4 }} />
                  Back to Login
                </Link>
              </Box>
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

export default ResetPassword;