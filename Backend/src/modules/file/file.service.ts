import { fileTypeFromFile } from "file-type";
import { FileRepository } from "./file.repository.js";
import { StorageService } from "./storage.service.js";
import mimetype from "mime-types";
import path from "path";
import { DirectoryRepository } from "../directory/directory.repository.js";
import { DirectoryService } from "../directory/directory.service.js";
import type { ZipArchive } from "archiver";
import { Types } from "mongoose";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { s3Client } from "../../config/s3client.js";
import type { Readable } from "stream";

export class FileService {
    static async getFileMetadata(userId: string, fileId: string) {
        const fileData = await FileRepository.getFileById(userId, fileId);
        if(!fileData) {
            return null;
        }
        const filePath = await StorageService.getFilePath(fileData._id.toString(), fileData.extension, fileData.parentDirectoryId.toString(), userId);
        return { ...fileData, path: filePath };
    }

    static async getFileType(fileId: string, extension: string, parentDirectoryId: string, userId: string) {
        const filePath = await StorageService.getFilePath(fileId, extension, parentDirectoryId, userId);
        const fileType = await fileTypeFromFile(filePath);
        if(fileType) return fileType;
        const mime = mimetype.lookup(filePath);
        if(mime) {
            return {
                ext: mimetype.extension(mime),
                mime
            };
        }
        return false;
    }

    static async renameFile(userId: string, fileId: string, newName: string) {
        const originalExtension = await FileRepository.getExtensionById(userId, fileId);
        if(!originalExtension) {
            return false;
        }
        const extension = path.extname(newName);
        if(extension && extension !== originalExtension) {
            return false;
        }
        return await FileRepository.updateFileName(userId, fileId, newName);
    }

    static async deleteFile(userId: string, fileId: string) {
        const fileData = await FileRepository.findByIdAndDelete(userId, fileId);
        if(!fileData) return null;
        await StorageService.deletePhysicalFile(fileId, fileData.extension);
        await DirectoryService.updateParentDirectorySize(userId, fileData.parentDirectoryId.toString(), -fileData.size);
        await StorageService.invalidateCloudFrontCache([`${fileData._id}${fileData.extension}`]);
        return fileData;
    }

    static async deleteMultipleFiles(userId: string, fileIds: string[]) {
        const filesData = await FileRepository.findFilesByIdsAndDelete(userId, fileIds);
        if(!filesData || filesData.length === 0) return null;
        const keys = filesData.map(file => ({ Key: `${file._id}${file.extension}` }));
        await StorageService.deleteMultiplePhysicalFiles(keys);
        await Promise.all(filesData.map(file =>
            DirectoryService.updateParentDirectorySize(userId, file.parentDirectoryId.toString(), -file.size)
        ));
        await StorageService.invalidateCloudFrontCache(keys.map(file => file.Key));
        return true;
    }

    static async uploadFile(parentDirectoryId: string, relativePath: string, file: Express.Multer.File, fileType: string, userId: string) {
        let currentDirectoryId = parentDirectoryId;
        if (relativePath.includes('/')) {
            const directories = relativePath?.split('/') || [];
            directories.pop();
            for (const directory of directories) {
                const ancestors = await DirectoryRepository.getAncestorsById(userId, currentDirectoryId);
                ancestors.push(currentDirectoryId);
                const directoryDoc = await DirectoryRepository.insertDirectory(directory, userId, currentDirectoryId, ancestors);
                currentDirectoryId = directoryDoc._id.toString();
            }
        }
        await FileRepository.saveFileMetadata({
            _id: file._id!.toString(),
            name: file.originalname,
            extension: file.extension!,
            type: fileType,
            size: file.size,
            parentDirectoryId: currentDirectoryId,
            userId: userId,
            isShared: false,
            isUploading: false
        });
        await DirectoryService.updateParentDirectorySize(userId, currentDirectoryId, file.size);
    }

