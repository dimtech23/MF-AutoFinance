import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../../Context/UserContext';
import Notification from '../Notification';
import { DropdownMenu, DropdownItem, UncontrolledDropdown, DropdownToggle, Navbar, Nav, Container } from 'reactstrap';

const AdminNavbar = (props) => {
  const { userName, logout } = useContext(UserContext);
  const history = useHistory();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    history.push('/auth/login');
  };

  return (
    <Navbar className="navbar-top navbar-white" expand="md" id="navbar-main">
      <Container fluid>
        <span className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block">
          {props.brandText}
        </span> 
        <Nav className="align-items-center d-none d-md-flex" navbar>
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
  );
};

export default AdminNavbar;
