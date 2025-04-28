import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../Context/UserContext'; // Adjust the import path as necessary
import Button from '@mui/material/Button'; // Import your preferred button component

const LogoutButton = () => {
  const { logout } = useContext(UserContext);
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/auth/login');
  };

  return (
    <Button onClick={handleLogout} color="inherit">
      Logout
    </Button>
  );
};

export default LogoutButton;
