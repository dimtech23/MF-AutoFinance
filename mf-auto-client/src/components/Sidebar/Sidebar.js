import { useState, useContext, useEffect } from "react";
import {
  NavLink as NavLinkRRD,
  Link,
  useHistory,
  useLocation,
} from "react-router-dom";
import PropTypes from "prop-types";
import { UserContext } from "../../Context/UserContext";
import {
  Button,
  Collapse,
  NavbarBrand,
  Navbar,
  NavItem,
  NavLink,
  Nav,
  Container,
} from "reactstrap";

const Sidebar = ({ routes = [], logo, closeCollapse }) => {
  const { userRole, logout } = useContext(UserContext);
  const [collapseOpen, setCollapseOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setCollapseOpen(false);
    }
  }, [location.pathname]);

  const toggleCollapse = () => {
    setCollapseOpen(!collapseOpen);
  };

  const closeSidebarCollapse = () => {
    setCollapseOpen(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    history.push("/auth/login");
  };

  const createLinks = (routes) => {
    return routes
      .filter(
        (route) => Array.isArray(route.roles) && route.roles.includes(userRole)
      )
      .map((prop, key) => (
        <NavItem key={key} className="px-3">
          <NavLink
            to={prop.layout + prop.path}
            tag={NavLinkRRD}
            onClick={closeCollapse || closeSidebarCollapse}
            activeClassName="bg-gray-200 text-primary font-semibold"
            className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <i
              className={`${prop.icon} mr-3 text-xl min-w-[24px] text-center`}
            />
            {prop.name}
          </NavLink>
        </NavItem>
      ));
  };

  let navbarBrandProps;
  if (logo && logo.innerLink) {
    navbarBrandProps = {
      to: logo.innerLink,
      tag: Link,
    };
  } else if (logo && logo.outterLink) {
    navbarBrandProps = {
      href: logo.outterLink,
      target: "_blank",
    };
  }

  return (
    <Navbar
      className="navbar-vertical fixed-left navbar-light bg-white shadow-md"
      expand="md"
      id="sidenav-main"
    >
      <Container fluid className="px-0">
        {/* Toggler with Tailwind */}
        <button
          className="navbar-toggler border-0 p-3 focus:outline-none"
          type="button"
          onClick={toggleCollapse}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Logo - Larger for laptop, smaller for mobile */}
        <NavbarBrand className="pt-0 flex justify-center" {...navbarBrandProps}>
          <img
            alt="Logo"
            className="navbar-brand-img max-h-[120px] md:max-h-[220px] max-w-[180px] md:max-w-[280px] h-auto w-auto"
            src="https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg"
          />
        </NavbarBrand>

        <Collapse navbar isOpen={collapseOpen}>
          {/* Mobile view close header with Tailwind */}
          <div className="navbar-collapse-header p-4 md:hidden border-b border-gray-200 mb-3">
            <div className="row">
              <div className="col-6 collapse-brand">
                <Link to="/">
                  <img
                    alt="Logo"
                    src="https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg"
                    className="max-h-[90px] max-w-[150px] w-auto"
                  />
                </Link>
              </div>
              <div className="col-6 collapse-close text-right">
                <button
                  className="navbar-toggler focus:outline-none"
                  type="button"
                  onClick={toggleCollapse}
                >
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links with Tailwind - Larger icons */}
          <Nav navbar className="mb-md-3 py-2">
            {createLinks(routes)}
          </Nav>

          <hr className="my-3 mx-3 border-gray-200" />

          {/* Logout Link with Tailwind - Larger icon */}
          <Nav className="px-3 mb-4">
            <NavItem>
              <NavLink
                href="#"
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:bg-red-50 hover:text-red-600 py-2 px-4 rounded transition-colors duration-200"
              >
                <i className="ni ni-user-run mr-3 text-xl" />
                <span className="text-base">Logout</span>
              </NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Container>
    </Navbar>
  );
};

Sidebar.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    innerLink: PropTypes.string,
    outterLink: PropTypes.string,
    imgSrc: PropTypes.string,
    imgAlt: PropTypes.string,
  }),
  closeCollapse: PropTypes.func,
};

export default Sidebar;
