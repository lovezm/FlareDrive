import {
  Button,
  IconButton,
  Paper,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  DriveFileRenameOutline as RenameIcon,
  ShareOutlined as ShareIcon,
} from "@mui/icons-material";

function MultiSelectToolbar({
  multiSelected,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onShare,
}: {
  multiSelected: string[] | null;
  onClose: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const count = multiSelected?.length ?? 0;
  const single = count === 1;

  return (
    <Slide direction="up" in={count > 0} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%) !important",
          zIndex: 1200,
          width: "min(680px, calc(100% - 32px))",
          px: 1.5,
          py: 1,
          borderRadius: 2,
          boxShadow:
            "0 0 0 1px rgba(0,0,0,.10), 0 12px 32px rgba(0,0,0,.14)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="取消选择" size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" fontWeight={500} sx={{ mr: "auto !important" }}>
            已选择 {count} 项
          </Typography>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            disabled={!single}
            onClick={onDownload}
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          >
            下载
          </Button>
          <Button
            size="small"
            startIcon={<RenameIcon />}
            disabled={!single}
            onClick={onRename}
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          >
            重命名
          </Button>
          <IconButton aria-label="分享" size="small" disabled={!single} onClick={onShare}>
            <ShareIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
          >
            删除
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
}

export default MultiSelectToolbar;
