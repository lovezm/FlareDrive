import {
  AuthEnv,
  clearSessionCookie,
  createSessionCookie,
  credentialsMatch,
  hasValidSession,
} from "../_auth";

type SessionEnv = AuthEnv;

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export const onRequestGet: PagesFunction<SessionEnv> = async ({
  request,
  env,
}) => {
  const authenticated = await hasValidSession(request, env);
  return new Response(
    JSON.stringify({
      authenticated,
      publicRead: env.WEBDAV_PUBLIC_READ === "1",
    }),
    { status: 200, headers: jsonHeaders }
  );
};

export const onRequestPost: PagesFunction<SessionEnv> = async ({
  request,
  env,
}) => {
  if (
    !env.WEBDAV_USERNAME ||
    !env.WEBDAV_PASSWORD ||
    !env.FLAREDRIVE_SESSION_SECRET ||
    env.FLAREDRIVE_SESSION_SECRET.length < 32
  ) {
    return new Response(JSON.stringify({ error: "Authentication is not configured" }), {
      status: 503,
      headers: jsonHeaders,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  const values = body as Record<string, unknown>;
  const username = typeof values.username === "string" ? values.username : "";
  const password = typeof values.password === "string" ? values.password : "";
  if (!credentialsMatch(username, password, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": await createSessionCookie(request, env),
    },
  });
};

export const onRequestDelete: PagesFunction<SessionEnv> = async ({
  request,
}) =>
  new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": clearSessionCookie(request),
    },
  });
