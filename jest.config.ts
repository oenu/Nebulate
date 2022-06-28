// jest.config.ts
import type { InitialOptionsTsJest } from "ts-jest";
// import { defaults as tsjPreset } from "ts-jest/presets";
// import { defaultsESM as tsjPreset } from 'ts-jest/presets'
// import { jsWithTs as tsjPreset } from 'ts-jest/presets'
// import { jsWithTsESM as tsjPreset } from 'ts-jest/presets'
// import { jsWithBabel as tsjPreset } from 'ts-jest/presets'
// import { jsWithBabelESM as tsjPreset } from 'ts-jest/presets'

const config: InitialOptionsTsJest = {
  silent: false,
  // setupFiles: ["dotenv/config"],
  // preset: "@shelf/jest-mongodb",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  // transform: {
  //   ...tsjPreset.transform,
  // },
};

export default config;
