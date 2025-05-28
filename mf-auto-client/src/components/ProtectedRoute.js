import React, { useContext } from "react";
import { Route, Redirect, useLocation } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import CustomLoader from "./CustomLoader";

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { isAuthenticated, userRole, isLoading } = useContext(UserContext);
  const location = useLocation();

  if (isLoading) {
    return <CustomLoader />;
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isAuthenticated) {
          return <Redirect to={{ pathname: "/auth/login", state: { from: location } }} />;
        }

        if (roles && !roles.includes(userRole)) {
          return <Redirect to={{ pathname: "/unauthorized", state: { from: location } }} />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
