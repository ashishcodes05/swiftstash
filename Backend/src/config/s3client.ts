import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

const s3Client = new S3Client({
    region: env.AWS_REGION,
    endpoint: `https://s3.${env.AWS_REGION}.amazonaws.com`,
});

export { s3Client };
