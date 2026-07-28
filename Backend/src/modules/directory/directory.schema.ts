import { z } from "zod";

export const getDirectoryItemsByIdSchema = z.object({
    params: z.object({
        dirId: z.string().min(1, "Directory ID is required").optional(),
    })
});

export const createDirectorySchema = z.object({
    params: z.object({
        dirId: z.string().min(1, "Directory ID is required").optional(),
    }),
    body: z.object({
        directoryName: z.string().min(1, "Directory name is required"),
    })
});

export const renameDirectorySchema = z.object({
    params: z.object({
        dirId: z.string().min(1, "Directory ID is required"),
    }),
    body: z.object({
        newDirectoryName: z.string().min(1, "New directory name is required"),
    })
});

export const deleteDirectoryByIdSchema = z.object({
    params: z.object({
        dirId: z.string().min(1, "Directory ID is required"),
    })
});

export const deleteMultipleDirectoriesSchema = z.object({
    body: z.object({
        directoryIds: z.array(z.string().min(1, "Directory ID is required")).min(1, "At least one directory ID is required"),
    })
});