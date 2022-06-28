const config = {
  preset: "ts-jest",
  globalSetup: "<rootDir>/test/globalSetup.ts",
  globalTeardown: "<rootDir>/test/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/test/setupFile.ts", "dotenv/config"],
  silent: false,
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],

  reporters: ["default", ["jest-junit", { outputDirectory: "./test/reports" }]],
};

export default config;
