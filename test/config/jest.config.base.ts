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
  // Trasforma anche i moduli ESM come uuid@12
  // ═══════════════════════════════════════════════════
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
};

export default baseConfig;