    static async initiateUpload(parentDirectoryId: string, fileName: string, size: number, relativePath: string, fileType: string, userId: string) {
        let currentDirectoryId = parentDirectoryId;
        if (relativePath.includes('/')) {
            const directories = relativePath?.split('/') || [];
            directories.pop();
            for (const directory of directories) {
                const ancestors = await DirectoryRepository.getAncestorsById(userId, currentDirectoryId);
                ancestors.push(currentDirectoryId);
                const directoryDoc = await DirectoryRepository.insertDirectory(directory, userId, currentDirectoryId, ancestors);
                currentDirectoryId = directoryDoc._id.toString();
            }
        }
        const fileId = new Types.ObjectId().toString();
        const fileData = {
            _id: fileId,
            name: fileName,
            extension: path.extname(fileName),
            type: fileType,
            size: size,
            parentDirectoryId: currentDirectoryId,
            userId: userId,
            isShared: false,
            isUploading: true
        };
        await FileRepository.saveFileMetadata(fileData);
        return fileData;
    }

    static async completeUpload(userId: string, fileId: string) {
        const fileData = await FileRepository.getFileById(userId, fileId);
        if (!fileData) {
            return { code: 404, message: 'File Not Found' };
        }
        const headCommand = new HeadObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: `${fileId}${fileData.extension}`
        })
        const s3Object = await s3Client.send(headCommand);
        if (!s3Object.ContentLength || s3Object.ContentLength !== fileData.size) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key: `${fileId}${fileData.extension}`
            });
            await s3Client.send(deleteCommand);
            return { code: 400, message: 'File size mismatch' };
        }
        fileData.isUploading = false;
        const isUpdated = await FileRepository.updateUploadStatus(userId, fileId, false);
        if (!isUpdated) {
            return { code: 500, message: 'Failed to update upload status' };
        }
        await DirectoryService.updateParentDirectorySize(userId, fileData.parentDirectoryId.toString(), fileData.size);
        return { code: 200, message: 'File upload completed successfully' };
    }

    static async addFileToArchive(archive: ZipArchive, fileId: string, userId: string, currentZipPath: string) {
        const fileData = await FileRepository.getFileById(userId, fileId);
        if(!fileData) {
            console.warn(`File not found in database: ${fileId}`);
            archive.append(`File not found in database: ${fileId}`, { name: path.posix.join(currentZipPath, `${fileId}_not_found.txt`) });
            return;
        }
        try{
            const command = new GetObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key: `${fileId}${fileData.extension}`
            });
            const s3Object = await s3Client.send(command);
            if(!s3Object.Body) {
                console.warn(`File not found: ${fileId}${fileData.extension}`);
                archive.append(`File not found: ${fileId}${fileData.extension}`, { name: path.posix.join(currentZipPath, `${fileData.name}_not_found.txt`) });
                return;
            }
            archive.append(s3Object.Body as Readable, { name: path.posix.join(currentZipPath, fileData.name) });
        } catch (error) {
            console.error(`Error fetching file from S3: ${fileId}${fileData.extension}`, error);
            archive.append(`Error fetching file from S3: ${fileId}${fileData.extension}`, { name: path.posix.join(currentZipPath, `${fileData.name}_error.txt`) });
            return;
        }
    }

    static async processDirectoryForArchive(archive: ZipArchive, directoryId: string, directoryName: string, userId: string, currentZipPath: string) {
        const newZipPath = path.posix.join(currentZipPath, `${directoryName}/`);
        archive.append(Buffer.from(''), { name: newZipPath });
        const childDirectories = await DirectoryRepository.getNestedDirectories(userId, directoryId);
        for (const childDirectory of childDirectories) {
            await this.processDirectoryForArchive(archive, childDirectory._id.toString(), childDirectory.name, userId, newZipPath);
        }
        const childFiles = await FileRepository.getFilesByDirectoryId(userId, directoryId);
        for (const childFile of childFiles) {
            await this.addFileToArchive(archive, childFile._id.toString(), userId, newZipPath);
        }
    }
}