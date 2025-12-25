import type { Config } from 'jest';

const baseConfig: Config = {
  rootDir: '../',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFiles: ['./config/jest.setup.ts'],
  // ═══════════════════════════════════════════════════
  // Trasforma uuid per gestire ESM
  // ═══════════════════════════════════════════════════
  transformIgnorePatterns: [
    'node_modules/(?!(.*uuid))',
  ],
  // ═══════════════════════════════════════════════════
  // Workaround per uuid@12 ESM con Jest
  // Basato su: https://github.com/uuidjs/uuid/issues/678
  // ═══════════════════════════════════════════════════
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
};

export default baseConfig;
