const config = {
  preset: "ts-jest",
  globalSetup: "<rootDir>/test/config//globalSetup.ts",
  globalTeardown: "<rootDir>/test/config/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/test/config/setupFile.ts", "dotenv/config"],
  silent: false,
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  watchPathIgnorePatterns: ["globalConfig"],
  reporters: ["default", ["jest-junit", { outputDirectory: "./test/reports" }]],
};

export default config;
