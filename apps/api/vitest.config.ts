import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Set env vars needed by env.ts so unit tests don't call process.exit
    env: {
      MONGODB_URI: 'mongodb://localhost:27017/dengueahead_test',
      NODE_ENV: 'test'
    },
    include: ['src/test/**/*.test.ts'],
    exclude: ['src/test/**/*.integration.test.ts']
  }
});
