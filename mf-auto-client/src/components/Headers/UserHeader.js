import React from "react";
import { Button, Container, Grid, Typography, Box } from "@mui/material";

const UserHeader = () => {
  return (
    <div
      className="header pb-4 pt-4 pt-lg-7 d-flex align-items-center"
      style={{
        minHeight: "3      00px",
        backgroundImage:
          "url(" + require("../../assets/img/theme/profile-cover.jpg") + ")",
        backgroundSize: "cover",
        backgroundPosition: "center top"
      }}
    >
      {/* Mask */}
      <span className="mask bg-gradient-default opacity-8" />
      {/* Header container */}
      <Container maxWidth={false} sx={{ display: 'flex', alignItems: 'center' }}>
        <Grid container>
          <Grid item lg={7} md={10}>
            <Typography variant="h2" sx={{ color: 'white' }}>
              Hello Jesse
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mt: 0, mb: 4 }}>
              This is your profile page. You can see the progress you've made
              with your work and manage your projects or assigned tasks
            </Typography>
            <Button
              variant="contained"
              color="info"
              href="#pablo"
              onClick={(e) => e.preventDefault()}
            >
              Edit profile
            </Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default UserHeader;
