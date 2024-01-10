import {
  loadBucketDirectory,
  createBucketFolder,
  getUploadURL,
  deleteBucketFolder,
} from "./bucket";

describe("Bucket file management API", () => {
  it("Loads bucket list correctly", async () => {
    let [files, folders] = await loadBucketDirectory("abc", {});
    expect(files).to.have.length(2);
    expect(files[0].name).equals("file1");
    expect(files[1].url).equals("http://file2");
  });
  it("Can create a new folder", async () => {
    await createBucketFolder("abc", "newfolder");
  });
  it("Can get an upload url", async () => {
    let result = await getUploadURL("abc", "a/b/c");
    expect(result).to.equal("http://signeduploadurl");
  });
});
