import { deleteFiles } from "./fileActions";

describe("deleteFiles", () => {
  test("continues after failures and reports only failed keys", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(new Response("failed", { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("missing", { status: 404 }));

    const result = await deleteFiles(
      ["first.txt", "second.txt", "already-gone.txt"],
      fetcher
    );

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.failed).toEqual(["first.txt"]);
  });
});
