import { CloudFront } from "@aws-sdk/client-cloudfront";
const cloudFrontClient = new CloudFront({
    region: "us-east-1",
    endpoint: "https://cloudfront.amazonaws.com",
});

export { cloudFrontClient };
