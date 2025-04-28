import { useState, useContext } from "react";
import { NavLink as NavLinkRRD, Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { UserContext } from 'Context/UserContext';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Collapse,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
    DropdownToggle,
    FormGroup,
    Form,
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    Media,
    NavbarBrand,
    Navbar,
    NavItem,
    NavLink,
    Nav,
    Progress,
    Table,
    Container,
    Row,
    Col
} from "reactstrap";

const Sidebar = ({ bgColor, routes = [], logo, closeCollapse }) => {
    const { userRole } = useContext(UserContext);
    const [collapseOpen, setCollapseOpen] = useState(false);
    const location = useLocation();

    const activeRoute = (routeName) => {
        return location.pathname.indexOf(routeName) > -1 ? "active" : "";
    };

    const toggleCollapse = () => {
        setCollapseOpen((data) => !data);
    };

    const closeSidebarCollapse = () => {
        setCollapseOpen(false);
    };

    const createLinks = (routes) => {
        console.log("Routes in Sidebar: ", routes);
        return routes
            .filter(route => Array.isArray(route.roles) && route.roles.includes(userRole))
            .map((prop, key) => (
                <NavItem key={key}>
                    <NavLink
                        to={prop.layout + prop.path}
                        tag={NavLinkRRD}
                        onClick={closeCollapse || closeSidebarCollapse}
                        activeClassName="active"
                    >
                        <i className={prop.icon} />
                        {prop.name}
                    </NavLink>
                </NavItem>
            ));
    };

    let navbarBrandProps;
    if (logo && logo.innerLink) {
        navbarBrandProps = {
            to: logo.innerLink,
            tag: Link
        };
    } else if (logo && logo.outterLink) {
        navbarBrandProps = {
            href: logo.outterLink,
            target: "_blank"
        };
    }

    return (
        <Navbar className="navbar-vertical fixed-left navbar-light bg-white" expand="md" id="sidenav-main">
            <Container fluid>
                <button className="navbar-toggler" type="button" onClick={toggleCollapse}>
                    <span className="navbar-toggler-icon" />
                </button>
                <NavbarBrand className="pt-0" {...navbarBrandProps}>
    <img
        alt="MF-Autos Garage Logo"
        className="navbar-brand-img"
        src="https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg"
        style={{ maxHeight: '100%', maxWidth: '75%', height: 'auto' }}
    />
</NavbarBrand>

                <Nav className="align-items-center d-md-none">
                    <UncontrolledDropdown nav>
                        <DropdownToggle nav className="nav-link-icon">
                            <i className="ni ni-bell-55" />
                        </DropdownToggle>
                        <DropdownMenu aria-labelledby="navbar-default_dropdown_1" className="dropdown-menu-arrow" right>
                            <DropdownItem>Action</DropdownItem>
                            <DropdownItem>Another action</DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem>Something else here</DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                    <UncontrolledDropdown nav>
                        <DropdownToggle nav>
                            <Media className="align-items-center">
                                <span className="avatar avatar-sm rounded-circle">
                                    <img alt="..." src={require("../../assets/img/theme/team-1-800x800.jpg")} />
                                </span>
                            </Media>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-arrow" right>
                            <DropdownItem className="noti-title" header tag="div">
                                <h6 className="text-overflow m-0">Welcome!</h6>
                            </DropdownItem>
                            <DropdownItem to="/admin/user-profile" tag={Link}>
                                <i className="ni ni-single-02" />
                                <span>My profile</span>
                            </DropdownItem>
                            <DropdownItem to="/admin/user-profile" tag={Link}>
                                <i className="ni ni-settings-gear-65" />
                                <span>Settings</span>
                            </DropdownItem>
                            <DropdownItem to="/admin/user-profile" tag={Link}>
                                <i className="ni ni-calendar-grid-58" />
                                <span>Activity</span>
                            </DropdownItem>
                            <DropdownItem to="/admin/user-profile" tag={Link}>
                                <i className="ni ni-support-16" />
                                <span>Support</span>
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem href="#pablo" onClick={(e) => e.preventDefault()}>
                                <i className="ni ni-user-run" />
                                <span>Logout</span>
                            </DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </Nav>
                <Collapse navbar isOpen={collapseOpen}>
                    <div className="navbar-collapse-header d-md-none">
                        <Row>
                            {logo ? (
                                <Col className="collapse-brand" xs="6">
                                    {logo.innerLink ? (
                                        <Link to={logo.innerLink}>
                                            <img alt={logo.imgAlt} src={logo.imgSrc} />
                                        </Link>
                                    ) : (
                                        <a href={logo.outterLink}>
                                            <img alt={logo.imgAlt} src={logo.imgSrc} />
                                        </a>
                                    )}
                                </Col>
                            ) : null}
                            <Col className="collapse-close" xs="6">
                                <button className="navbar-toggler" type="button" onClick={toggleCollapse}>
                                    <span />
                                    <span />
                                </button>
                            </Col>
                        </Row>
                    </div>
                    <Form className="mt-4 mb-3 d-md-none">
                        <InputGroup className="input-group-rounded input-group-merge">
                            <Input
                                aria-label="Search"
                                className="form-control-rounded form-control-prepended"
                                placeholder="Search"
                                type="search"
                            />
                            <InputGroupAddon addonType="prepend">
                                <InputGroupText>
                                    <span className="fa fa-search" />
                                </InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    </Form>
                    <Nav navbar>{createLinks(routes)}</Nav>
                    <hr className="my-3" />
                </Collapse>
            </Container>
        </Navbar>
    );
};

Sidebar.propTypes = {
    bgColor: PropTypes.string,
    routes: PropTypes.arrayOf(PropTypes.object),
    logo: PropTypes.shape({
        innerLink: PropTypes.string,
        outterLink: PropTypes.string,
        imgSrc: PropTypes.string.isRequired,
        imgAlt: PropTypes.string.isRequired
    }),
    closeCollapse: PropTypes.func
};

export default Sidebar;
