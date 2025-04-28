import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const Footer = () => {
  return (
    <footer style={{ padding: '10px 0' }}> {/* Reduced padding */}
      <Container>
        <Row className="justify-content-center">
          <Col className="text-center">
            <div className="copyright">
              © {new Date().getFullYear()}{" "}
              <a href="" target="_blank">MF AutoFinance</a> at <a href="" target="_blank">GMB</a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
