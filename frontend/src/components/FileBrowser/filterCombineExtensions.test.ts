import { expect, test } from "vitest";
import { filterExtensionsAndCombine } from "./Subdirectory";
import type { BucketFile } from "./Subdirectory";

const files: BucketFile[] = [
  {
    name: "f1.a",
    url: "testurl",
  },
  {
    name: "f1.b",
    url: "testurl",
  },
  {
    name: "f1.ab",
    url: "testurl",
  },
  {
    name: "f2.a",
    url: "testurl",
  },
  {
    name: "a",
    url: "testurl",
  },
];

test("Extension Merger Test", () => {
  let f1 = filterExtensionsAndCombine(files, ["a", "b"], true);
  expect(f1).toEqual([
    { name: "f1", url: "testurl", extensions: ["a", "b"] },
    { name: "f2", url: "testurl", extensions: ["a"] },
  ]);

  let f2 = filterExtensionsAndCombine(files, ["a", "b"], false);
  expect(f2).toEqual([
    { name: "f1.a", url: "testurl" },
    { name: "f1.b", url: "testurl" },
    { name: "f2.a", url: "testurl" },
  ]);
});
