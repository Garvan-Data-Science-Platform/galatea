import { rest } from "msw";

const bucketList = {
  files: [
    {
      name: "file1",
      url: "http://file1",
    },
    {
      name: "file2",
      url: "http://file2",
    },
  ],
  folders: ["folder1", "folder2", "folder3"],
};

export const restHandlers = [
  rest.get("http://localhost:8000/bucket", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(bucketList));
  }),
  rest.get("http://localhost:8000/bucket/upload", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ url: "http://signeduploadurl" }));
  }),
  rest.put(
    "http://localhost:8000/bucket/folder?folderName=newfolder",
    (req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.post("http://signeduploadurl", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: "ok" }));
  }),
  rest.delete("http://localhost:8000/bucket/folder", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: "ok" }));
  }),
];
