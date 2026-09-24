import assert from "node:assert/strict";
import test from "node:test";
import { handleRequestDelete } from "./delete";

test("folder deletion lists and removes all nested descendants recursively", async () => {
  const deleted: string[] = [];
  let listOptions: Record<string, unknown> | undefined;
  const bucket = {
    head: async () => ({
      httpMetadata: { contentType: "application/x-directory" },
    }),
    delete: async (key: string) => {
      deleted.push(key);
    },
    list: async (options: Record<string, unknown>) => {
      listOptions = options;
      return {
        objects: [{ key: "folder/child/grandchild.txt" }],
        truncated: false,
      };
    },
  };

  const response = await handleRequestDelete({
    bucket: bucket as unknown as R2Bucket,
    path: "folder",
    request: new Request("https://drive.example/webdav/folder", {
      method: "DELETE",
    }),
  });

  assert.equal(response.status, 204);
  assert.equal(listOptions?.prefix, "folder/");
  assert.equal(listOptions?.delimiter, undefined);
  assert.deepEqual(deleted, ["folder", "folder/child/grandchild.txt"]);
});
