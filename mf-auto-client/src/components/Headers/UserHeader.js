import React from "react";
import { Button, Container, Row, Col } from "reactstrap";

const UserHeader = () => {
  return (
    <div
      className="header pb-4 pt-4 pt-lg-7 d-flex align-items-center"
      style={{
        minHeight: "300px",
        backgroundImage:
          "url(" + require("../../assets/img/theme/profile-cover.jpg") + ")",
        backgroundSize: "cover",
        backgroundPosition: "center top"
      }}
    >
      {/* Mask */}
      <span className="mask bg-gradient-default opacity-8" />
      {/* Header container */}
      <Container className="d-flex align-items-center" fluid>
        <Row>
          <Col lg="7" md="10">
            <h1 className="display-3 text-white">Hello Jesse</h1>
            <p className="text-white mt-0 mb-4">
              This is your profile page. You can see the progress you've made
              with your work and manage your projects or assigned tasks
            </p>
            <Button
              color="info"
              href="#pablo"
              onClick={(e) => e.preventDefault()}
            >
              Edit profile
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserHeader;
