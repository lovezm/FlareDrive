import { fireEvent, render, screen } from "@testing-library/react";
import FileGrid, { FileItem } from "./FileGrid";

const files: FileItem[] = [
  {
    key: "Documents",
    size: 0,
    uploaded: "2025-01-02T03:04:05.000Z",
    httpMetadata: { contentType: "application/x-directory" },
  },
  {
    key: "report.pdf",
    size: 2048,
    uploaded: "2025-01-03T03:04:05.000Z",
    httpMetadata: { contentType: "application/pdf" },
  },
];

describe("FileGrid list view", () => {
  test("renders management columns and per-row actions", () => {
    render(
      <FileGrid
        files={files}
        onCwdChange={jest.fn()}
        multiSelected={null}
        onMultiSelect={jest.fn()}
        onDownload={jest.fn()}
        onRename={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "大小" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "修改时间" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 report.pdf" })).toBeInTheDocument();
  });

  test("opens a folder once when its name is double-clicked", () => {
    const onCwdChange = jest.fn();
    render(
      <FileGrid
        files={files}
        onCwdChange={onCwdChange}
        multiSelected={null}
        onMultiSelect={jest.fn()}
        onDownload={jest.fn()}
        onRename={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    const folderName = screen.getByRole("button", { name: "Documents" });
    fireEvent.click(folderName);
    fireEvent.click(folderName);
    expect(onCwdChange).toHaveBeenCalledTimes(1);
    expect(onCwdChange).toHaveBeenCalledWith("Documents/");
  });

  test("public-read mode hides selection and management actions", () => {
    render(
      <FileGrid
        files={files}
        onCwdChange={jest.fn()}
        multiSelected={null}
        onMultiSelect={jest.fn()}
        onDownload={jest.fn()}
        onRename={jest.fn()}
        onDelete={jest.fn()}
        readOnly
      />
    );

    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "删除 report.pdf" })).not.toBeInTheDocument();
  });
});
