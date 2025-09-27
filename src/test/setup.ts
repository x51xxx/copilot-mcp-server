// Global test setup
import { jest } from '@jest/globals';

// Mock child_process by default
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
  },
}));

// Set test timeout
jest.setTimeout(10000);
