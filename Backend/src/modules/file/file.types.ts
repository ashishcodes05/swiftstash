import type { Types } from "mongoose";
import { z } from "zod";
import type { deleteFileByIdSchema, deleteMultipleFilesSchema, downloadMultipleFilesSchema, getFileByIdSchema, renameFileSchema, uploadFileSchema } from "./file.schema.js";

export interface FileSchema {
    name: string;
    extension: string;
    type: string;
    size: number;
    parentDirectoryId: Types.ObjectId;
    userId: Types.ObjectId;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface FileMetadata {
    _id?: string;
    name: string;
    extension: string;
    type: string;
    size: number;
    parentDirectoryId: string;
    userId: string;
    isShared?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FileData  {
    id: string;
    name: string;
    extension: string;
    size: number;
    type: string;
    ownerName: string;
    ownerEmail: string;
    ownerPicture: string;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DownloadItemSchema {
    id: string;
    type: string;
}

export type GetFileSchema = z.infer<typeof getFileByIdSchema>
export type UploadFileSchema = z.infer<typeof uploadFileSchema>
export type DownloadMultipleFilesSchema = z.infer<typeof downloadMultipleFilesSchema>
export type RenameFileSchema = z.infer<typeof renameFileSchema>
export type DeleteFileSchema = z.infer<typeof deleteFileByIdSchema>
export type DeleteMultipleFilesSchema = z.infer<typeof deleteMultipleFilesSchema>