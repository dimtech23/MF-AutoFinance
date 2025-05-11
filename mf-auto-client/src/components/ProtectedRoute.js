import { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import CustomLoader from "./CustomLoader"; 

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { isAuthenticated, userRole, isLoading } = useContext(UserContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isLoading) {
          return <CustomLoader />;
        }

        if (!isAuthenticated) {
          return <Redirect to="/auth/login" />;
        }

        if (roles && !roles.includes(userRole)) {
          return <Redirect to="/unauthorized" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
