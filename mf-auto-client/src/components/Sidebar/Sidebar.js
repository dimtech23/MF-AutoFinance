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
  Box,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  IconButton,
} from "@mui/material";
import { X } from "lucide-react";

const Sidebar = ({ routes = [], logo, closeCollapse, isOpen, toggleSidebar }) => {
  const { userRole, logout } = useContext(UserContext);
  const [collapseOpen, setCollapseOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && isOpen) {
      // Add a small delay to allow the navigation to complete
      const timer = setTimeout(() => {
        if (toggleSidebar) {
          toggleSidebar();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isOpen, toggleSidebar]);

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
        <ListItem key={key} disablePadding sx={{ px: 1 }}>
          <ListItemButton
            component={NavLinkRRD}
            to={prop.layout + prop.path}
            onClick={closeCollapse || closeSidebarCollapse}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.active': {
                backgroundColor: 'grey.200',
                color: 'primary.main',
                fontWeight: 'bold',
              },
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <i className={`${prop.icon} text-xl`} />
            </ListItemIcon>
            <ListItemText primary={prop.name} />
          </ListItemButton>
        </ListItem>
      ));
  };

  let logoLinkProps;
  if (logo && logo.innerLink) {
    logoLinkProps = {
      component: Link,
      to: logo.innerLink,
    };
  } else if (logo && logo.outterLink) {
    logoLinkProps = {
      href: logo.outterLink,
      target: "_blank",
    };
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1199,
            display: { xs: 'block', md: 'none' },
          }}
          onClick={toggleSidebar}
        />
      )}
      
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: { xs: isOpen ? '280px' : '0px', md: isOpen ? '280px' : '0px' },
          backgroundColor: 'white',
          boxShadow: 3,
          zIndex: 1200,
          transition: 'width 0.3s ease, transform 0.3s ease',
          overflow: 'hidden',
          display: { xs: isOpen ? 'block' : 'none', md: 'block' },
          transform: { xs: isOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'translateX(0)' },
        }}
      >
        <Container maxWidth={false} sx={{ px: 0, height: '100%' }}>
          {/* Mobile close button */}
          <Box sx={{ 
            display: { xs: 'flex', md: 'none' }, 
            justifyContent: 'flex-end', 
            p: 1,
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1
          }}>
            <IconButton
              onClick={toggleSidebar}
              sx={{ 
                color: 'grey.600',
                '&:hover': { backgroundColor: 'grey.100' }
              }}
            >
              <X size={20} />
            </IconButton>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%', 
            px: 1,
            py: 1,
            mt: { xs: 4, md: 0 } // Add top margin on mobile for close button
          }}>
            {/* Desktop Logo - Always show on desktop, show on mobile when open */}
            <Box 
              sx={{ 
                display: { xs: isOpen ? 'flex' : 'none', md: isOpen ? 'flex' : 'none' }, 
                justifyContent: 'center', 
                width: '100%',
                pt: 0
              }}
              {...logoLinkProps}
            >
              <img
                alt="Logo"
                style={{ 
                  width: '100%',
                  maxWidth: '450px',
                  height: 'auto',
                  minHeight: '300px',
                  objectFit: 'contain'
                }}
                src="https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg"
              />
            </Box>
          </Box>

          {/* Navigation Links - Always visible on desktop, collapsible on mobile */}
          <Box sx={{ 
            display: { xs: isOpen ? 'block' : 'none', md: isOpen ? 'block' : 'none' },
            height: 'calc(100vh - 320px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}>
            <List sx={{ mb: 2, py: 1 }}>
              {createLinks(routes)}
            </List>

            <Divider sx={{ mx: 1, my: 1 }} />

            {/* Logout Link */}
            <List sx={{ px: 1, mb: 2 }}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 1,
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.50',
                      color: 'error.dark',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <i className="ni ni-user-run text-xl" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Container>
      </Box>
    </>
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
  isOpen: PropTypes.bool,
  toggleSidebar: PropTypes.func,
};

export default Sidebar;
