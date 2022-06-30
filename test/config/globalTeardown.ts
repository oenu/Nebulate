import type { MongoMemoryServer } from "mongodb-memory-server";

const config = {
  Memory: true,
  IP: "127.0.0.1",
  Port: "27017",
  Database: "testing",
};
export const globalTeardown = async () => {
  console.log("Teardown");
  if (config.Memory) {
    // Config to decided if an mongodb-memory-server instance should be used
    const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE;
    await instance.stop();
  }
};

export default globalTeardown;
