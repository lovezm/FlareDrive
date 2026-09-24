import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthEnv,
  createSessionToken,
  credentialsMatch,
  readBasicCredentials,
  verifySessionToken,
} from "./_auth";

const env: AuthEnv = {
  WEBDAV_USERNAME: "管理者",
  WEBDAV_PASSWORD: "密碼🔐",
  FLAREDRIVE_SESSION_SECRET: "a-separate-random-secret-with-32-bytes",
};

test("session tokens are signed and expire on the server", async () => {
  const token = await createSessionToken(env, {
    now: 1_000,
    ttlSeconds: 60,
    nonce: new Uint8Array(16).fill(7),
  });

  assert.equal(await verifySessionToken(token, env, 60_999), true);
  assert.equal(await verifySessionToken(token, env, 61_001), false);
  assert.equal(await verifySessionToken(`${token}tampered`, env, 2_000), false);
});

test("session tokens require a separate secret", async () => {
  await assert.rejects(
    createSessionToken({ ...env, FLAREDRIVE_SESSION_SECRET: "" }),
    /session secret/i
  );
});

test("Basic Auth parsing supports UTF-8 credentials", () => {
  const encoded = Buffer.from("管理者:密碼🔐", "utf8").toString("base64");
  const request = new Request("https://drive.example/webdav/", {
    headers: { Authorization: `Basic ${encoded}` },
  });

  assert.deepEqual(readBasicCredentials(request), {
    username: "管理者",
    password: "密碼🔐",
  });
  assert.equal(
    credentialsMatch("管理者", "密碼🔐", env),
    true
  );
});

test("invalid Basic Auth is rejected without throwing", () => {
  const request = new Request("https://drive.example/webdav/", {
    headers: { Authorization: "Basic !!!not-base64!!!" },
  });
  assert.equal(readBasicCredentials(request), null);
});
