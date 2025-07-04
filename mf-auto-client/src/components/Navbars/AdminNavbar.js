import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import Notification from "../Notification";
import WorkflowGuide from "../../components/WorkflowGuide";
import {
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Navbar,
  Nav,
  Container,
  Modal,
  ModalHeader,
  ModalBody,
  Button,
} from "reactstrap";

import {
  Dialog,
  DialogContent
} from "@mui/material";
import { Box, Typography } from "@mui/material";
import { User, Wrench, DollarSign, Truck, Menu, X } from "lucide-react";

// Import CSS for navbar styling
import "./AdminNavbar.css";

const WorkflowDiagram = () => (
  <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
    <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4, color: 'primary.main', fontWeight: 'bold' }}>
      Service Workflow Guide
    </Typography>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 3,
      '& .step': {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        },
        '& .icon': {
          p: 1.5,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        },
        '& .content': {
          flex: 1,
          '& .title': {
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: '1.1rem',
            mb: 0.5
          },
          '& .description': {
            color: 'text.secondary',
            fontSize: '0.95rem',
            lineHeight: 1.5
          }
        }
      }
    }}>
      <Box className="step">
        <Box className="icon"><User size={24} /></Box>
        <Box className="content">
          <Typography className="title">1. Client Registration & Assessment</Typography>
          <Typography className="description">
            • Register new client details and vehicle information<br />
            • Document initial vehicle condition with photos<br />
            • Record service requirements and estimated costs<br />
            • Schedule service appointment
          </Typography>
        </Box>
      </Box>
      
      <Box className="step">
        <Box className="icon"><Wrench size={24} /></Box>
        <Box className="content">
          <Typography className="title">2. Service & Repair Process</Typography>
          <Typography className="description">
            • Perform detailed diagnostic assessment<br />
            • Order required parts if necessary<br />
            • Complete repairs and maintenance work<br />
            • Update service status and progress
          </Typography>
        </Box>
      </Box>
      
      <Box className="step">
        <Box className="icon"><DollarSign size={24} /></Box>
        <Box className="content">
          <Typography className="title">3. Payment & Documentation</Typography>
          <Typography className="description">
            • Generate detailed service invoice<br />
            • Process client payment<br />
            • Update payment status<br />
            • Prepare delivery documentation
          </Typography>
        </Box>
      </Box>
      
      <Box className="step">
        <Box className="icon"><Truck size={24} /></Box>
        <Box className="content">
          <Typography className="title">4. Delivery & Handover</Typography>
          <Typography className="description">
            • Complete final vehicle inspection<br />
            • Document vehicle condition with photos<br />
            • Verify all repairs and services<br />
            • Hand over vehicle to client with documentation
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);
  
const AdminNavbar = (props) => {
  const { userName, logout } = useContext(UserContext);
  const history = useHistory();
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    history.push("/auth/login");
  };

  const toggleWorkflow = () => {
    setIsWorkflowOpen(!isWorkflowOpen);
  };

  // Use the toggleSidebar function passed from Admin layout
  const toggleSidebar = () => {
    console.log('Navbar toggleSidebar called');
    if (props.toggleSidebar) {
      props.toggleSidebar();
    } else {
      console.warn('toggleSidebar prop not passed to AdminNavbar');
    }
  };

  return (
    <>
      <Navbar className="navbar-top navbar-white" expand="md" id="navbar-main">
        <Container fluid className="px-3 py-1">
          {/* Left side - Brand and Sidebar Toggle */}
          <div className="d-flex align-items-center">
            {/* Mobile Sidebar Toggle Button */}
            <button 
              className="navbar-toggler border-0 me-3"
              type="button" 
              onClick={toggleSidebar}
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <Menu size={16} />
            </button>

            {/* Brand Text - Only show on desktop */}
            <span className="h6 mb-0 text-white text-uppercase d-none d-lg-inline-block">
              {props.brandText}
            </span>
          </div>

          {/* Right side - Navigation Items */}
          <div className="d-flex align-items-center">
            {/* Desktop Navigation */}
            <div className="d-none d-md-flex align-items-center">
              <Button
                className="navbar-btn me-2"
                color="info"
                size="sm"
                onClick={toggleWorkflow}
              >
                <i className="ni ni-chart-bar-32 me-1"></i> 
                <span className="d-none d-lg-inline">System Workflow</span>
                <span className="d-lg-none">Workflow</span>
              </Button>

              <Button 
                className="navbar-btn me-2"
                color="info" 
                size="sm" 
                onClick={() => setShowGuide(true)}
              >
                <i className="ni ni-bullet-list-67 me-1"></i> 
                <span className="d-none d-lg-inline">Guide</span>
              </Button>

              <div className="me-2">
                <Notification setOpenedCollapse={props.setOpenedCollapse} />
              </div>

              {/* User Dropdown - Clean display */}
              {userName && (
                <UncontrolledDropdown nav>
                  <DropdownToggle className="navbar-dropdown pr-0 d-flex align-items-center" nav>
                    <span className="mb-0 text-white font-bold">
                      <i className="ni ni-circle-08 me-1"></i> 
                      <span className="d-none d-lg-inline">{userName}</span>
                      <span className="d-lg-none">User</span>
                    </span>
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-menu-arrow" right>
                    <DropdownItem href="#pablo" onClick={handleLogout}>
                      <i className="ni ni-user-run me-2"></i>
                      <span>Logout</span>
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              )}
            </div>

            {/* Mobile Navigation - Simplified */}
            <div className="d-flex d-md-none align-items-center">
              <Button
                className="navbar-btn-mobile me-1"
                color="info"
                size="sm"
                onClick={toggleWorkflow}
                title="System Workflow"
              >
                <i className="ni ni-chart-bar-32"></i>
              </Button>

              <Button
                className="navbar-btn-mobile me-1"
                color="info"
                size="sm"
                onClick={() => setShowGuide(true)}
                title="Guide"
              >
                <i className="ni ni-bullet-list-67"></i>
              </Button>

              <div className="me-1">
                <Notification setOpenedCollapse={props.setOpenedCollapse} />
              </div>

              {/* Mobile User Display - Simplified */}
              {userName && (
                <UncontrolledDropdown nav>
                  <DropdownToggle className="navbar-btn-mobile" nav>
                    <i className="ni ni-circle-08"></i>
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-menu-arrow" right>
                    <DropdownItem href="#pablo" onClick={handleLogout}>
                      <i className="ni ni-user-run me-2"></i>
                      <span>Logout</span>
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              )}
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Workflow Diagram Modal */}
      <Modal
        isOpen={isWorkflowOpen}
        toggle={toggleWorkflow}
        size="lg"
        className="modal-dialog-centered"
      >
        <ModalHeader toggle={toggleWorkflow}>
          System Workflow Diagram
        </ModalHeader>
        <ModalBody>
          <WorkflowDiagram />
        </ModalBody>
      </Modal>

      {/* Dialog for guide */}
      <Dialog
        open={showGuide}
        onClose={() => setShowGuide(false)}
        maxWidth="md"
      >
        <DialogContent>
          <WorkflowGuide onClose={() => setShowGuide(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminNavbar;