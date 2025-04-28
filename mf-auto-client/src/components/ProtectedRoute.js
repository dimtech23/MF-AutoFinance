import React, { useContext, useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { UserContext } from 'Context/UserContext';
import CustomLoader from 'components/CustomLoader';
import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { isAuthenticated, userRole } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Debug log authentication state
    console.log('ProtectedRoute - Auth State:', { isAuthenticated, userRole });
    console.log('ProtectedRoute - Required Roles:', roles);
    
    const timer = setTimeout(() => {
      console.log('ProtectedRoute - Loading complete, auth state:', { isAuthenticated, userRole });
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, userRole, roles]);

  if (isLoading) {
    console.log('ProtectedRoute - Still loading...');
    return (
      <AnimatePresence>
        <CustomLoader />
      </AnimatePresence>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Redirect to="/auth/login" />;
  }

  if (roles && !roles.includes(userRole)) {
    console.log(`ProtectedRoute - User role '${userRole}' not in allowed roles:`, roles);
    return <Redirect to="/unauthorized" />;
  }

  console.log('ProtectedRoute - Access granted, rendering component');
  return (
    <Route
      {...rest}
      render={(props) => (
        <Component {...props} />
      )}
    />
  );
};

export default ProtectedRoute;