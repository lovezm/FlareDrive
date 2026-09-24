import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloudQueueOutlined as CloudIcon,
  LoginOutlined as LoginIcon,
  LogoutOutlined as LogoutIcon,
  Search as SearchIcon,
  SyncOutlined as ProgressIcon,
} from "@mui/icons-material";

function Header({
  search,
  onSearchChange,
  setShowProgressDialog,
  authenticated,
  onLogin,
  onLogout,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  setShowProgressDialog: (show: boolean) => void;
  authenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: "rgba(255,255,255,.92)", boxShadow: "0 1px 0 rgba(0,0,0,.08)" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 72 }, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                bgcolor: "#171717",
                color: "white",
                borderRadius: 1.5,
              }}
            >
              <CloudIcon fontSize="small" />
            </Box>
            <Typography
              variant="h6"
              sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600, letterSpacing: "-0.6px" }}
            >
              FlareDrive
            </Typography>
          </Box>

          <OutlinedInput
            size="small"
            fullWidth
            placeholder="搜索文件和文件夹"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            startAdornment={
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }
            inputProps={{ "aria-label": "搜索文件和文件夹" }}
            sx={{ maxWidth: 620, mx: "auto", bgcolor: "#fafafa" }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <Button
              color="inherit"
              startIcon={<ProgressIcon />}
              onClick={() => setShowProgressDialog(true)}
              sx={{ display: { xs: "none", md: "inline-flex" } }}
            >
              传输记录
            </Button>
            <Tooltip title="传输记录">
              <IconButton
                aria-label="传输记录"
                onClick={() => setShowProgressDialog(true)}
                sx={{ display: { xs: "inline-flex", md: "none" } }}
              >
                <ProgressIcon />
              </IconButton>
            </Tooltip>
            {authenticated ? (
              <Tooltip title="退出登录">
                <IconButton aria-label="退出登录" onClick={onLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Button startIcon={<LoginIcon />} onClick={onLogin}>
                登录管理
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
