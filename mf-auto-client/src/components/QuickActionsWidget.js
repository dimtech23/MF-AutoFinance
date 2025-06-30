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
  
  const handleActionClick = (path) => {
    history.push(path);
  };
  
  return (
    <Card>
      <CardHeader 
        title={
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Quick Actions
          </Typography>
        } 
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<UserPlus size={20} />} 
            onClick={() => handleActionClick('/admin/clients')}
            fullWidth
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            New Client
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Calendar size={20} />} 
            onClick={() => handleActionClick('/admin/dashboard')}
            fullWidth
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Appointment Calendar
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FileText size={20} />} 
            onClick={() => handleActionClick('/admin/invoices')}
            fullWidth
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Create Invoice
          </Button>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.4
            }}
          >
            Need help? Click the "System Workflow" button in the header to see a step-by-step guide.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;