import { CloudFront } from "@aws-sdk/client-cloudfront";
import { env } from "./env.js";

const cloudFrontClient = new CloudFront({
    region: "us-east-1",
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
});

export { cloudFrontClient };