// Status mapping constants
export const STATUS_MAPS = {
    // Client repair status to appointment status
    repairToAppointment: {
      waiting: 'scheduled',
      in_progress: 'in_progress',
      completed: 'completed',
      delivered: 'completed',
      cancelled: 'cancelled'
    },
    
    // Appointment status to client repair status
    appointmentToRepair: {
      scheduled: 'waiting',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled'
    },
    
    // Client repair status to invoice status
    repairToInvoice: {
      waiting: 'draft',
      in_progress: 'draft',
      completed: 'pending',
      delivered: 'pending',
      cancelled: 'cancelled'
    },
    
    // Payment status mapping
    invoiceToPayment: {
      paid: 'paid',
      pending: 'not_paid',
      draft: 'not_paid',
      overdue: 'not_paid',
      cancelled: 'not_paid'
    }
  };
  
  // Get color for status based on type
  export const getStatusColor = (status, type) => {
    if (type === 'repair' || type === 'client') {
      switch (status) {
        case 'waiting': return 'warning';
        case 'in_progress': return 'info';
        case 'completed': return 'success';
        case 'delivered': return 'primary';
        case 'cancelled': return 'error';
        default: return 'default';
      }
    }
    
    if (type === 'appointment') {
      switch (status) {
        case 'scheduled': return 'primary';
        case 'in_progress': return 'info';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        case 'waiting': return 'warning';
        default: return 'default';
      }
    }
    
    if (type === 'payment') {
      switch (status) {
        case 'paid': return 'success';
        case 'not_paid': return 'error';
        case 'partial': return 'warning';
        default: return 'default';
      }
    }
    
    if (type === 'invoice') {
      switch (status) {
        case 'draft': return 'default';
        case 'pending': return 'warning';
        case 'paid': return 'success';
        case 'overdue': return 'error';
        case 'cancelled': return 'error';
        default: return 'default';
      }
    }
    
    return 'default';
  };
  
  // Map status from one type to another
  export const mapStatus = (status, fromType, toType) => {
    let mapKey;
    
    if (fromType === 'repair' && toType === 'appointment') {
      mapKey = 'repairToAppointment';
    } else if (fromType === 'appointment' && toType === 'repair') {
      mapKey = 'appointmentToRepair';
    } else if (fromType === 'repair' && toType === 'invoice') {
      mapKey = 'repairToInvoice';
    } else if (fromType === 'invoice' && toType === 'payment') {
      mapKey = 'invoiceToPayment';
    } else {
      return status; // No mapping defined
    }
    
    return STATUS_MAPS[mapKey][status] || status;
  };
  
  // Function to get appropriate icon component (you'll need to import these)
  export const getStatusIcon = (status, type) => {
    if (type === 'repair' || type === 'client') {
      switch (status) {
        case 'waiting': return 'Clock';
        case 'in_progress': return 'Tool';
        case 'completed': return 'Check';
        case 'delivered': return 'CheckCircle';
        case 'cancelled': return 'X';
        default: return null;
      }
    }
    
    if (type === 'payment') {
      switch (status) {
        case 'paid': return 'CheckCircle';
        case 'not_paid': return 'XCircle';
        case 'partial': return 'DollarSign';
        default: return null;
      }
    }
    
    return null;
  };
  
  // Check if a status change should trigger invoice creation
  export const shouldCreateInvoice = (oldStatus, newStatus) => {
    return (oldStatus !== 'completed' && oldStatus !== 'delivered') && 
           (newStatus === 'completed' || newStatus === 'delivered');
  };

// Add the mapRepairStatusToAppointmentStatus export
export const mapRepairStatusToAppointmentStatus = {
  waiting: "scheduled",
  in_progress: "in_progress",
  completed: "completed",
  delivered: "completed",
  cancelled: "cancelled",
};