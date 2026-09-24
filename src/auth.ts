export interface SessionStatus {
  authenticated: boolean;
  publicRead: boolean;
}

export async function getSessionStatus(): Promise<SessionStatus> {
  const response = await fetch("/api/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("无法读取登录状态");
  }
  const value = (await response.json()) as Partial<SessionStatus>;
  return {
    authenticated: value.authenticated === true,
    publicRead: value.publicRead === true,
  };
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.status === 401) {
    throw new Error("用户名或密码不正确");
  }
  if (!response.ok) {
    throw new Error("登录服务暂时不可用，请检查会话密钥配置");
  }
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/session", {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("退出登录失败");
}
