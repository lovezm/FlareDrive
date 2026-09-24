import { Box, Container, Link, Stack, Typography } from "@mui/material";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,
        bgcolor: "#ffffff",
        boxShadow: "0 -1px 0 rgba(0,0,0,.08)",
        py: 1.5,
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} 星科技 · 保留所有权利
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link
              href="https://github.com/lovezm/FlareDrive"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="text.secondary"
              underline="hover"
            >
              GitHub
            </Link>
            <Link
              href="https://xkji.com"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="text.secondary"
              underline="hover"
            >
              星科技官网
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;
