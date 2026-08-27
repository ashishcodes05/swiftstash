import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getSignedUrlFromCloudFront } from "@aws-sdk/cloudfront-signer";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { s3Client } from "../../config/s3client.js";
import type { FileMetadata } from "./file.types.js";
import { DirectoryRepository } from "../directory/directory.repository.js";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { cloudFrontClient } from "../../config/cloudFrontClient.js";

export class StorageService {
    static async getFilePath(fileId: string, extension: string, parentDirectoryId: string, userId: string): Promise<string> {
        const parentAncestors = await DirectoryRepository.getAncestorsWithNamesById(userId, parentDirectoryId);
        const directoryName = await DirectoryRepository.getNameById(userId, parentDirectoryId);
        parentAncestors.push({ _id: parentDirectoryId, name: directoryName! });
        const pathSegments = parentAncestors.map((ancestor) => ancestor.name).filter((name) => name.startsWith('root'));
        const filePath = pathSegments.join('/') + `/${fileId}${extension}`;
        return filePath;
    }

    static async deletePhysicalFile(fileId: string, extension: string) {
        const command = new DeleteObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: `${fileId}${extension}`,
        });
        await s3Client.send(command);
    }

    static async deleteMultiplePhysicalFiles(keys: { Key: string }[]) {
        const command = new DeleteObjectsCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Delete: {
                Objects: keys,
                Quiet: false,
            }
        });
        await s3Client.send(command);
    }

    static async getUploadUrl(fileId: string, extension: string, fileType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: `${fileId}${extension}`,
            ContentType: fileType || 'application/octet-stream',
        })
        const url = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600,
            signableHeaders: new Set(['Content-Type']),
         });
        return url;
    }

    static async getFileUrl(fileId: string, fileName: string, extension: string, action?: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: `${fileId}${extension}`,
            ResponseContentDisposition: `${action ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`,
        })
        const url = await getSignedUrl(s3Client, command, {
            signableHeaders: new Set(['Response-Content-Disposition']), 
            expiresIn: action ? 300 : 3600, 
        });
        return url;
    }

    static async getFileCloudFrontUrl(fileId: string, fileName: string, extension: string, action?: string): Promise<string> {
        const cloudFrontDomain = env.CLOUDFRONT_DOMAIN;
        const privateKey = env.CLOUDFRONT_PRIVATE_KEY;
        const keyPairId = env.CLOUDFRONT_KEY_PAIR_ID;
        const rawurl = `https://${cloudFrontDomain}/${fileId}${extension}?response-content-disposition=${encodeURIComponent(`${action ? 'attachment' : 'inline'}; filename="${fileName}"`)}`;

        const signedUrl = getSignedUrlFromCloudFront({
            url: rawurl,
            keyPairId: keyPairId,
            privateKey: privateKey,
            dateLessThan: action ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
        return signedUrl;
    }

    static async invalidateCloudFrontCache(objectKeys: string[]): Promise<void> {
        const distributionId = env.CLOUDFRONT_DISTRIBUTION_ID;
        const itemsToInvalidate = objectKeys.map(objectKey => `/${objectKey}`);

        const command = new CreateInvalidationCommand({
            DistributionId: distributionId,
            InvalidationBatch: {
                CallerReference: `${Date.now()}-${Math.random()}`,
                Paths: {
                    Quantity: itemsToInvalidate.length,
                    Items: itemsToInvalidate,
                }
            }
        })

        await cloudFrontClient.send(command);
        console.log("CloudFront cache invalidated for deleted files.");
    }
}