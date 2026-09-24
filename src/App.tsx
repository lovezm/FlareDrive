import { ThemeProvider } from "@emotion/react";
import {
  Box,
  CircularProgress,
  createTheme,
  CssBaseline,
  GlobalStyles,
  Snackbar,
  Stack,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";

import Header from "./Header";
import Footer from "./Footer";
import LoginDialog from "./LoginDialog";
import Main from "./Main";
import ProgressDialog from "./ProgressDialog";
import {
  getSessionStatus,
  login,
  logout,
  SessionStatus,
} from "./auth";
import { TransferQueueProvider } from "./app/transferQueue";

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body, #root": { height: "100%" },
      body: { margin: 0 },
      "*": { boxSizing: "border-box" },
      "::selection": { background: "#dbeafe" },
    }}
  />
);

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#171717", contrastText: "#ffffff" },
    error: { main: "#d93036" },
    background: { default: "#fafafa", paper: "#ffffff" },
    text: { primary: "#171717", secondary: "#666666" },
    divider: "#ebebeb",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      "Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, borderRadius: 6 },
        outlined: { borderColor: "#e2e2e2" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow:
            "0 0 0 1px rgba(0,0,0,.08), 0 16px 50px rgba(0,0,0,.16)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          "& fieldset": { borderColor: "#e2e2e2" },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#666666",
          fontSize: 12,
          fontWeight: 500,
          background: "#fafafa",
        },
        root: { borderColor: "#eeeeee" },
      },
    },
  },
});

function App() {
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getSessionStatus()
      .then(setSession)
      .catch(() => setSession({ authenticated: false, publicRead: false }));
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    await login(username, password);
    setSession((current) => ({
      authenticated: true,
      publicRead: current?.publicRead ?? false,
    }));
    setShowLogin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setSearch("");
      setSession((current) => ({
        authenticated: false,
        publicRead: current?.publicRead ?? false,
      }));
      setShowLogin((current) => current || !session?.publicRead);
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error("退出登录失败"));
    }
  }, [session?.publicRead]);

  const handleUnauthorized = useCallback(() => {
    setSearch("");
    setSession((current) => ({
      authenticated: false,
      publicRead: current?.publicRead ?? false,
    }));
    setShowLogin(true);
  }, []);

  const canRead = Boolean(session?.authenticated || session?.publicRead);
  const loginRequired = Boolean(
    session &&
      !session.authenticated &&
      (!session.publicRead || showLogin)
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      {session === null ? (
        <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {canRead && (
            <TransferQueueProvider>
              <Stack sx={{ height: "100%", minHeight: 0 }}>
                <Header
                  search={search}
                  onSearchChange={setSearch}
                  setShowProgressDialog={setShowProgressDialog}
                  authenticated={session.authenticated}
                  onLogin={() => setShowLogin(true)}
                  onLogout={() => void handleLogout()}
                />
                <Main
                  search={search}
                  onError={setError}
                  onUnauthorized={handleUnauthorized}
                  readOnly={!session.authenticated}
                />
                <Footer />
              </Stack>
              <ProgressDialog
                open={showProgressDialog}
                onClose={() => setShowProgressDialog(false)}
              />
            </TransferQueueProvider>
          )}
          <LoginDialog
            open={loginRequired}
            onLogin={handleLogin}
            onClose={session.publicRead ? () => setShowLogin(false) : undefined}
          />
        </>
      )}
      <Snackbar
        autoHideDuration={5000}
        open={Boolean(error)}
        message={error?.message}
        onClose={() => setError(null)}
      />
    </ThemeProvider>
  );
}

export default App;
