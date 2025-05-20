import React from "react";
import {
  DialogTitle,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Security,
  Dashboard,
  People,
  Build,
  AttachMoney,
  Assessment,
  CheckCircle,
} from "@mui/icons-material";

const WorkflowGuide = ({ onClose }) => {
  const sections = [
    {
      title: "Getting Started",
      icon: <Security />,
      steps: [
        "Login with your username and password",
        "Choose your role: Admin, Accountant, or Mechanic",
        "Use the dashboard to access all features"
      ]
    },
    {
      title: "Managing Clients & Services",
      icon: <People />,
      steps: [
        "Add new clients and their vehicles",
        "Schedule service appointments",
        "Update service status as work progresses",
        "Complete service and generate invoice"
      ]
    },
    {
      title: "Handling Finances",
      icon: <AttachMoney />,
      steps: [
        "Create invoices for completed services",
        "Record payments from clients",
        "Track outstanding payments",
        "Generate financial reports when needed"
      ]
    }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: "auto" }}>
      <DialogTitle>
        <Typography variant="h5" component="div" gutterBottom>
          Quick Start Guide
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          How to use the MF Auto Finance System
        </Typography>
      </DialogTitle>

      <Box sx={{ mt: 3 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ mr: 2, color: "primary.main" }}>
                {section.icon}
              </Box>
              <Typography variant="h6" component="div">
                {section.title}
              </Typography>
            </Box>

            <List>
              {section.steps.map((step, stepIndex) => (
                <ListItem key={stepIndex} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <DialogActions sx={{ mt: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Got it
        </Button>
      </DialogActions>
    </Box>
  );
};

export default WorkflowGuide;