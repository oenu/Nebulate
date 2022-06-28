const config = {
  preset: "ts-jest",
  globalSetup: "<rootDir>/test/globalSetup.ts",
  globalTeardown: "<rootDir>/test/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/test/setupFile.ts"],
  silent: false,
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],

  reporters: ["default", "jest-junit"],
};

export default config;
