import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  Button
} from '@mui/material';

const WorkflowGuide = ({ onClose }) => {
  const steps = [
    {
      label: "Register Client",
      description: "Add new client with vehicle details and repair information"
    },
    {
      label: "Update Repair Status",
      description: "Track repair progress by updating status as work progresses"
    },
    {
      label: "Mark as Completed",
      description: "When repair is done, mark as 'Completed' to trigger invoice creation"
    },
    {
      label: "Create Invoice",
      description: "Generate invoice for the client with service details"
    },
    {
      label: "Process Payment",
      description: "Record payment and update client payment status"
    }
  ];

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Auto Garage Workflow Guide
      </Typography>
      
      <Stepper orientation="vertical" activeStep={-1}>
        {steps.map((step, index) => (
          <Step key={index} active={true}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              <Typography variant="body2">{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      
      {onClose && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Close</Button>
        </Box>
      )}
    </Paper>
  );
};

export default WorkflowGuide;