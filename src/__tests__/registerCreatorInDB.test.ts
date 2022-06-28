import registerCreatorInDB from "../Functions/registerCreatorInDB";

describe("registerCreatorInDB", () => {
  it("should be a function", () => {
    expect(registerCreatorInDB).toBeInstanceOf(Function);
  });


  it ("should throw an error if creator already exists in DB", async () => {
    const channel_slug = "test";
    const creator = new Creator({ slug: channel_slug });
    await creator.save();
    expect(() => registerCreatorInDB(channel_slug)).toThrow(Error);
  }
});
