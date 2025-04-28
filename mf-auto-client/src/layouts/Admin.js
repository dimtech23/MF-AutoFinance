import React, { useContext, useEffect, useRef } from "react";
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
    const { userRole, isAuthenticated } = useContext(UserContext);

    useEffect(() => {
        if (mainContent.current) {
            document.documentElement.scrollTop = 0;
            document.scrollingElement.scrollTop = 0;
            mainContent.current.scrollTop = 0;
        }
    }, [location]);

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

    return (
        <>
            <Sidebar {...props} routes={routes.filter(route => route.layout === '/admin' && route.roles?.includes(userRole))} />
            <div className="main-content" ref={mainContent}>
                <AdminNavbar {...props} />
                <Switch>
                    {routes.filter(route => route.layout === '/admin').map((route, key) => (
                        <ProtectedRoute key={key} path={`${route.layout}${route.path}`} component={route.component} roles={route.roles} />
                    ))}
                    <Redirect from="/admin" to={getDefaultRoute()} />
                </Switch>
                <Container fluid>
                    <AdminFooter />
                </Container>
            </div>
        </>
    );
};

export default Admin;
