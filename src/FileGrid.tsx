import React, { useRef } from "react";
import {
  Box,
  Checkbox,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  DriveFileRenameOutline as RenameIcon,
} from "@mui/icons-material";
import MimeIcon from "./MimeIcon";
import { humanReadableSize } from "./app/utils";

export interface FileItem {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: { contentType: string };
  customMetadata?: { thumbnail?: string };
}

export function extractFilename(key: string) {
  return key.replace(/\/$/, "").split("/").pop() ?? key;
}

export function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function isDirectory(file: FileItem) {
  return file.httpMetadata?.contentType === "application/x-directory";
}

interface FileGridProps {
  files: FileItem[];
  onCwdChange: (newCwd: string) => void;
  multiSelected: string[] | null;
  onMultiSelect: (key: string) => void;
  onDownload: (key: string) => void;
  onRename: (key: string) => void;
  onDelete: (key: string) => void;
  readOnly?: boolean;
  emptyMessage?: React.ReactNode;
}

function FileGrid({
  files,
  onCwdChange,
  multiSelected,
  onMultiSelect,
  onDownload,
  onRename,
  onDelete,
  readOnly = false,
  emptyMessage,
}: FileGridProps) {
  const lastOpened = useRef<{ key: string; at: number } | null>(null);
  if (files.length === 0) return <>{emptyMessage}</>;

  const openItem = (file: FileItem) => {
    const now = Date.now();
    if (
      lastOpened.current?.key === file.key &&
      now - lastOpened.current.at < 500
    ) {
      return;
    }
    lastOpened.current = { key: file.key, at: now };
    if (isDirectory(file)) {
      onCwdChange(`${file.key.replace(/\/$/, "")}/`);
    } else {
      window.open(
        `/webdav/${encodeKey(file.key)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        overflowX: "auto",
        borderRadius: 2,
        boxShadow:
          "0 0 0 1px rgba(0,0,0,.08), 0 2px 2px rgba(0,0,0,.04)",
      }}
    >
      <Table aria-label="文件列表" sx={{ minWidth: { xs: 0, sm: 680 } }}>
        <TableHead>
          <TableRow>
            {!readOnly && (
              <TableCell padding="checkbox" aria-label="选择" />
            )}
            <TableCell>名称</TableCell>
            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
              大小
            </TableCell>
            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
              修改时间
            </TableCell>
            {!readOnly && <TableCell align="right">操作</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => {
            const name = extractFilename(file.key);
            const selected = multiSelected?.includes(file.key) ?? false;
            return (
              <TableRow
                key={file.key}
                hover
                selected={!readOnly && selected}
                sx={{
                  cursor: isDirectory(file) ? "pointer" : "default",
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                {!readOnly && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected}
                      onChange={() => onMultiSelect(file.key)}
                      inputProps={{ "aria-label": `选择 ${name}` }}
                    />
                  </TableCell>
                )}
                <TableCell component="th" scope="row">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        flex: "0 0 auto",
                        display: "grid",
                        placeItems: "center",
                        color: isDirectory(file) ? "#0a72ef" : "text.secondary",
                        "& svg": { fontSize: 30 },
                      }}
                    >
                      {file.customMetadata?.thumbnail ? (
                        <Box
                          component="img"
                          src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
                          alt=""
                          sx={{
                            width: 36,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        <MimeIcon contentType={file.httpMetadata.contentType} />
                      )}
                    </Box>
                    <Link
                      component="button"
                      type="button"
                      underline="hover"
                      color="text.primary"
                      onClick={() => openItem(file)}
                      sx={{
                        maxWidth: { xs: 145, sm: 340 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <Typography variant="body2" color="text.secondary">
                    {isDirectory(file) ? "—" : humanReadableSize(file.size)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(file.uploaded).toLocaleString()}
                  </Typography>
                </TableCell>
                {!readOnly && (
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {!isDirectory(file) && (
                      <Tooltip title="下载">
                        <IconButton
                          size="small"
                          aria-label={`下载 ${name}`}
                          onClick={() => onDownload(file.key)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="重命名">
                      <IconButton
                        size="small"
                        aria-label={`重命名 ${name}`}
                        onClick={() => onRename(file.key)}
                      >
                        <RenameIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`删除 ${name}`}
                        onClick={() => onDelete(file.key)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FileGrid;
