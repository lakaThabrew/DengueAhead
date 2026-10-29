import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      MONGODB_URI: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/dengueahead_test',
      NODE_ENV: 'test'
    },
    include: ['src/test/**/*.integration.test.ts']
  }
});
