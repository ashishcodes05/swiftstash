import type { SetOptional, Simplify } from "type-fest";
import type { generateAndSendOtpSchema, loginSchema, loginWithGoogleSchema, registerSchema, sessionSchema, verifyOtpSchema } from "./auth.schema.js";
import { z } from "zod";
import type { UserSchema } from "../user/user.types.js";
import type { Types } from "mongoose";

export type SessionSchema = z.infer<typeof sessionSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type GenerateAndSendOtpSchema = z.infer<typeof generateAndSendOtpSchema>;
export type LoginWithGoogleSchema = z.infer<typeof loginWithGoogleSchema>;

export type RegisterBody = RegisterSchema['body'];
export type LoginBody = LoginSchema['body'];
export type GenerateAndSendOtpBody = Pick<LoginBody, 'email'>;
export type VerifyOtpBody = VerifyOtpSchema['body'];
export type LoginWithGoogleBody = LoginWithGoogleSchema['body'];

export type SessionData = {
    sessionId: string;
    userId: string;
    createdAt: Date;
}

export type UserData = Simplify<{_id: Types.ObjectId} & SetOptional<UserSchema, 'password' | 'hasPassword' | 'picture' | 'role' | 'isDisabled' | 'isDeleted' | 'createdAt' | 'updatedAt'>>;
