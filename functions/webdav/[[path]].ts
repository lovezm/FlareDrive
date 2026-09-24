import { notFound, parseBucketPath } from "./utils";
import { handleRequestCopy } from "./copy";
import { handleRequestDelete } from "./delete";
import { handleRequestGet } from "./get";
import { handleRequestHead } from "./head";
import { handleRequestMkcol } from "./mkcol";
import { handleRequestMove } from "./move";
import { handleRequestPropfind } from "./propfind";
import { handleRequestPut } from "./put";
import { RequestHandlerParams } from "./utils";
import { handleRequestPost } from "./post";
import {
  AuthEnv,
  credentialsMatch,
  hasValidSession,
  readBasicCredentials,
} from "../_auth";

async function handleRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: Object.keys(HANDLERS).join(", "),
      DAV: "1",
    },
  });
}

async function handleMethodNotAllowed() {
  return new Response(null, { status: 405 });
}

const HANDLERS: Record<
  string,
  (context: RequestHandlerParams) => Promise<Response>
> = {
  PROPFIND: handleRequestPropfind,
  MKCOL: handleRequestMkcol,
  HEAD: handleRequestHead,
  GET: handleRequestGet,
  POST: handleRequestPost,
  PUT: handleRequestPut,
  COPY: handleRequestCopy,
  MOVE: handleRequestMove,
  DELETE: handleRequestDelete,
};

export const onRequest: PagesFunction<AuthEnv> = async function (context) {
  const env = context.env;
  const request: Request = context.request;
  if (request.method === "OPTIONS") return handleRequestOptions();

  const skipAuth =
    env.WEBDAV_PUBLIC_READ === "1" &&
    ["GET", "HEAD", "PROPFIND"].includes(request.method);

  if (!skipAuth) {
    if (!env.WEBDAV_USERNAME || !env.WEBDAV_PASSWORD)
      return new Response("WebDAV protocol is not enabled", { status: 403 });

    const sessionAuthorized = await hasValidSession(request, env);
    const basicCredentials = sessionAuthorized
      ? null
      : readBasicCredentials(request);
    const basicAuthorized = basicCredentials
      ? credentialsMatch(
          basicCredentials.username,
          basicCredentials.password,
          env
        )
      : false;

    if (!sessionAuthorized && !basicAuthorized) {
      const isBrowserRequest =
        request.headers.has("Sec-Fetch-Site") ||
        request.headers.get("X-FlareDrive-App") === "1";
      return new Response("Unauthorized", {
        status: 401,
        headers: isBrowserRequest
          ? undefined
          : { "WWW-Authenticate": `Basic realm="WebDAV", charset="UTF-8"` },
      });
    }
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  const method: string = (context.request as Request).method;
  const handler = HANDLERS[method] ?? handleMethodNotAllowed;
  return handler({ bucket, path, request: context.request });
};
