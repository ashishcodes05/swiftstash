import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { s3Client } from "../../config/s3client.js";
import type { FileMetadata } from "./file.types.js";
import { DirectoryRepository } from "../directory/directory.repository.js";

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
}