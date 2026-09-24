import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { FormEvent, useEffect, useState } from "react";

interface LoginDialogProps {
  open: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onClose?: () => void;
}

function LoginDialog({ open, onLogin, onClose }: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError("");
    try {
      await onLogin(username.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      onClose={submitting ? undefined : onClose}
      disableEscapeKeyDown={!onClose}
      aria-labelledby="login-dialog-title"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            bgcolor: "#171717",
            color: "white",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <LockOutlinedIcon />
        </Box>
        <Typography
          id="login-dialog-title"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 600, letterSpacing: "-0.6px" }}
        >
          登录 FlareDrive
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          使用部署时配置的 WebDAV 账号进入文件管理。
        </Typography>

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="用户名"
            autoComplete="username"
            autoFocus
            fullWidth
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            label="密码"
            type="password"
            autoComplete="current-password"
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !username.trim() || !password}
            sx={{ mt: 1 }}
          >
            {submitting ? "正在登录…" : "登录"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
