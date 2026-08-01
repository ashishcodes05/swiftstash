import { z } from "zod";

export const setPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(8, "Current password must be at least 8 characters long"),
        newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

export const deleteAccountSchema = z.object({
    body: z.object({
        password: z.string().min(1, "Password is required"),
    }),
});