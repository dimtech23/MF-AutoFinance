import React, { useContext, useEffect, useRef, useState } from "react";
import { Switch, Redirect, useLocation } from "react-router-dom";
import { Container } from "reactstrap";
import AdminNavbar from "../components/Navbars/AdminNavbar";
import AdminFooter from "../components/Footers/AdminFooter";
import Sidebar from "../components/Sidebar/Sidebar";
import routes from "../routes";
import ProtectedRoute from "../components/ProtectedRoute";
import { UserContext } from "../Context/UserContext";

const Admin = (props) => {
    const mainContent = useRef(null);
    const location = useLocation();
    const { userRole, isAuthenticated, isLoading } = useContext(UserContext);
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    

    // Effect to handle screen resize
    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth < 768;
            setIsMobile(isMobileView);
            
            // Auto close sidebar on mobile
            if (isMobileView && sidebarOpen) {
                setSidebarOpen(false);
            } else if (!isMobileView && !sidebarOpen) {
                setSidebarOpen(true);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Initialize on first render
        
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [sidebarOpen]);

    // Effect to handle scrolling
    useEffect(() => {
        if (mainContent.current) {
            document.documentElement.scrollTop = 0;
            document.scrollingElement.scrollTop = 0;
            mainContent.current.scrollTop = 0;
        }
    }, [location]);

    // Toggle sidebar function for mobile
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Determine the default route based on the user's role
    const getDefaultRoute = () => {
        if (!isAuthenticated) {
            return "/auth/login";
        }
        const defaultRoute = routes.find(route => route.roles?.includes(userRole));
        return defaultRoute ? `${defaultRoute.layout}${defaultRoute.path}` : "/auth/unauthorized";
    };

    // If user is not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Redirect to="/auth/login" />;
    }

    // Filter routes by user role
    const filteredRoutes = routes.filter(
        route => route.layout === '/admin' && route.roles?.includes(userRole)
    );
    

    return (
        <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Sidebar 
                {...props} 
                routes={filteredRoutes} 
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                logo={{
                    innerLink: "/admin/dashboard",
                    imgSrc: require("../assets/img/brand/mfautos-logo.jpg"),
                    imgAlt: "MF Autos Logo",
                }}
            />
            <div className="main-content" ref={mainContent}>
                <AdminNavbar 
                    {...props} 
                    toggleSidebar={toggleSidebar} 
                    isMobile={isMobile}
                    sidebarOpen={sidebarOpen}
                />
                <div className="admin-content-wrapper">
                    <Switch>
                        {routes.filter(route => route.layout === '/admin').map((route, key) => (
                            <ProtectedRoute 
                                key={key} 
                                path={`${route.layout}${route.path}`} 
                                component={route.component} 
                                roles={route.roles} 
                            />
                        ))}
                        <Redirect from="/admin" to={getDefaultRoute()} />
                    </Switch>
                    <Container fluid className="admin-footer-container">
                        <AdminFooter />
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default Admin;