import { Grid, Link, Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <footer className="footer">
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item xs={12} xl={6}>
          <Box sx={{ textAlign: { xs: 'center', xl: 'left' } }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()}{" "}
              <Link href="https://mfautosfinance.com/" target="_blank" color="inherit">
                MF AutosFinance
              </Link>
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} xl={6}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', xl: 'flex-end' },
            gap: 2
          }}>
            <Link
              href="https://www.creative-tim.com?ref=adr-admin-footer"
              rel="noopener noreferrer"
              target="_blank"
              color="inherit"
              variant="body2"
            >
              MF AutoFinance
            </Link>

            <Link
              href="https://www.creative-tim.com/presentation?ref=adr-admin-footer"
              rel="noopener noreferrer"
              target="_blank"
              color="inherit"
              variant="body2"
            >
              About Us
            </Link>

            <Link
              href="http://blog.creative-tim.com?ref=adr-admin-footer"
              rel="noopener noreferrer"
              target="_blank"
              color="inherit"
              variant="body2"
            >
              Blog
            </Link>
          </Box>
        </Grid>
      </Grid>
    </footer>
  );
};

export default Footer;
