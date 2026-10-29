import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[DengueAhead API] Service started on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`[DengueAhead API] Health endpoint available at http://localhost:${env.PORT}${env.API_PREFIX}/health`);
});

