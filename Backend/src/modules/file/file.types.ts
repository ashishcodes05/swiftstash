import type { Types } from "mongoose";
import { z } from "zod";
import type { completeUploadSchema, deleteFileByIdSchema, deleteMultipleFilesSchema, downloadMultipleFilesSchema, getFileByIdSchema, initiateUploadSchema, renameFileSchema, uploadFileSchema } from "./file.schema.js";

export interface FileSchema {
    name: string;
    extension: string;
    type: string;
    size: number;
    parentDirectoryId: Types.ObjectId;
    userId: Types.ObjectId;
    isShared: boolean;
    isUploading: boolean;
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
    isUploading: boolean;
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
export type InitiateUploadSchema = z.infer<typeof initiateUploadSchema>
export type CompleteUploadSchema = z.infer<typeof completeUploadSchema>
export type DownloadMultipleFilesSchema = z.infer<typeof downloadMultipleFilesSchema>
export type RenameFileSchema = z.infer<typeof renameFileSchema>
export type DeleteFileSchema = z.infer<typeof deleteFileByIdSchema>
export type DeleteMultipleFilesSchema = z.infer<typeof deleteMultipleFilesSchema>