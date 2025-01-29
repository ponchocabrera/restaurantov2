// File: src/lib/openai.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // from your .env
});

export const openai = new OpenAIApi(configuration);
