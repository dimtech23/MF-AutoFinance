import React, { useEffect, useState } from "react";
import { useLocation, Route, Switch, Redirect } from "react-router-dom";
import { Container, Row } from "reactstrap";
import { Alert } from "@mui/material";

import AuthNavbar from "../components/Navbars/AuthNavbar";
import AuthFooter from "../components/Footers/AuthFooter";

import authRoutes from "../authRoutes";

const Auth = () => {
    const mainContent = React.useRef(null);
    const location = useLocation();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    
    React.useEffect(() => {
        document.documentElement.scrollTop = 0;
        document.scrollingElement.scrollTop = 0;
        if (mainContent.current) {
            mainContent.current.scrollTop = 0;
        }
    }, [location]);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const getRoutes = (routes) => {
        return routes.map((prop, key) => {
            if (prop.layout === "/auth") {
                return (
                    <Route
                        path={prop.layout + prop.path}
                        component={prop.component}
                        key={key}
                    />
                );
            } else {
                return null;
            }
        });
    };

    return (
        <>
            {isOffline && (
                <Alert severity="warning" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, textAlign: 'center' }}>
                    You are offline. Some features may not be available.
                </Alert>
            )}
            <div className="auth-master-wrapper">
                <AuthNavbar />
                <div className="auth-main-content" ref={mainContent}>
                    <Container className="auth-container py-5">
                        <Row className="justify-content-center">
                            <Switch>
                                {getRoutes(authRoutes)}
                                <Redirect from="*" to="/auth/login" />
                            </Switch>
                        </Row>
                    </Container>
                    <AuthFooter />
                </div>
            </div>
        </>
    );
};

export default Auth;