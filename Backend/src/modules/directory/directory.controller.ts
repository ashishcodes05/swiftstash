import type { Request, Response } from "express";
import type { ApiErrorResponse, ApiResponse } from "../../types/api.types.js";
import { UserRepository } from "../user/user.repository.js";
import { DirectoryService } from "./directory.service.js";
import type { FileData } from "../file/file.types.js";
import type { CreateDirectorySchema, DeleteDirectorySchema, DeleteMultipleDirectoriesSchema, DirectoryData, GetDirectoryItemsByIdResponseData, GetDirectorySchema, RenameDirectorySchema } from "./directory.types.js";

export class DirectoryController {
    static async getDirectoryItemsById(req : Request<GetDirectorySchema["params"]>, res : Response<ApiResponse<GetDirectoryItemsByIdResponseData> | ApiErrorResponse>) {
        const userId = req.userId!;
        let parentDirectoryId = req.params.dirId;
        if(!parentDirectoryId){
            const rootDirectory = await UserRepository.getRootDirectoryById(userId);
            if(!rootDirectory) return res.status(404).json({success: false, error: "Root directory not found"});
            parentDirectoryId = rootDirectory;
        }
        const {files, directories} = await DirectoryService.getDirectoryItems(userId, parentDirectoryId);
        const formattedFiles : FileData[] = files.map(file => {
            return {
                id: file._id.toString(),
                name: file.name,
                extension: file.extension,
                size: file.size,
                type: file.type,
                ownerName: file.userId.name,
                ownerEmail: file.userId.email,
                ownerPicture: file.userId.picture,
                isShared: file.isShared,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt
            }
        });
        const formattedDirectories : DirectoryData[] = directories.map(directory => {
            return {
                id: directory._id.toString(),
                name: directory.name,
                type: directory.type,
                ownerName: directory.userId.name,
                ownerEmail: directory.userId.email,
                ownerPicture: directory.userId.picture,
                isShared: directory.isShared,
                createdAt: directory.createdAt,
                updatedAt: directory.updatedAt
            }
        });
        res.json({ success: true, message: "Directory items fetched successfully", data: { files: formattedFiles, directories: formattedDirectories } });
    }

    static async createDirectory(req : Request<CreateDirectorySchema["params"], {}, CreateDirectorySchema["body"]>, res : Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        let parentDirectoryId = req.params.dirId;
        const { directoryName } = req.body;
        if(!parentDirectoryId){
            const rootDirectory = await UserRepository.getRootDirectoryById(userId);
            if(!rootDirectory) return res.status(404).json({success: false, error: "Root directory not found"});
            parentDirectoryId = rootDirectory;
        }
        await DirectoryService.createDirectory(userId, directoryName, parentDirectoryId);
        return res.status(200).json({success: true, message: "New Directory created"});
    }

    static async renameDirectory(req : Request<RenameDirectorySchema["params"], {}, RenameDirectorySchema["body"]>, res : Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const directoryId = req.params.dirId;
        const { newDirectoryName } = req.body;
        const isRenamed = await DirectoryService.renameDirectory(userId, directoryId, newDirectoryName);
        if(!isRenamed) return res.status(404).json({success: false, error: "Directory not found"});
        return res.status(200).json({success: true, message: "Directory is renamed Successfully"});
    }

    static async deleteDirectoryById(req : Request<DeleteDirectorySchema["params"]>, res : Response<ApiResponse | ApiErrorResponse>) {
        const userId = req.userId!;
        const directoryId = req.params.dirId;
        await DirectoryService.deleteDirectory(userId, directoryId);
        return res.status(200).json({success: true, message: "Directory is deleted Successfully"}); 
    }

    static async deleteMultipleDirectories(req: Request<{}, {}, DeleteMultipleDirectoriesSchema["body"]>, res : Response<ApiResponse | ApiErrorResponse>){
        const userId = req.userId!;
        const { directoryIds } = req.body;
        await DirectoryService.deleteMultipleDirectories(userId, directoryIds);
        return res.status(200).json({success: true, message: "Directories are deleted Successfully"});
    }
}