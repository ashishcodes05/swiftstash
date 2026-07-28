import { z } from "zod";

export const getFileByIdSchema = z.object({
    params: z.object({
        fileId: z.string().min(1, "File ID is required"),
    })
});

export const uploadFileSchema = z.object({
    body: z.object({
        parentDirectoryId: z.string().min(1, "Parent Directory ID is required").optional(),
        relativePath: z.string().min(1, "Relative Path is required"),
    })
});

export const downloadMultipleFilesSchema = z.object({
    body: z.object({
        items: z.string().min(1, "Items are required"),
    })
});

export const renameFileSchema = z.object({
    params: z.object({
        fileId: z.string().min(1, "File ID is required"),
    }),
    body: z.object({
        newFileName: z.string().min(1, "New file name is required"),
    })
});

export const deleteFileByIdSchema = z.object({
    params: z.object({
        fileId: z.string().min(1, "File ID is required"),
    })
});

export const deleteMultipleFilesSchema = z.object({
    body: z.object({
        fileIds: z.array(z.string().min(1, "File ID is required")).min(1, "At least one file ID is required"),
    })
});