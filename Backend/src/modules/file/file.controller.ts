import type { Request, Response } from "express";
import { FileService } from "./file.service.js";
import type { ApiErrorResponse, ApiResponse } from "../../types/api.types.js";
import type { CompleteUploadSchema, DeleteFileSchema, DeleteMultipleFilesSchema, DownloadItemSchema, DownloadMultipleFilesSchema, GetFileSchema, InitiateUploadSchema, RenameFileSchema, UploadFileSchema} from "./file.types.js";
import { UserRepository } from "../user/user.repository.js";
import { ZipArchive } from "archiver"
import fs from "fs/promises";
import { DirectoryRepository } from "../directory/directory.repository.js";
import { StorageService } from "./storage.service.js";

export class FileController {
    static async getFileById(req : Request<GetFileSchema["params"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { fileId } = req.params;
        const fileData = await FileService.getFileMetadata(userId, fileId);
        if(!fileData) {
            return res.status(404).json({ success: false, error: 'File Not Found' });
        }
        const { action } = req.query;
        if (action && action == 'download') {
            const url = await StorageService.getFileCloudFrontUrl(fileId, fileData.name, fileData.extension, action);
            return res.redirect(url);
        }
        const url = await StorageService.getFileCloudFrontUrl(fileId, fileData.name, fileData.extension);
        return res.redirect(url);
    }

    static async uploadFile(req: Request<{}, {}, UploadFileSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const uploadedFile = req.file;
        if(!uploadedFile || !uploadedFile._id || !uploadedFile.extension) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const userId = req.userId!;
        let parentDirectoryId = req.body.parentDirectoryId;
        const relativePath = req.body.relativePath;
        if(!parentDirectoryId) {
            const rootDirectory = await UserRepository.getRootDirectoryById(userId);
            if(!rootDirectory) {
                return res.status(400).json({ success: false, error: "User's Root directory not found" });
            }
            parentDirectoryId = rootDirectory;
        }
        const fileType = await FileService.getFileType(uploadedFile._id, uploadedFile.extension, parentDirectoryId, userId);
        if(!fileType || fileType.ext !== uploadedFile.extension.replace('.', '')) {
            await fs.unlink(uploadedFile.path);
            return res.status(400).json({ success: false, error: 'Unsupported file type' });
        }
        console.log(fileType)
        await FileService.uploadFile(parentDirectoryId, relativePath, uploadedFile, fileType.mime, userId);
        return res.status(200).json({ success: true, message: 'File uploaded successfully' });
    }

    static async initiateUpload(req: Request<{}, {}, InitiateUploadSchema["body"]>, res: Response<ApiResponse<{ uploadUrl: string, fileId: string }> | ApiErrorResponse>) {
        const userId = req.userId!;
        let parentDirectoryId = req.body.parentDirectoryId;
        if(!parentDirectoryId){
            const rootDirectory = await UserRepository.getRootDirectoryById(userId);
            if(!rootDirectory) {
                return res.status(400).json({ success: false, error: "User's Root directory not found" });
            }
            parentDirectoryId = rootDirectory;
        }
        const { fileData } = req.body;
        const fileMetadata = await FileService.initiateUpload(parentDirectoryId, fileData.name, fileData.size, fileData.relativePath, fileData.fileType, userId);
        const uploadUrl = await StorageService.getUploadUrl(fileMetadata._id!, fileMetadata.extension, fileData.fileType);
        return res.status(200).json({ success: true, message: "fileMetadata retrieved successfully", data: { uploadUrl, fileId: fileMetadata._id } });
    }

    static async completeUpload(req: Request<{}, {}, CompleteUploadSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { fileId } = req.body;
        try {
            const uploadResult = await FileService.completeUpload(userId, fileId);
            if(uploadResult.code !== 200) {
                const { code, message } = uploadResult;
                return res.status(code).json({ success: false, error: message });
            }
        } catch (error) {
            console.error("Error verifying uploaded file:", error);
            return res.status(502).json({ success: false, error: "We could not verify the uploaded file. Please try again." });
        }
        return res.status(200).json({ success: true, message: 'File upload completed successfully' });
    }

    static async cancelUpload(req: Request<{}, {}, CompleteUploadSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { fileId } = req.body;
        const canceledFile = await FileService.cancelUpload(userId, fileId);
        if (!canceledFile) {
            return res.status(404).json({ success: false, error: 'Upload Not Found' });
        }
        return res.status(200).json({ success: true, message: 'Upload canceled successfully' });
    }

    static async downloadMultipleFiles(req: Request<{}, {}, DownloadMultipleFilesSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const items : DownloadItemSchema[] = JSON.parse(req.body.items || '[]');
        if(!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'No items for downloading' });
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=SwiftStash_download.zip');

        const archive = new ZipArchive({
            zlib: { level: 5 }
        });

        archive.on('error', (err) => {
            console.error('Error creating zip archive:', err);
            if(!res.headersSent) {
                return res.status(500).json({ success: false, error: 'Error creating zip archive' });
            }
        });

        archive.pipe(res);

        for (const item of items) {
            if (item.type === 'file') {
                await FileService.addFileToArchive(archive, item.id, userId, '');
            } else if (item.type === 'directory') {
                const directoryName = await DirectoryRepository.getNameById(userId, item.id);
                if(!directoryName) {
                    continue;
                }
                await FileService.processDirectoryForArchive(archive, item.id, directoryName, userId, '');
            }
        }

        await archive.finalize();
        
    }

    static async renameFile(req: Request<RenameFileSchema["params"], {}, RenameFileSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const fileId = req.params.fileId;
        const { newFileName } = req.body;
        const isFileRenamed = await FileService.renameFile(userId, fileId, newFileName);
        if (!isFileRenamed) {
            return res
            .status(404)
            .json({ success: false, error: "File can't be renamed. File doesn't exist" });
        }
        return res.status(200).json({ success: true, message: 'File renamed Successfully' });
    }

    static async deleteFileById(req: Request<DeleteFileSchema["params"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const fileId = req.params.fileId;
        const fileData = await FileService.deleteFile(userId, fileId);
        if(!fileData) {
            return res.status(404).json({ success: false, error: 'File Not Found' });
        }
        return res.status(200).json({ success: true, message: 'File deleted successfully' });
    }

    static async deleteMultipleFiles(req: Request<{}, {}, DeleteMultipleFilesSchema["body"]>, res: Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const { fileIds } = req.body;
        console.log(fileIds)
        if(!fileIds || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No files for deletion' });
        }
        const isFilesDeleted = await FileService.deleteMultipleFiles(userId, fileIds);
        if(!isFilesDeleted) {
            return res.status(404).json({ success: false, error: 'Files Not Found' });
        }
        return res.status(200).json({ success: true, message: 'Files deleted successfully' });
    }
}