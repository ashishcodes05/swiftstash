import type { Types } from "mongoose";
import type { SetOptional, Simplify } from "type-fest";
import type { FileData } from "../file/file.types.js";
import type { createDirectorySchema, deleteDirectoryByIdSchema, deleteMultipleDirectoriesSchema, getDirectoryItemsByIdSchema, renameDirectorySchema } from "./directory.schema.js";
import { z } from "zod";

export interface DirectorySchema {
    name: string;
    type: string;
    parentDirectoryId: Types.ObjectId | null;
    userId: Types.ObjectId
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type DirectoryMetadata = Simplify<{_id: Types.ObjectId} & SetOptional<DirectorySchema, 'parentDirectoryId' | 'isShared' | 'createdAt' | 'updatedAt'>>;

export interface DirectoryData  {
    id: string;
    name: string;
    type: string;
    ownerName: string;
    ownerEmail: string;
    ownerPicture: string;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetDirectoryItemsByIdResponseData {
    files: FileData[];
    directories: DirectoryData[];
}

export type GetDirectorySchema = z.infer<typeof getDirectoryItemsByIdSchema>;
export type CreateDirectorySchema = z.infer<typeof createDirectorySchema>;
export type RenameDirectorySchema = z.infer<typeof renameDirectorySchema>;
export type DeleteDirectorySchema = z.infer<typeof deleteDirectoryByIdSchema>;
export type DeleteMultipleDirectoriesSchema = z.infer<typeof deleteMultipleDirectoriesSchema>;
