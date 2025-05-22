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
import { User, Wrench, DollarSign, Truck } from "lucide-react";

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

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidenav-main');
    if (sidebar) {
      sidebar.classList.toggle('show');
    }
  };

  return (
    <>
      <Navbar className="navbar-top navbar-white" expand="md" id="navbar-main">
        <Container fluid className="px-3 py-2">
          {/* Mobile Menu Button with Tailwind classes */}
          <button 
            className="navbar-toggler block md:hidden border-0 p-2 focus:outline-none"
            type="button" 
            onClick={toggleSidebar}
          >
            <span className="navbar-toggler-icon text-xl"></span>
          </button>

          <span className="h4 mb-0 text-white text-uppercase hidden lg:inline-block">
            {props.brandText}
          </span>

          {/* Desktop Navigation */}
          <Nav className="items-center hidden md:flex" navbar>
            <Button
              className="mr-3 shadow-sm hover:shadow-md transition-all duration-200 text-base"
              color="info"
              size="sm"
              onClick={toggleWorkflow}
            >
              <i className="ni ni-chart-bar-32 mr-1 text-lg"></i> System Workflow
            </Button>

            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-200 text-base"
              color="info" 
              size="sm" 
              onClick={() => setShowGuide(true)}
            >
              <i className="ni ni-bullet-list-67 mr-1 text-lg"></i> Guide
            </Button>

            <div className="ml-3">
              <Notification setOpenedCollapse={props.setOpenedCollapse} />
            </div>

            {userName && (
              <UncontrolledDropdown nav className="ml-3">
                <DropdownToggle className="pr-0 flex items-center" nav>
                  <span className="mb-0 text-white font-bold text-base">
                    <i className="ni ni-circle-08 mr-1 text-lg"></i> {userName}
                  </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-arrow" right>
                  <DropdownItem href="#pablo" onClick={handleLogout}>
                    <i className="ni ni-user-run mr-2 text-lg"></i>
                    <span className="text-base">Logout</span>
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            )}
          </Nav>

          {/* Mobile Navigation with Tailwind - Larger icons */}
          <div className="flex items-center ml-auto md:hidden">
            <Button
              className="p-0 w-10 h-10 flex items-center justify-center mx-1 shadow-sm"
              color="info"
              size="sm"
              onClick={toggleWorkflow}
            >
              <i className="ni ni-chart-bar-32 text-lg"></i>
            </Button>

            <Button
              className="p-0 w-10 h-10 flex items-center justify-center mx-1 shadow-sm"
              color="info"
              size="sm"
              onClick={() => setShowGuide(true)}
            >
              <i className="ni ni-bullet-list-67 text-lg"></i>
            </Button>

            <div className="mx-1">
              <Notification setOpenedCollapse={props.setOpenedCollapse} />
            </div>

            <Button
              className="p-0 w-10 h-10 flex items-center justify-center mx-1 shadow-sm"
              color="danger"
              size="sm"
              onClick={handleLogout}
            >
              <i className="ni ni-user-run text-lg"></i>
            </Button>
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