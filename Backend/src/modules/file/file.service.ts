import { fileTypeFromFile } from "file-type";
import { FileRepository } from "./file.repository.js";
import { StorageService } from "./storage.service.js";
import mimetype from "mime-types";
import path from "path";
import { DirectoryRepository } from "../directory/directory.repository.js";
import { DirectoryService } from "../directory/directory.service.js";
import type { ZipArchive } from "archiver";
import { existsSync } from "fs";

export class FileService {
    static async getFileMetadata(userId: string, fileId: string) {
        const fileData = await FileRepository.getFileById(userId, fileId);
        if(!fileData) {
            return null;
        }
        const filePath = await StorageService.getFilePath(fileId, fileData.extension);
        return { ...fileData, path: filePath };
    }

    static async getFileType(fileId: string, extension: string) {
        const filePath = await StorageService.getFilePath(fileId, extension);
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
        return fileData;
    }

    static async deleteMultipleFiles(userId: string, fileIds: string[]) {
        const filesData = await FileRepository.findFilesByIdsAndDelete(userId, fileIds);
        if(!filesData || filesData.length === 0) return null;
        await Promise.all(filesData.map(async({ _id, extension }) => {
            await StorageService.deletePhysicalFile(_id.toString(), extension);
        }));
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
            isShared: false
        });
        await DirectoryService.updateParentDirectorySize(userId, currentDirectoryId, file.size);
    }

    static async addFileToArchive(archive: ZipArchive, fileId: string, userId: string, currentZipPath: string) {
        const fileData = await FileService.getFileMetadata(userId, fileId);
        if(fileData && existsSync(fileData.path)) {
            archive.file(fileData.path, { name: path.join(currentZipPath, fileData.name) });
        } else {
            console.warn(`File not found: ${fileData?.path}`);
            archive.append(`File not found: ${fileData?.name}`, { name: path.join(currentZipPath, `${fileData?.name}_not_found.txt`) });
        }
    }

    static async processDirectoryForArchive(archive: ZipArchive, directoryId: string, directoryName: string, userId: string, currentZipPath: string) {
        const newZipPath = path.join(currentZipPath, `${directoryName}/`);
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