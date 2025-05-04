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
    viewBox="0 0 800 980"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "auto" }}
  >
    {/* Background */}
    <rect x="0" y="0" width="800" height="980" fill="#f8f9fa" />

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
      Auto Garage Management System Flow
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
      User Authentication
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
      Registration
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
      User Management
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
      Logout
    </text>

    {/* DASHBOARD SECTION */}
    <rect
      x="50"
      y="220"
      width="700"
      height="120"
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
      Dashboard
    </text>

    {/* Dashboard Components */}
    <rect
      x="80"
      y="265"
      width="120"
      height="50"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="140" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Financial Stats
    </text>

    <rect
      x="230"
      y="265"
      width="120"
      height="50"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="290" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Service Stats
    </text>

    <rect
      x="380"
      y="265"
      width="160"
      height="50"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="460" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Appointment Calendar
    </text>

    <rect
      x="570"
      y="265"
      width="120"
      height="50"
      rx="5"
      fill="#c8e6c9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="630" y="295" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Recent Activity
    </text>

    {/* CLIENT MANAGEMENT SECTION */}
    <rect
      x="50"
      y="360"
      width="700"
      height="140"
      rx="10"
      fill="#fff3e0"
      stroke="#f57c00"
      strokeWidth="2"
    />
    <text
      x="400"
      y="385"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#f57c00"
    >
      Client Management
    </text>

    {/* Client Management Components */}
    <rect
      x="80"
      y="410"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="140" y="435" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Client
    </text>
    <text x="140" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Registration
    </text>

    <rect
      x="230"
      y="410"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="290" y="435" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Vehicle
    </text>
    <text x="290" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Details
    </text>

    <rect
      x="380"
      y="410"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="440" y="435" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Repair Status
    </text>
    <text x="440" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Tracking
    </text>

    <rect
      x="530"
      y="410"
      width="120"
      height="60"
      rx="5"
      fill="#ffe0b2"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="590" y="435" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Payment
    </text>
    <text x="590" y="455" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Status
    </text>

    {/* APPOINTMENT MANAGEMENT SECTION */}
    <rect
      x="50"
      y="520"
      width="700"
      height="120"
      rx="10"
      fill="#e1f5fe"
      stroke="#0288d1"
      strokeWidth="2"
    />
    <text
      x="400"
      y="545"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#0288d1"
    >
      Appointment Management
    </text>

    {/* Appointment Management Components */}
    <rect
      x="80"
      y="565"
      width="120"
      height="50"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="140" y="595" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Scheduling
    </text>

    <rect
      x="230"
      y="565"
      width="160"
      height="50"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="310" y="595" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Calendar Integration
    </text>

    <rect
      x="420"
      y="565"
      width="120"
      height="50"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="480" y="595" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Notifications
    </text>

    <rect
      x="570"
      y="565"
      width="120"
      height="50"
      rx="5"
      fill="#b3e5fc"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="630" y="595" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Status Updates
    </text>

    {/* INVOICING & FINANCIAL SECTION */}
    <rect
      x="50"
      y="660"
      width="700"
      height="120"
      rx="10"
      fill="#fce4ec"
      stroke="#c2185b"
      strokeWidth="2"
    />
    <text
      x="400"
      y="685"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#c2185b"
    >
      Invoicing & Financial Management
    </text>

    {/* Invoicing Components */}
    <rect
      x="80"
      y="705"
      width="120"
      height="50"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="140" y="735" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Invoice Creation
    </text>

    <rect
      x="230"
      y="705"
      width="120"
      height="50"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="290" y="735" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Payment Processing
    </text>

    <rect
      x="380"
      y="705"
      width="120"
      height="50"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="440" y="735" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Budget Management
    </text>

    <rect
      x="530"
      y="705"
      width="120"
      height="50"
      rx="5"
      fill="#f8bbd0"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="590" y="735" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Financial Reports
    </text>

    {/* REPORTS SECTION */}
    <rect
      x="50"
      y="800"
      width="700"
      height="120"
      rx="10"
      fill="#f3e5f5"
      stroke="#9c27b0"
      strokeWidth="2"
    />
    <text
      x="400"
      y="825"
      fontFamily="Arial"
      fontSize="18"
      fontWeight="bold"
      textAnchor="middle"
      fill="#9c27b0"
    >
      Financial Reports
    </text>

    {/* Reports Components */}
    <rect
      x="80"
      y="845"
      width="120"
      height="50"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="140" y="875" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Income Statement
    </text>

    <rect
      x="230"
      y="845"
      width="120"
      height="50"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="290" y="875" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Cash Flow
    </text>

    <rect
      x="380"
      y="845"
      width="120"
      height="50"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="440" y="875" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Balance Sheet
    </text>

    <rect
      x="530"
      y="845"
      width="120"
      height="50"
      rx="5"
      fill="#e1bee7"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="590" y="875" fontFamily="Arial" fontSize="14" textAnchor="middle">
      Export & Print
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
      d="M 400 340 L 400 360"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Client Mgmt to Appointment */}
    <path
      d="M 400 500 L 400 520"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Appointment to Invoicing */}
    <path
      d="M 400 640 L 400 660"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Invoicing to Reports */}
    <path
      d="M 400 780 L 400 800"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />

    {/* Dashboard to Appointment (side connection) */}
    <path
      d="M 460 315 L 460 400 L 500 400 L 500 520"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      strokeDasharray="5,5"
    />

    {/* Client Mgmt to Invoicing (direct line) */}
    <path
      d="M 590 470 L 590 550 L 590 660"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      strokeDasharray="5,5"
    />

    {/* Dashboard to Reports (direct line) */}
    <path
      d="M 140 340 L 140 700 L 140 800"
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

    {/* Legend - without the "Legend" text */}
    <rect
      x="50"
      y="940"
      width="700"
      height="30"
      rx="5"
      fill="#f5f5f5"
      stroke="#aaaaaa"
      strokeWidth="1"
    />

    <rect
      x="100"
      y="940"
      width="15"
      height="15"
      fill="#e3f2fd"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <text x="120" y="953" fontFamily="Arial" fontSize="12" fill="#333">
      Authentication
    </text>

    <rect
      x="220"
      y="940"
      width="15"
      height="15"
      fill="#e8f5e9"
      stroke="#388e3c"
      strokeWidth="1"
    />
    <text x="240" y="953" fontFamily="Arial" fontSize="12" fill="#333">
      Dashboard
    </text>

    <rect
      x="320"
      y="940"
      width="15"
      height="15"
      fill="#fff3e0"
      stroke="#f57c00"
      strokeWidth="1"
    />
    <text x="340" y="953" fontFamily="Arial" fontSize="12" fill="#333">
      Client Management
    </text>

    <rect
      x="460"
      y="940"
      width="15"
      height="15"
      fill="#e1f5fe"
      stroke="#0288d1"
      strokeWidth="1"
    />
    <text x="480" y="953" fontFamily="Arial" fontSize="12" fill="#333">
      Appointment
    </text>

    <rect
      x="560"
      y="940"
      width="15"
      height="15"
      fill="#fce4ec"
      stroke="#c2185b"
      strokeWidth="1"
    />
    <text x="580" y="953" fontFamily="Arial" fontSize="12" fill="#333">
      Invoicing
    </text>

    <rect
      x="640"
      y="940"
      width="15"
      height="15"
      fill="#f3e5f5"
      stroke="#9c27b0"
      strokeWidth="1"
    />
    <text x="660" y="953" fontFamily="Arial" fontSize="12" fill="#333">
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

  return (
    <>
      <Navbar className="navbar-top navbar-white" expand="md" id="navbar-main">
        <Container fluid>
          <span className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block">
            {props.brandText}
          </span>
          <Nav className="align-items-center d-none d-md-flex" navbar>
            <Button
              className="mr-3"
              color="info"
              size="sm"
              onClick={toggleWorkflow}
            >
              <i className="ni ni-chart-bar-32 mr-1"></i> System Workflow
            </Button>

            <Button color="info" size="sm" onClick={() => setShowGuide(true)}>
              <i className="ni ni-bullet-list-67 mr-1"></i>  Guide
            </Button>

            <Notification setOpenedCollapse={props.setOpenedCollapse} />

            {userName && (
              <UncontrolledDropdown nav>
                <DropdownToggle className="pr-0" nav>
                  <span className="mb-0 text-white font-weight-bold">
                    Logout
                  </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-arrow" right>
                  <DropdownItem href="#pablo" onClick={handleLogout}>
                    <i className="ni ni-user-run" />
                    <span>Logout</span>
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            )}
          </Nav>
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


  {/* Dialog for guide  */}
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
