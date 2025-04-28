import React from "react";
import { useLocation, Route, Switch, Redirect } from "react-router-dom";
import { Container, Row } from "reactstrap";
import AuthNavbar from "components/Navbars/AuthNavbar";
import AuthFooter from "components/Footers/AuthFooter";
import authRoutes from "authRoutes";

const Auth = () => {
    const mainContent = React.useRef(null);
    const location = useLocation();

    React.useEffect(() => {
        document.documentElement.scrollTop = 0;
        document.scrollingElement.scrollTop = 0;
        mainContent.current.scrollTop = 0;
    }, [location]);

    const getRoutes = (authRoutes) => {
        return authRoutes.map((prop, key) => {
            if (prop.layout === "/auth") {
                return (
                    <Route path={prop.layout + prop.path} component={prop.component} key={key} />
                );
            } else {
                return null;
            }
        });
    };

    return (
        <>
            <AuthNavbar />
            <div className="main-content" ref={mainContent} style={{ marginTop: '20px' }}> {/* Reduced top margin */}
            
                <Container fluid>
                    <Row className="justify-content-center">
                        <Switch>
                            {getRoutes(authRoutes)}
                            <Redirect from="*" to="/auth/login" />
                        </Switch>
                    </Row>
                </Container>
                <AuthFooter />
            </div>
        </>
    );
};

export default Auth;
