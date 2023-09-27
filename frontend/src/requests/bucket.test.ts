import {
  loadBucketDirectory,
  createBucketFolder,
  getUploadURL,
  deleteBucketFolder,
} from "./bucket";

describe("Bucket file management API", () => {
  it("Loads bucket list correctly", async () => {
    let [files, folders] = await loadBucketDirectory("abc", {
      bucket: "galatea",
    });
    expect(files).toHaveLength(2);
    expect(files[0].name).equals("file1");
    expect(files[1].url).equals("http://file2");
  });
});
