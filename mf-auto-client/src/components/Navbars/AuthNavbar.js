import React from "react";
import { Link } from "react-router-dom";
import { Navbar, NavbarBrand, Container } from "reactstrap";

const AuthNavbar = () => {
  return (
    <Container> {/* Minimal padding and background adjustment */}
      <Navbar className="navbar-horizontal"> {/* Reduced height */}
        <NavbarBrand to="/" tag={Link} className="mx-auto">
        {/* <img
        alt="MF-Autos Garage Logo"
        className="navbar-brand-img"
        src="https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg"
        style={{ maxHeight: '100%', maxWidth: '75%', height: 'auto' }}
    /> */}
        </NavbarBrand>
      </Navbar>
    </Container>
  );
};

export default AuthNavbar;
