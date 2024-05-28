import { configureGenkit } from '@genkit-ai/core';
import { vertexAI } from '@genkit-ai/vertexai';

export default configureGenkit({
  plugins: [
    vertexAI({ location: 'us-central1' }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
