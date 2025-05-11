import React, { useState } from 'react';
import { Container, Row, Col, Nav, NavItem } from 'reactstrap';
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
      <Container fluid={isMobile}>
        {isMobile ? (
          <Row className="text-center">
            <Col>
              <div className="auth-copyright text-white">
                © {new Date().getFullYear()} MF Auto Garage
              </div>
              <div style={{ marginTop: 10 }}>
                <span onClick={handleSupportClick} style={linkStyle}>
                  Support
                </span>
                <span style={numberStyle}>3263368</span>
              </div>
            </Col>
          </Row>
        ) : (
          <Row className="align-items-center">
            <Col xl="6" lg="6" md="6">
              <div className="auth-copyright text-white">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://mfautosfinance.com/"
                  style={{ color: '#ffffff', fontWeight: 'bold' }}
                  target=""
                  rel="noopener noreferrer"
                >
                  MF AutoFinance
                </a>
              </div>
            </Col>
            <Col xl="6" lg="6" md="6" className="text-right">
              <Nav className="nav-footer justify-content-center justify-content-md-end">
                <NavItem>
                  <span onClick={handleSupportClick} style={linkStyle}>
                    Support
                  </span>
                  <span style={numberStyle}>3263368</span>
                </NavItem>
              </Nav>
            </Col>
          </Row>
        )}
      </Container>
    </footer>
  );
};

export default AuthFooter;
