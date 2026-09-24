export interface AuthEnv {
  WEBDAV_USERNAME: string;
  WEBDAV_PASSWORD: string;
  FLAREDRIVE_SESSION_SECRET: string;
  WEBDAV_PUBLIC_READ?: string;
}

export const SESSION_COOKIE = "fd_session";
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  if (!secret || secret.length < 32) {
    throw new Error("FlareDrive session secret must contain at least 32 characters");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  );
}

export async function createSessionToken(
  env: AuthEnv,
  options: {
    now?: number;
    ttlSeconds?: number;
    nonce?: Uint8Array;
  } = {}
): Promise<string> {
  const now = options.now ?? Date.now();
  const expiresAt = now + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000;
  const nonce = options.nonce ?? crypto.getRandomValues(new Uint8Array(16));
  const payload = `${expiresAt}.${toHex(nonce)}`;
  return `${payload}.${await sign(payload, env.FLAREDRIVE_SESSION_SECRET)}`;
}

export async function verifySessionToken(
  token: string,
  env: AuthEnv,
  now = Date.now()
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresAtText, nonce, suppliedSignature] = parts;
  const expiresAt = Number(expiresAtText);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    !/^[0-9a-f]{32}$/.test(nonce)
  ) {
    return false;
  }
  try {
    const expectedSignature = await sign(
      `${expiresAtText}.${nonce}`,
      env.FLAREDRIVE_SESSION_SECRET
    );
    return safeEqual(suppliedSignature, expectedSignature);
  } catch {
    return false;
  }
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;
    if (cookie.slice(0, separator).trim() === name) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return null;
}

export function credentialsMatch(
  username: string,
  password: string,
  env: Pick<AuthEnv, "WEBDAV_USERNAME" | "WEBDAV_PASSWORD">
): boolean {
  return (
    safeEqual(username, env.WEBDAV_USERNAME ?? "") &&
    safeEqual(password, env.WEBDAV_PASSWORD ?? "")
  );
}

export function readBasicCredentials(
  request: Request
): { username: string; password: string } | null {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Basic\s+(.+)$/i);
  if (!match) return null;

  try {
    const binary = atob(match[1]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export async function hasValidSession(
  request: Request,
  env: AuthEnv
): Promise<boolean> {
  const supplied = readCookie(request, SESSION_COOKIE);
  if (!supplied || !env.FLAREDRIVE_SESSION_SECRET) return false;
  return verifySessionToken(supplied, env);
}

export async function createSessionCookie(
  request: Request,
  env: AuthEnv
): Promise<string> {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${await createSessionToken(
    env
  )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DEFAULT_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
