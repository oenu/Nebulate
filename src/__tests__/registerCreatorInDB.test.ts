// const mongoose = require('mongoose');
require("dotenv").config("./.env");

// beforeAll(async () => {
//   await mongoose.connect(process.env.DATABASE_TESTING_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true,
//   });
// }

// import registerCreatorInDB from "../Functions/registerCreatorInDB";
// import creator

// describe("registerCreatorInDB", () => {
//   it("should be a function", () => {
//     expect(registerCreatorInDB).toBeInstanceOf(Function);
//   });

//   it ("should throw an error if creator already exists in DB", async () => {
//     const channel_slug = "test";
//     const creator = new Creator({ slug: channel_slug });
//     await creator.save();
//     expect(() => registerCreatorInDB(channel_slug)).toThrow(Error);
//   }
// });

import { MongoClient } from "mongodb";
import registerCreatorInDB from "../Functions/registerCreatorInDB";
import Creator from "../models/creator";

describe("insert", () => {
  let connection: any;
  let db: any;

  it("should be able to find env variables", () => {
    expect(process.env.DATABASE_URI).toBeDefined();
    expect(process.env.DATABASE_TESTING_URI).toBeDefined();
  });

  beforeAll(async () => {
    if (!process.env.DATABASE_TESTING_URI) {
      throw new Error("DATABASE_TESTING_URI not set");
    }
    connection = await MongoClient.connect(process.env.DATABASE_TESTING_URI);
    db = await connection.db();
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should insert a creator into collection", async () => {
    const users = db.collection("users");

    const creator = registerCreatorInDB("test");

    // const insertedUser = await users.findOne({ _id: "some-user-id" });
    // expect(insertedUser).toEqual(mockUser);
  });
});
