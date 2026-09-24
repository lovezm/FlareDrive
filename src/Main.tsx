import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CreateNewFolderOutlined as CreateFolderIcon,
  DescriptionOutlined as NoteIcon,
  HomeOutlined as HomeIcon,
  UploadOutlined as UploadIcon,
} from "@mui/icons-material";

import FileGrid, {
  encodeKey,
  extractFilename,
  FileItem,
  isDirectory,
} from "./FileGrid";
import MultiSelectToolbar from "./MultiSelectToolbar";
import UploadDrawer from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import {
  copyPaste,
  createFolder,
  fetchPath,
  HttpError,
} from "./app/transfer";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import { deleteFiles } from "./fileActions";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
      {children}
    </Box>
  );
}

function PathBreadcrumb({
  path,
  onCwdChange,
}: {
  path: string;
  onCwdChange: (newCwd: string) => void;
}) {
  const parts = path.replace(/\/$/, "").split("/").filter(Boolean);

  return (
    <Breadcrumbs separator="/" aria-label="当前路径">
      <Link
        component="button"
        type="button"
        color={parts.length ? "text.secondary" : "text.primary"}
        underline="hover"
        onClick={() => onCwdChange("")}
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
      >
        <HomeIcon fontSize="small" />
        我的文件
      </Link>
      {parts.map((part, index) => {
        const last = index === parts.length - 1;
        return last ? (
          <Typography key={`${part}-${index}`} color="text.primary" fontWeight={500}>
            {part}
          </Typography>
        ) : (
          <Link
            key={`${part}-${index}`}
            component="button"
            type="button"
            color="text.secondary"
            underline="hover"
            onClick={() =>
              onCwdChange(`${parts.slice(0, index + 1).join("/")}/`)
            }
          >
            {part}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

function NameDialog({
  open,
  title,
  label,
  value,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  label: string;
  value: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <Box
        component="form"
        onSubmit={async (event: React.FormEvent) => {
          event.preventDefault();
          setSubmitting(true);
          try {
            await onSubmit();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={label}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            fullWidth
            inputProps={{ maxLength: 255 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>取消</Button>
          <Button type="submit" variant="contained" disabled={submitting || !value.trim()}>
            {submitting ? "处理中…" : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function Main({
  search,
  onError,
  onUnauthorized,
  readOnly = false,
}: {
  search: string;
  onError: (error: Error) => void;
  onUnauthorized: () => void;
  readOnly?: boolean;
}) {
  const [cwd, setCwd] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [multiSelected, setMultiSelected] = useState<string[] | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showTextPadDrawer, setShowTextPadDrawer] = useState(false);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteKeys, setDeleteKeys] = useState<string[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const transferQueue = useTransferQueue();
  const uploadEnqueue = useUploadEnqueue();

  const fetchFiles = useCallback(async () => {
    try {
      const nextFiles = await fetchPath(cwd);
      setFiles(nextFiles);
      setMultiSelected(null);
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error("读取文件失败");
      if (error instanceof HttpError && error.status === 401) onUnauthorized();
      else onError(error);
    } finally {
      setLoading(false);
    }
  }, [cwd, onError, onUnauthorized]);

  useEffect(() => {
    setLoading(true);
    void fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!transferQueue.length) return;
    const lastFile = transferQueue[transferQueue.length - 1];
    if (["pending", "in-progress"].includes(lastFile.status)) {
      setLastUploadKey(lastFile.remoteKey);
    } else if (lastUploadKey) {
      void fetchFiles();
      setLastUploadKey(null);
    }
  }, [fetchFiles, lastUploadKey, transferQueue]);

  const filteredFiles = useMemo(
    () =>
      (search
        ? files.filter((file) =>
            file.key.toLowerCase().includes(search.toLowerCase())
          )
        : files
      ).sort((a, b) =>
        isDirectory(a) === isDirectory(b) ? 0 : isDirectory(a) ? -1 : 1
      ),
    [files, search]
  );

  const handleMultiSelect = useCallback((key: string) => {
    setMultiSelected((previous) => {
      if (previous === null) return [key];
      if (previous.includes(key)) {
        const updated = previous.filter((item) => item !== key);
        return updated.length ? updated : null;
      }
      return [...previous, key];
    });
  }, []);

  const download = (key: string) => {
    const anchor = document.createElement("a");
    anchor.href = `/webdav/${encodeKey(key)}`;
    anchor.download = extractFilename(key);
    anchor.click();
  };

  const requestRename = (key: string) => {
    setRenameKey(key);
    setRenameValue(extractFilename(key));
  };

  const requestDelete = (keys: string[]) => setDeleteKeys(keys);

  const deleteSelected = async () => {
    const { failed } = await deleteFiles(deleteKeys);
    setDeleteKeys(failed);
    await fetchFiles();
    if (failed.length) {
      onError(new Error(`${failed.length} 个项目删除失败，请重试`));
    }
  };

  return (
    <Box
      component="main"
      sx={{ flex: 1, overflowY: "auto", bgcolor: "#fafafa", py: { xs: 2, sm: 4 } }}
      onDragEnter={(event) => {
        if (readOnly) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (readOnly) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (readOnly) return;
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        if (readOnly) return;
        event.preventDefault();
        setDragging(false);
        uploadEnqueue(
          ...Array.from(event.dataTransfer.files).map((file) => ({ file, basedir: cwd }))
        );
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2}
          >
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                文件管理
              </Typography>
              <PathBreadcrumb path={cwd} onCwdChange={setCwd} />
            </Box>
            {readOnly ? (
              <Typography variant="body2" color="text.secondary">
                当前为只读访问，登录后可上传和管理文件
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setShowUploadDrawer(true)}
                >
                  上传
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CreateFolderIcon />}
                  onClick={() => {
                    setNewFolderName("");
                    setNewFolderOpen(true);
                  }}
                >
                  新建文件夹
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NoteIcon />}
                  onClick={() => setShowTextPadDrawer(true)}
                >
                  新建文本
                </Button>
              </Stack>
            )}
          </Stack>

          {dragging && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: "center",
                color: "primary.main",
                bgcolor: "#f0f7ff",
                boxShadow: "0 0 0 1px #0a72ef",
              }}
            >
              松开鼠标即可上传到当前文件夹
            </Paper>
          )}

          {loading ? (
            <Centered><CircularProgress size={28} /></Centered>
          ) : (
            <FileGrid
              files={filteredFiles}
              onCwdChange={setCwd}
              multiSelected={multiSelected}
              onMultiSelect={handleMultiSelect}
              onDownload={download}
              onRename={requestRename}
              onDelete={(key) => requestDelete([key])}
              readOnly={readOnly}
              emptyMessage={
                <Paper
                  elevation={0}
                  sx={{
                    minHeight: 280,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    color: "text.secondary",
                    boxShadow: "0 0 0 1px rgba(0,0,0,.08)",
                  }}
                >
                  <Box>
                    <Typography color="text.primary" fontWeight={500}>
                      {search ? "没有匹配的文件" : "此文件夹为空"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {search
                        ? "请尝试其他关键词"
                        : readOnly
                        ? "当前目录暂无可查看的文件"
                        : "拖入文件，或点击上传按钮"}
                    </Typography>
                  </Box>
                </Paper>
              }
            />
          )}
        </Stack>
      </Container>

      <UploadDrawer
        open={!readOnly && showUploadDrawer}
        setOpen={setShowUploadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />
      <TextPadDrawer
        open={!readOnly && showTextPadDrawer}
        setOpen={setShowTextPadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />

      <MultiSelectToolbar
        multiSelected={readOnly ? null : multiSelected}
        onClose={() => setMultiSelected(null)}
        onDownload={() => multiSelected?.length === 1 && download(multiSelected[0])}
        onRename={() => multiSelected?.length === 1 && requestRename(multiSelected[0])}
        onDelete={() => multiSelected?.length && requestDelete(multiSelected)}
        onShare={() => {
          if (multiSelected?.length !== 1) return;
          const url = new URL(`/webdav/${encodeKey(multiSelected[0])}`, window.location.href);
          if (navigator.share) void navigator.share({ url: url.toString() });
          else void navigator.clipboard.writeText(url.toString());
        }}
      />

      <NameDialog
        open={!readOnly && newFolderOpen}
        title="新建文件夹"
        label="文件夹名称"
        value={newFolderName}
        submitLabel="创建"
        onChange={setNewFolderName}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={async () => {
          try {
            await createFolder(cwd, newFolderName);
            setNewFolderOpen(false);
            await fetchFiles();
          } catch (reason) {
            onError(reason instanceof Error ? reason : new Error("创建文件夹失败"));
          }
        }}
      />

      <NameDialog
        open={!readOnly && Boolean(renameKey)}
        title="重命名"
        label="新名称"
        value={renameValue}
        submitLabel="保存"
        onChange={setRenameValue}
        onClose={() => setRenameKey(null)}
        onSubmit={async () => {
          if (!renameKey) return;
          try {
            await copyPaste(renameKey, `${cwd}${renameValue.trim()}`, true);
            setRenameKey(null);
            await fetchFiles();
          } catch (reason) {
            onError(reason instanceof Error ? reason : new Error("重命名失败"));
          }
        }}
      />

      <Dialog
        open={!readOnly && deleteKeys.length > 0}
        onClose={() => setDeleteKeys([])}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>确认永久删除？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            将删除 {deleteKeys.length} 个项目。文件夹中的内容也会一并删除，此操作无法撤销。
          </DialogContentText>
          <Box component="ul" sx={{ pl: 2.5, mb: 0, color: "text.primary" }}>
            {deleteKeys.slice(0, 5).map((key) => (
              <li key={key}>{extractFilename(key)}</li>
            ))}
            {deleteKeys.length > 5 && <li>以及其他 {deleteKeys.length - 5} 个项目</li>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteKeys([])}>取消</Button>
          <Button color="error" variant="contained" onClick={() => void deleteSelected()}>
            永久删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Main;
