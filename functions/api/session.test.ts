import assert from "node:assert/strict";
import test from "node:test";
import { AuthEnv } from "../_auth";
import {
  onRequestGet,
  onRequestPost,
} from "./session";

const env: AuthEnv = {
  WEBDAV_USERNAME: "admin",
  WEBDAV_PASSWORD: "secret",
  FLAREDRIVE_SESSION_SECRET: "separate-session-secret-at-least-32-bytes",
  WEBDAV_PUBLIC_READ: "1",
};

test("session status reports public-read access without authentication", async () => {
  const response = await onRequestGet({
    request: new Request("https://drive.example/api/session"),
    env,
  } as never);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    authenticated: false,
    publicRead: true,
  });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("session login rejects valid non-object JSON cleanly", async () => {
  const response = await onRequestPost({
    request: new Request("https://drive.example/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    }),
    env,
  } as never);

  assert.equal(response.status, 400);
});

test("successful login issues a cookie accepted by session status", async () => {
  const loginResponse = await onRequestPost({
    request: new Request("https://drive.example/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "secret" }),
    }),
    env,
  } as never);

  assert.equal(loginResponse.status, 204);
  const setCookie = loginResponse.headers.get("Set-Cookie");
  assert.ok(setCookie?.includes("HttpOnly"));
  assert.ok(setCookie?.includes("Secure"));

  const statusResponse = await onRequestGet({
    request: new Request("https://drive.example/api/session", {
      headers: { Cookie: setCookie!.split(";")[0] },
    }),
    env,
  } as never);
  assert.deepEqual(await statusResponse.json(), {
    authenticated: true,
    publicRead: true,
  });
});
