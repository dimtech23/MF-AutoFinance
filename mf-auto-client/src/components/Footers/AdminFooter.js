
import { Container, Row, Col, Nav, NavItem, NavLink } from "reactstrap";

const Footer = () => {
  return (
    <footer className="footer">
      <Row className="align-items-center justify-content-xl-between">
        <Col xl="6">
          <div className="copyright text-center text-xl-left text-muted">
            © {new Date().getFullYear()}{" "}
            <a href="" target="_blank">Garage</a> at <a href="" target="_blank">GMB</a>
          </div>
        </Col>

        <Col xl="6">
          <Nav className="nav-footer justify-content-center justify-content-xl-end">
            <NavItem>
              <NavLink
                href="https://www.creative-tim.com?ref=adr-admin-footer"
                rel="noopener noreferrer"
                target="_blank"
              >
                MF AutoFinance
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="https://www.creative-tim.com/presentation?ref=adr-admin-footer"
                rel="noopener noreferrer"
                target="_blank"
              >
                About Us
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="http://blog.creative-tim.com?ref=adr-admin-footer"
                rel="noopener noreferrer"
                target="_blank"
              >
                Blog
              </NavLink>
            </NavItem>

         
          </Nav>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;
