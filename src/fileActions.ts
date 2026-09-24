type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export async function deleteFiles(
  keys: string[],
  fetcher: Fetcher = fetch
): Promise<{ failed: string[] }> {
  const failed: string[] = [];
  for (const key of keys) {
    try {
      const response = await fetcher(`/webdav/${encodeKey(key)}`, {
        method: "DELETE",
        headers: { "X-FlareDrive-App": "1" },
      });
      if (!response.ok && response.status !== 404) failed.push(key);
    } catch {
      failed.push(key);
    }
  }
  return { failed };
}
