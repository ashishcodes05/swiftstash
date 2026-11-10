import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.url(),
  ARGON_SECRET: z.string().min(32, 'ARGON_SECRET must be at least 32 characters long'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters long'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_BUCKET_NAME: z.string().min(1, 'AWS_BUCKET_NAME is required'),
  REDIS_URL: z.url('REDIS_URL must be a valid URL').min(1, 'REDIS_URL is required'),
  CORS_ALLOWED_ORIGINS: z.string().default('').refine((origins) =>
    origins.split(',').every((value) => {
      const origin = value.trim();
      if (!origin) return true;

      try {
        const parsed = new URL(origin);
        return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.origin === origin;
      } catch {
        return false;
      }
    }),
  'CORS_ALLOWED_ORIGINS must be a comma-separated list of complete browser origins'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(z.treeifyError(parsedEnv.error))}`);
}

export const env = parsedEnv.data;
