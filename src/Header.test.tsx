import { render, screen } from "@testing-library/react";
import Header from "./Header";

test("shows the 星科技下载中心 brand title", () => {
  render(
    <Header
      search=""
      onSearchChange={jest.fn()}
      setShowProgressDialog={jest.fn()}
      authenticated
      onLogin={jest.fn()}
      onLogout={jest.fn()}
    />
  );

  expect(screen.getByText("星科技下载中心")).toBeInTheDocument();
});
