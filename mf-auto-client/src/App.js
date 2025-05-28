import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";
import { UserProvider } from "./Context/UserContext";
import Admin from "./layouts/Admin";
import Auth from "./layouts/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const basename = process.env.PUBLIC_URL || "";
  
  return (
    <Router basename={basename}>
      <UserProvider>
        <Switch>
          <ProtectedRoute
            path="/admin"
            roles={["Admin", "Manager", "Accountant"]}
            component={Admin}
          />
          <Route path="/auth" component={Auth} />
          <Route path="/unauthorized" component={Unauthorized} />
          <Redirect from="/" to="/auth/login" />
        </Switch>
        <ToastContainer />
      </UserProvider>
    </Router>
  );
};

export default App;
