import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginDialog from "./LoginDialog";

describe("LoginDialog", () => {
  test("collects credentials in an application modal", async () => {
    const onLogin = jest.fn().mockResolvedValue(undefined);
    render(<LoginDialog open onLogin={onLogin} />);

    expect(screen.getByRole("dialog", { name: "登录 FlareDrive" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("用户名"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith("admin", "secret"));
  });

  test("shows a login error and keeps the dialog open", async () => {
    const onLogin = jest.fn().mockRejectedValue(new Error("用户名或密码不正确"));
    render(<LoginDialog open onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("用户名"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByText("用户名或密码不正确")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
