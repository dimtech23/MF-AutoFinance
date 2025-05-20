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

const WorkflowDiagram = () => (
  <svg
    viewBox="0 0 800 1080"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "auto" }}
  >
    {/* Background */}
    <rect x="0" y="0" width="800" height="1080" fill="#f8f9fa" />

    {/* Title */}
    <text
      x="400"
      y="40"
      fontFamily="Arial"
      fontSize="24"
      fontWeight="bold"
      textAnchor="middle"
      fill="#333"
    >
      MF Auto Finance System Workflow
    </text>

    {/* USER AUTHENTICATION SECTION */}
    <rect
      x="50"
      y="80"
      width="700"
      height="120"
      rx="10"
      fill="#e3f2fd"
      stroke="#1976d2"
      strokeWidth="2"
    />
    <text
      x="400"
      y="105"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#1976d2"
    >
      Authentication & Authorization
    </text>

    {/* Authentication Components */}
    <rect
      x="100"
      y="125"
      width="120"
      height="50"
      rx="5"
      fill="#bbdefb"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="160" y="155" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Login
    </text>

    <rect
      x="250"
      y="125"
      width="120"
      height="50"
      rx="5"
      fill="#bbdefb"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="310" y="155" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Role Management
    </text>

    <rect
      x="400"
      y="125"
      width="120"
      height="50"
      rx="5"
      fill="#bbdefb"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="460" y="155" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Access Control
    </text>

    <rect
      x="550"
      y="125"
      width="120"
      height="50"
      rx="5"
      fill="#bbdefb"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="610" y="155" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Session Management
    </text>

    {/* DASHBOARD SECTIONS */}
    <rect
      x="50"
      y="220"
      width="700"
      height="140"
      rx="10"
      fill="#e8f5e9"
      stroke="#388e3c"
      strokeWidth="2"
    />
    <text
      x="400"
      y="245"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#388e3c"
    >
      Dashboard & Analytics
    </text>

    {/* Dashboard Components */}
    <rect
      x="80"
      y="265"
      width="120"
      height="60"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="140" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Financial
    </text>
    <text x="140" y="315" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Overview
    </text>

    <rect
      x="230"
      y="265"
      width="120"
      height="60"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="290" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service
    </text>
    <text x="290" y="315" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Analytics
    </text>

    <rect
      x="380"
      y="265"
      width="160"
      height="60"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="460" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Appointment
    </text>
    <text x="460" y="315" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Calendar
    </text>

    <rect
      x="570"
      y="265"
      width="120"
      height="60"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="630" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Performance
    </text>
    <text x="630" y="315" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Metrics
    </text>

    {/* CLIENT MANAGEMENT SECTION */}
    <rect
      x="50"
      y="380"
      width="700"
      height="140"
      rx="10"
      fill="#fff3e0"
      stroke="#f57c00"
      strokeWidth="2"
    />
    <text
      x="400"
      y="405"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#f57c00"
    >
      Client & Vehicle Management
    </text>

    {/* Client Management Components */}
    <rect
      x="80"
      y="430"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="140" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Client
    </text>
    <text x="140" y="475" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Registration
    </text>

    <rect
      x="230"
      y="430"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="290" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Vehicle
    </text>
    <text x="290" y="475" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Information
    </text>

    <rect
      x="380"
      y="430"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="440" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service
    </text>
    <text x="440" y="475" fontFamily="Arial" fontSize="14" textAnchor="middle">
      History
    </text>

    <rect
      x="530"
      y="430"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="590" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Document
    </text>
    <text x="590" y="475" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Management
    </text>

    {/* APPOINTMENT MANAGEMENT SECTION */}
    <rect
      x="50"
      y="540"
      width="700"
      height="140"
      rx="10"
      fill="#e1f5fe"
      stroke="#0288d1"
      strokeWidth="2"
    />
    <text
      x="400"
      y="565"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#0288d1"
    >
      Service & Appointment Management
    </text>

    {/* Appointment Management Components */}
    <rect
      x="80"
      y="590"
      width="120"
      height="60"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="140" y="615" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service
    </text>
    <text x="140" y="635" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Scheduling
    </text>

    <rect
      x="230"
      y="590"
      width="160"
      height="60"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="310" y="615" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service Status
    </text>
    <text x="310" y="635" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Tracking
    </text>

    <rect
      x="420"
      y="590"
      width="120"
      height="60"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="480" y="615" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Quality
    </text>
    <text x="480" y="635" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Control
    </text>

    <rect
      x="570"
      y="590"
      width="120"
      height="60"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="630" y="615" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service
    </text>
    <text x="630" y="635" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Completion
    </text>

    {/* FINANCIAL MANAGEMENT SECTION */}
    <rect
      x="50"
      y="700"
      width="700"
      height="140"
      rx="10"
      fill="#fce4ec"
      stroke="#c2185b"
      strokeWidth="2"
    />
    <text
      x="400"
      y="725"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#c2185b"
    >
      Financial Management
    </text>

    {/* Financial Components */}
    <rect
      x="80"
      y="750"
      width="120"
      height="60"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="140" y="775" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Invoice
    </text>
    <text x="140" y="795" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Generation
    </text>

    <rect
      x="230"
      y="750"
      width="120"
      height="60"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="290" y="775" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Payment
    </text>
    <text x="290" y="795" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Processing
    </text>

    <rect
      x="380"
      y="750"
      width="120"
      height="60"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="440" y="775" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Tax
    </text>
    <text x="440" y="795" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Management
    </text>

    <rect
      x="530"
      y="750"
      width="120"
      height="60"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="590" y="775" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Budget
    </text>
    <text x="590" y="795" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Control
    </text>

    {/* REPORTS & ANALYTICS SECTION */}
    <rect
      x="50"
      y="860"
      width="700"
      height="140"
      rx="10"
      fill="#f3e5f5"
      stroke="#9c27b0"
      strokeWidth="2"
    />
    <text
      x="400"
      y="885"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#9c27b0"
    >
      Reports & Analytics
    </text>

    {/* Reports Components */}
    <rect
      x="80"
      y="910"
      width="120"
      height="60"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="140" y="935" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Financial
    </text>
    <text x="140" y="955" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Reports
    </text>

    <rect
      x="230"
      y="910"
      width="120"
      height="60"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="290" y="935" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Performance
    </text>
    <text x="290" y="955" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Analytics
    </text>

    <rect
      x="380"
      y="910"
      width="120"
      height="60"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="440" y="935" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Trend
    </text>
    <text x="440" y="955" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Analysis
    </text>

    <rect
      x="530"
      y="910"
      width="120"
      height="60"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="590" y="935" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Export &
    </text>
    <text x="590" y="955" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Sharing
    </text>

    {/* Flow Arrows */}
    {/* Auth to Dashboard */}
    <path
      d="M 400 200 L 400 220"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Dashboard to Client Mgmt */}
    <path
      d="M 400 360 L 400 380"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Client Mgmt to Service */}
    <path
      d="M 400 520 L 400 540"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Service to Financial */}
    <path
      d="M 400 680 L 400 700"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Financial to Reports */}
    <path
      d="M 400 840 L 400 860"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Dashboard to Service (side connection) */}
    <path
      d="M 460 315 L 460 400 L 500 400 L 500 540"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      strokeDasharray="5,5"
    />

    {/* Client Mgmt to Financial (direct line) */}
    <path
      d="M 590 510 L 590 600 L 590 700"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      strokeDasharray="5,5"
    />

    {/* Dashboard to Reports (direct line) */}
    <path
      d="M 140 360 L 140 700 L 140 860"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      strokeDasharray="5,5"
    />

    {/* Arrowhead definition */}
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
      </marker>
    </defs>

    {/* Legend */}
    <rect
      x="50"
      y="1020"
      width="700"
      height="40"
      rx="5"
      fill="#f5f5f5"
      stroke="#aaaaaa"
      strokeWidth="1"
    />

    <rect
      x="100"
      y="1030"
      width="15"
      height="15"
      fill="#e3f2fd"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="120" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Authentication
    </text>

    <rect
      x="220"
      y="1030"
      width="15"
      height="15"
      fill="#e8f5e9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="240" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Dashboard
    </text>

    <rect
      x="320"
      y="1030"
      width="15"
      height="15"
      fill="#fff3e0"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="340" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Client Management
    </text>

    <rect
      x="460"
      y="1030"
      width="15"
      height="15"
      fill="#e1f5fe"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="480" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Service Management
    </text>

    <rect
      x="580"
      y="1030"
      width="15"
      height="15"
      fill="#fce4ec"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="600" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Financial
    </text>

    <rect
      x="660"
      y="1030"
      width="15"
      height="15"
      fill="#f3e5f5"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="680" y="1043" fontFamily="Arial" fontSize="12" fill="#333">
      Reports
    </text>
  </svg>
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