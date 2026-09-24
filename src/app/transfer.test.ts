import { requireOk } from "./http";

describe("requireOk", () => {
  test("rejects failed upload responses", async () => {
    await expect(
      requireOk(new Response("Unauthorized", { status: 401 }), "上传失败")
    ).rejects.toMatchObject({ status: 401, message: "上传失败" });
  });

  test("returns successful responses", async () => {
    const response = new Response(null, { status: 204 });
    await expect(requireOk(response, "上传失败")).resolves.toBe(response);
  });
});
