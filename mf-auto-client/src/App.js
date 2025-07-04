import React, { useEffect } from "react";
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

  // Global ResizeObserver error handler
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
        return; // Suppress this specific warning
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <Router basename={basename}>
      <UserProvider>
        <Switch>
          <ProtectedRoute
            path="/admin"
            roles={["Admin", "Accountant", "Mechanic"]}
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
