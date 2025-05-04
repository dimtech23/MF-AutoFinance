import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Box, 
  Typography,
  Divider
} from '@mui/material';
import { 
  UserPlus, 
  FileText, 
  Tool, 
  DollarSign, 
  Calendar 
} from 'react-feather';
import { useHistory } from 'react-router-dom';

const QuickActionsWidget = () => {
  const history = useHistory();
  
  const handleNavigation = (path) => {
    history.push(path);
  };
  
  return (
    <Card>
      <CardHeader title="Quick Actions" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<UserPlus />} 
            onClick={() => handleNavigation('/admin/clients')}
            fullWidth
          >
            New Client
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Calendar />} 
            onClick={() => handleNavigation('/admin/dashboard')}
            fullWidth
          >
            Appointment Calendar
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FileText />} 
            onClick={() => handleNavigation('/admin/invoices')}
            fullWidth
          >
            Create Invoice
          </Button>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Need help? Click the "System Workflow" button in the header to see a step-by-step guide.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;