import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../Context/UserContext';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const baseURL = process.env.NODE_ENV === 'production'
  ? ''
  : 'https://localhost:7097';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: '#17a2b8', 
  color: '#ffffff', 
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledListItem = styled(ListItem)(({ theme, isRead }) => ({
  backgroundColor: isRead ? 'inherit' : theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const Notification = () => {
  const { userName, userRole } = useContext(UserContext);
  const history = useHistory();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${baseURL}/api/notification/user/${userName}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          console.error("Failed to fetch notifications");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userName) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    }
  }, [userName]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isReadByUser) {
        await fetch(`${baseURL}/api/notification/read/${notification.id}?username=${userName}`, { 
          method: 'PUT' 
        });
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isReadByUser: true } : n
        ));
      }

      let destinationURL = "/admin/my-request";
      if (userRole === 'Shipper') {
        destinationURL = "/admin/lab-supervisor";
      }

      history.push(destinationURL);
      handleClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isReadByUser).length;

  return (
    <>
      <IconButton
        aria-label="notifications"
        color="inherit"
        onClick={handleOpen}
      >
        <StyledBadge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </StyledBadge>
      </IconButton>
      <StyledDialog
        open={open}
        onClose={handleClose}
        aria-labelledby="notifications-dialog-title"
      >
        <StyledDialogTitle id="notifications-dialog-title">
          <span>Notifications</span>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: '#ffffff',
              marginLeft: 'auto'
            }}
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
        <DialogContent>
          {notifications.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ py: 2 }}>
              No new notifications
            </Typography>
          ) : (
            <List>
              {notifications.map((notification) => (
                <StyledListItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  isRead={notification.isReadByUser}
                  button
                >
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {new Date(notification.createdDateTime).toLocaleString()}
                      </Typography>
                    }
                  />
                </StyledListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </StyledDialog>
    </>
  );
};

export default Notification;