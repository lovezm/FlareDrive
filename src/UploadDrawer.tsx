import React, { useCallback, useMemo } from "react";
import {
  Box,
  ButtonBase,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import {
  CameraAltOutlined as CameraIcon,
  ImageOutlined as ImageIcon,
  UploadFileOutlined as UploadIcon,
} from "@mui/icons-material";
import { useUploadEnqueue } from "./app/transferQueue";

function UploadOption({
  icon,
  caption,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  caption: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        p: 2,
        borderRadius: 2,
        justifyContent: "flex-start",
        textAlign: "left",
        boxShadow: "0 0 0 1px rgba(0,0,0,.08)",
        "&:hover": { bgcolor: "#fafafa" },
      }}
    >
      <Box sx={{ mr: 1.5, color: "text.secondary", display: "grid" }}>{icon}</Box>
      <Box>
        <Typography fontWeight={500}>{caption}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

function UploadDrawer({
  open,
  setOpen,
  cwd,
  onUpload,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  cwd: string;
  onUpload: () => void;
}) {
  const uploadEnqueue = useUploadEnqueue();

  const handleUpload = useCallback(
    (action: "photo" | "media" | "file") => () => {
      const input = document.createElement("input");
      input.type = "file";
      if (action === "photo") {
        input.accept = "image/*";
        input.capture = "environment";
      } else if (action === "media") {
        input.accept = "image/*,video/*";
      } else {
        input.accept = "*/*";
      }
      input.multiple = true;
      input.onchange = () => {
        if (!input.files?.length) return;
        uploadEnqueue(
          ...Array.from(input.files).map((file) => ({ file, basedir: cwd }))
        );
        setOpen(false);
        onUpload();
      };
      input.click();
    },
    [cwd, onUpload, setOpen, uploadEnqueue]
  );

  const takePhoto = useMemo(() => handleUpload("photo"), [handleUpload]);
  const uploadMedia = useMemo(() => handleUpload("media"), [handleUpload]);
  const uploadFile = useMemo(() => handleUpload("file"), [handleUpload]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          borderRadius: "16px 16px 0 0",
          maxWidth: 720,
          mx: "auto",
          p: { xs: 2, sm: 3 },
        },
      }}
    >
      <Typography variant="h6" fontWeight={600}>上传文件</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        文件会上传到当前文件夹，支持多选和拖放上传。
      </Typography>
      <Stack spacing={1.5}>
        <UploadOption
          icon={<UploadIcon />}
          caption="选择文件"
          description="从设备中选择一个或多个文件"
          onClick={uploadFile}
        />
        <UploadOption
          icon={<ImageIcon />}
          caption="图片或视频"
          description="快速筛选相册中的媒体文件"
          onClick={uploadMedia}
        />
        <UploadOption
          icon={<CameraIcon />}
          caption="拍照上传"
          description="在移动设备上打开相机"
          onClick={takePhoto}
        />
      </Stack>
    </Drawer>
  );
}

export default UploadDrawer;
