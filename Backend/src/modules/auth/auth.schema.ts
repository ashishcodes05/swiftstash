import { z } from "zod";

export const checkUserExistsSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
    })
});

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })
})

export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(8, 'Current password must be at least 8 characters long').optional(),
        newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    })
});

export const loginWithGoogleSchema = z.object({
    body: z.object({
        code: z.string().min(1, "Token is required"),
    })
});

export const generateAndSendOtpSchema = z.object({
    body: z.object({
        email: z.email("Invalid email address"),
    })
})

export const verifyOtpSchema = z.object({
    body: z.object({
        email: z.email("Invalid email address"),
        otp: z.string().length(6, "OTP must be 6 characters long"),
    })
})

export const sessionSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    createdAt: z.string().min(1, 'Created At is required'),
})
