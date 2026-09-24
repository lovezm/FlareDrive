import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  test("shows copyright and project links", () => {
    render(<Footer />);

    expect(screen.getByText(/© .* 星科技 · 保留所有权利/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/lovezm/FlareDrive"
    );
    expect(screen.getByRole("link", { name: "星科技官网" })).toHaveAttribute(
      "href",
      "https://xkji.com"
    );
  });
});
