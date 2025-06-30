import React, { useState } from 'react';
import { Container, Grid, Link, Box, Typography } from '@mui/material';
import { useMediaQuery, useTheme } from "@mui/material";

const AuthFooter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showNumber, setShowNumber] = useState(false);

  const handleSupportClick = (e) => {
    e.preventDefault();
    setShowNumber(true);
  };

  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500'
  };

  const numberStyle = {
    color: '#ffffff',
    marginLeft: '12px',
    fontWeight: '600',
    transition: 'opacity 0.3s ease',
    opacity: showNumber ? 1 : 0,
    display: 'inline-block'
  };

  return (
    <footer className="auth-footer" style={{ backgroundColor: '#003366', padding: '20px 0' }}>
      <Container maxWidth={isMobile ? false : 'lg'}>
        {isMobile ? (
          <Grid container justifyContent="center">
            <Grid item>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  © {new Date().getFullYear()} MF Auto Garage
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <span onClick={handleSupportClick} style={linkStyle}>
                    Support
                  </span>
                  <span style={numberStyle}>3263368</span>
                </Box>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Grid container alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                © {new Date().getFullYear()}{" "}
                <Link
                  href="https://mfautosfinance.com/"
                  sx={{ color: '#ffffff', fontWeight: 'bold' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MF AutoFinance
                </Link>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', md: 'flex-end' }
              }}>
                <span onClick={handleSupportClick} style={linkStyle}>
                  Support
                </span>
                <span style={numberStyle}>3263368</span>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </footer>
  );
};

export default AuthFooter;
