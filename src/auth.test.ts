import { getSessionStatus, login, logout } from "./auth";

describe("session authentication API", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("login sends credentials to the session endpoint without Basic Auth", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await login("admin", "secret");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "secret" }),
      })
    );
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty(
      "Authorization"
    );
  });

  test("login reports invalid credentials", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("Unauthorized", { status: 401 }));

    await expect(login("admin", "wrong")).rejects.toThrow(
      "用户名或密码不正确"
    );
  });

  test("getSessionStatus preserves public-read access for guests", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ authenticated: false, publicRead: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(getSessionStatus()).resolves.toEqual({
      authenticated: false,
      publicRead: true,
    });
  });

  test("logout clears the server session", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({ method: "DELETE", credentials: "same-origin" })
    );
  });
});
